import React, { useState, useEffect } from "react";
import {
  DialogBody,
  DialogFooter,
  Button,
  Input,
  Select,
  Option,
  IconButton,
  Typography
} from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import axios from "../../utils/axiosConfig";
import Swal from "sweetalert2";

export function CrearVenta({ clientes, productos, fetchVentas, onCancel }) {
  const [selectedVenta, setSelectedVenta] = useState({
    id_cliente: "",
    numero_venta: "",
    fecha_venta: "",
    fecha_entrega: "",
    id_estado: 2,
    detalleVentas: [],
    cliente: { nombre: "", contacto: "" },
    total: 0, // Inicializar total
    subtotal: 0 // Inicializar subtotal
  });

  const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });
  
  const [errors, setErrors] = useState({});
  const [pedidos, setPedidos] = useState([]); // Estado para almacenar los pedidos
  const [loadingPedidos, setLoadingPedidos] = useState(true); // Estado de carga

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/pedidos");
        setPedidos(response.data); // Actualiza el estado con los pedidos obtenidos
        setLoadingPedidos(false); // Termina la carga
      } catch (error) {
        console.error("Error fetching pedidos:", error);
        setLoadingPedidos(false); // Termina la carga incluso si hay error
      }
    };

    fetchPedidos();
  }, []);


  useEffect(() => {
    const validarCampos = () => {
      const newErrors = {};
  
      // Validación de cliente
      if (!selectedVenta.id_cliente) {
        newErrors.id_cliente = "El cliente es obligatorio";
      }
  
      // Validación de fecha de venta
      const today = new Date().toISOString().split("T")[0]; 
      if (!selectedVenta.fecha_venta) {
        newErrors.fecha_venta = "La fecha de venta es obligatoria";
      } else if (selectedVenta.fecha_venta !== today) {
        newErrors.fecha_venta = "La fecha de venta debe ser hoy.";
      }
  
      // Validación de fecha de entrega (obligatoria y debe ser a futuro)
      const futureDate = (date) => new Date(date) > new Date(today);
      if (!selectedVenta.fecha_entrega) {
        newErrors.fecha_entrega = "La fecha de entrega es obligatoria";
      } else if (!futureDate(selectedVenta.fecha_entrega)) {
        newErrors.fecha_entrega = "La fecha de entrega debe ser en el futuro";
      }
  
      // Validación de detalles de ventas
      if (selectedVenta.detalleVentas.length === 0) {
        newErrors.detalleVentas = "Debe agregar al menos un detalle de venta";
      }
  
      selectedVenta.detalleVentas.forEach((detalle, index) => {
        if (!detalle.id_producto) {
          newErrors[`producto_${index}`] = "El producto es obligatorio";
        }
        if (!detalle.cantidad || detalle.cantidad <= 0) {
          newErrors[`cantidad_${index}`] = "La cantidad es obligatoria y debe ser mayor que 0";
        }
      });
  
      setErrors(newErrors);
    };
  
    validarCampos();
  }, [selectedVenta]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedVenta({ ...selectedVenta, [name]: value });
  };

  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    const detalles = [...selectedVenta.detalleVentas];
  
    // Asignar precio unitario si se selecciona un producto
    if (name === 'id_producto') {
      const productoSeleccionado = productos.find(p => p.id_producto === parseInt(value));
      detalles[index].precio_unitario = productoSeleccionado ? productoSeleccionado.precio : "";
    }
  
    // Asignar el valor al detalle específico
    detalles[index][name] = value;
  
    // Recalcular subtotal cuando se cambie la cantidad o el precio unitario
    if (name === 'cantidad' || name === 'precio_unitario') {
      const cantidad = parseInt(detalles[index].cantidad) || 0;
      const precioUnitario = parseFloat(detalles[index].precio_unitario) || 0;
      detalles[index].subtotal = cantidad * precioUnitario;
    }
  
    // Verificar si el producto ya fue agregado para evitar duplicados
    if (name === 'id_producto') {
      const productoDuplicado = selectedVenta.detalleVentas.some((detalle, idx) => detalle.id_producto === parseInt(value) && idx !== index);
      if (productoDuplicado) {
        Toast.fire({
          icon: "error",
          title: "Este producto ya ha sido agregado. Elige otro."
        });
        return;
      }
    }
  
    setSelectedVenta({ ...selectedVenta, detalleVentas: detalles });
    updateTotal(detalles);
  };
  
  const handleAddDetalle = () => {
    // Verificar si ya hay un producto sin seleccionar (id_producto vacío)
    const existeProductoSinSeleccionar = selectedVenta.detalleVentas.some(detalle => detalle.id_producto === "");
    if (existeProductoSinSeleccionar) {
      Toast.fire({
        icon: "error",
        title: "Ya tienes un producto sin seleccionar. Completa el formulario antes de agregar otro."
      });
      return;
    }
  
    // Añadir un nuevo detalle vacío para seleccionar un producto
    setSelectedVenta({
      ...selectedVenta,
      detalleVentas: [...selectedVenta.detalleVentas, { id_producto: "", cantidad: "", precio_unitario: "", subtotal: 0 }]
    });
  };
  

  const handleRemoveDetalle = (index) => {
    const detalles = [...selectedVenta.detalleVentas];
    detalles.splice(index, 1);
    setSelectedVenta({ ...selectedVenta, detalleVentas: detalles });
    updateTotal(detalles);
  };

  const updateTotal = (detalles) => {
    const total = detalles.reduce((acc, detalle) => acc + (detalle.subtotal || 0), 0);
    setSelectedVenta(prevState => ({
      ...prevState,
      total
    }));
  };

  const handlePedidoChange = (numero_pedido) => {
    console.log("Número de pedido seleccionado:", numero_pedido);
    const pedido = pedidos.find(p => p.numero_pedido === numero_pedido);
    if (pedido) {
      console.log("Pedido encontrado:", pedido);
      const detalles = pedido.detallesPedido.map(detalle => ({
        id_producto: detalle.id_producto,
        cantidad: detalle.cantidad,
        precio_unitario: parseFloat(productos.find(p => p.id_producto === detalle.id_producto)?.precio || 0),
        subtotal: parseFloat(productos.find(p => p.id_producto === detalle.id_producto)?.precio || 0) * detalle.cantidad
      }));
      setSelectedVenta({
        ...selectedVenta,
        id_cliente: pedido.id_cliente,
        numero_venta: pedido.numero_pedido,
        fecha_venta: pedido.fecha_pago ? pedido.fecha_pago.split('T')[0] : "",
        fecha_entrega: pedido.fecha_entrega ? pedido.fecha_entrega.split('T')[0] : "",
        detalleVentas: detalles
      });
      updateTotal(detalles);
    } else {
      console.log("No se encontró el pedido con el número:", numero_pedido);
    }
  };

  const handleSave = async () => {
    const newErrors = {};
    const today = new Date().toISOString().split("T")[0]; 
    const futureDate = (date) => new Date(date) > new Date(today);
  
    // Validación de cliente
    if (!selectedVenta.id_cliente) {
      newErrors.id_cliente = "El cliente es obligatorio";
    }
  
    // Validación de fecha de venta
    if (!selectedVenta.fecha_venta) {
      newErrors.fecha_venta = "La fecha de venta es obligatoria";
    } else if (selectedVenta.fecha_venta !== today) {
      newErrors.fecha_venta = "La fecha de venta debe ser hoy.";
    }
  
    // Validación de fecha de entrega (obligatoria y debe ser a futuro)
    if (!selectedVenta.fecha_entrega) {
      newErrors.fecha_entrega = "La fecha de entrega es obligatoria";
    } else if (!futureDate(selectedVenta.fecha_entrega)) {
      newErrors.fecha_entrega = "La fecha de entrega debe ser en el futuro";
    }
  
    // Validación de detalles de ventas
    if (selectedVenta.detalleVentas.length === 0) {
      newErrors.detalleVentas = "Debe agregar al menos un detalle de venta";
    }

    const productosIds = selectedVenta.detalleVentas.map(detalle => detalle.id_producto);
    const productosUnicos = new Set(productosIds);
    
    if (productosIds.length !== productosUnicos.size) {
      Toast.fire({
        icon: "error",
        title: "No puedes crear la venta. Hay productos duplicados."
      });
      return; // Evita proceder con la creación de la venta
    }
  
    selectedVenta.detalleVentas.forEach((detalle, index) => {
      if (!detalle.id_producto) {
        newErrors[`producto_${index}`] = "El producto es obligatorio";
      }
      if (!detalle.cantidad) {
        newErrors[`cantidad_${index}`] = "La cantidad es obligatoria";
      }
    });
  
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Toast.fire({
        icon: "error",
        title: "Por favor, complete todos los campos requeridos.",
      });
      return;
    }
    // Nueva lógica para verificar si la cantidad total de productos vendidos en la fecha supera el límite
    const fechaEntrega = selectedVenta.fecha_entrega;
    const cantidadTotalEnFecha = pedidos
      .filter(pedido => pedido.fecha_entrega.split('T')[0] === fechaEntrega)
      .reduce((acc, pedido) => acc + pedido.detallesPedido.reduce((sum, detalle) => sum + detalle.cantidad, 0), 0);
  
    const cantidadNuevaVenta = selectedVenta.detalleVentas.reduce((acc, detalle) => acc + parseInt(detalle.cantidad), 0);
    const cantidadTotalFinal = cantidadTotalEnFecha + cantidadNuevaVenta;
    const disponibilidadRestante = 2000 - cantidadTotalEnFecha;
  
    // Si supera el límite, mostrar alerta
    if (cantidadTotalFinal > 2000) {
      Swal.fire({
        title: "Error",
        text: `La cantidad total de productos para la fecha ${fechaEntrega} excede el límite de 2000 unidades. Actualmente, solo puedes vender ${disponibilidadRestante} unidades más.`,
        icon: "error",
      });
      return;
    }
  
    // Si no supera el límite, continuar guardando la venta
    const ventaToSave = {
      id_cliente: parseInt(selectedVenta.id_cliente),
      numero_venta: selectedVenta.numero_venta || `VENTA-${Date.now()}`, // Generar número de venta si no se selecciona pedido
      fecha_venta: new Date(selectedVenta.fecha_venta).toISOString(),
      fecha_entrega: new Date(selectedVenta.fecha_entrega).toISOString(),
      estado: selectedVenta.estado,
      pagado: selectedVenta.pagado,
      detalleVentas: selectedVenta.detalleVentas.map((detalle) => ({
        id_producto: parseInt(detalle.id_producto),
        cantidad: parseInt(detalle.cantidad),
        precio_unitario: parseFloat(detalle.precio_unitario),
        subtotal: parseFloat(detalle.subtotal)
      })),
      total: selectedVenta.total,
      subtotal: selectedVenta.subtotal
    };
  
    try {
      await axios.post("http://localhost:3000/api/ventas", ventaToSave);
      Toast.fire({
        title: "¡Creación exitosa!",
        text: "La venta ha sido creada correctamente.",
        icon: "success",
      });
      fetchVentas();
      onCancel();
    } catch (error) {
      console.error("Error saving venta:", error);
      Swal.fire({
        title: "Error",
        text: "Hubo un problema al guardar la venta.",
        icon: "error",
      });
    }
  };
  
  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50 rounded-lg shadow-lg">
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#000000',
          marginBottom: '0.5rem',
        }}
      >
        Crear Venta
      </div>

      <DialogBody divider className="flex flex-col max-h-[100vh] overflow-hidden">
     <div className="flex flex-col gap-4 w-full p-4 bg-white rounded-lg shadow-sm">
  <div className="flex gap-4">     
    
            
<div className="flex flex-col gap-2 w-1/2">
            <Select
              label="Cliente"
              name="id_cliente"
              value={selectedVenta.id_cliente}
              onChange={(e) => handleChange({ target: { name: "id_cliente", value: e } })}
               className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
              required
            >
              {clientes
                .filter((cliente) => cliente.estado)
                .map((cliente) => (
                  <Option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {`${cliente.nombre} - ${cliente.numero_documento}`}
                  </Option>
                ))}
            </Select>
            {errors.id_cliente && <p className="text-red-500 text-xs mt-1">{errors.id_cliente}</p>} {/* Mostrar error */}
          </div>
          </div>
          <div className="flex gap-4">
          <div className="flex flex-col gap-2 w-1/2">
            <Input
              label="Fecha de Venta"
              name="fecha_venta"
              type="date"
              value={selectedVenta.fecha_venta}
              onChange={handleChange}
              className="w-full text-xs"
              required
            />
              {errors.fecha_venta && <p className="text-red-500 text-xs mt-1">{errors.fecha_venta}</p>} {/* Mostrar error */}
          </div>
          <div className="flex flex-col gap-2 w-1/2">
            <Input
              label="Fecha de Entrega"
              name="fecha_entrega"
              type="date"
              value={selectedVenta.fecha_entrega}
              onChange={handleChange}
              className="w-full text-xs"
              required
            />
               {errors.fecha_entrega && <p className="text-red-500 text-xs mt-1">{errors.fecha_entrega}</p>} {/* Mostrar error */}
          </div>
        </div>
        <div className="w-full p-4 bg-white rounded-lg shadow-lg">
  <Typography variant="h6" color="black" className="text-lg font-semibold mb-4">
    Agregar Productos
  </Typography>
  <div className="flex flex-col gap-4 overflow-y-auto max-h-80"> {/* Aquí agregamos overflow-y-auto y max-h-80 */}
    {selectedVenta.detalleVentas.length === 0 ? (
      <div className="flex flex-col items-center justify-center p-4 bg-gray-100 rounded-lg shadow-sm">
        <Typography variant="body1" color="gray-600">
          No hay productos añadidos. Agrega uno nuevo.
        </Typography>
      </div>
    ) : (
      selectedVenta.detalleVentas.map((detalle, index) => (
        <div key={index} className="flex flex-col md:flex-row items-start gap-4 mb-4 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex flex-col md:w-1/2 gap-2">
            <label className="block text-sm font-medium text-gray-700">Producto:</label>
            <Select
              required
              name="id_producto"
              value={detalle.id_producto}
              onChange={(e) => handleDetalleChange(index, { target: { name: "id_producto", value: e } })}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
              style={{ maxHeight: '200px', overflowY: 'auto' }} // Ajustes para la barra de desplazamiento
            >
              {productos.map((producto) => (
                <Option key={producto.id_producto} value={producto.id_producto}>
                  {producto.nombre}
                </Option>
              ))}
            </Select>
            {errors[`producto_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`producto_${index}`]}</p>} {/* Mostrar error */}
          </div>
          <div className="flex flex-col md:flex-row gap-4 w-full">
  <div className="flex flex-col md:w-1/4 gap-2">
    <label className="block text-sm font-medium text-gray-700">Cantidad:</label>
    <Input
      name="cantidad"
      type="number"
      required
      value={detalle.cantidad}
      onChange={(e) => {
        // Validar que el valor no sea negativo
        const value = e.target.value;
        if (value >= 0) {
          handleDetalleChange(index, e); // Solo se actualiza si el valor es >= 0
        }
      }}
      className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:border-blue-500 focus:ring-0"
    />
      {errors[`cantidad_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`cantidad_${index}`]}</p>} {/* Mostrar error */}
  </div>

            <div className="flex flex-col md:w-1/8 px-10 gap-2">
              <label className="block text-sm font-medium text-gray-700">Precio Unitario:</label>
              <Input
                name="precio_unitario"
                type="number"
                step="0.01"
                disabled
                value={detalle.precio_unitario}
                className="text-sm bg-gray-100 border border-gray-300 rounded-lg" // Elimina el ancho fijo
                style={{ width: '170px', padding: '4px' }} // Ajusta el tamaño y el padding
                readOnly
              />
            </div>

            <div className="flex flex-col md:w-1/4 gap-2 custom-align">
  <label className="block text-sm font-medium text-gray-700">Subtotal:</label>
  <Input
    name="subtotal"
    type="text"
    disabled
    value={`$${(detalle.subtotal || 0).toFixed(2)}`}
    readOnly
    className="text-sm bg-gray-100 border border-gray-300 rounded-lg" // Elimina el ancho fijo
    style={{ width: '120px', padding: '4px' }} // Ajusta el tamaño y el padding
  />
</div>



<div className="flex items-center justify-center mt-4 md:mt-0 -ml-12">
              <IconButton
                color="red"
                onClick={() => handleRemoveDetalle(index)}
                size="sm"
              >
                <TrashIcon className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        </div>
      ))
    )}
  </div>

  <div className="flex items-center mt-4">
  <Button
  size="sm"
  onClick={handleAddDetalle}
  className="flex items-center gap-2 bg-black text-white hover:bg-pink-800 px-4 py-2 rounded-md normal-case"
>
  <PlusIcon className="h-5 w-5" />
  Agregar Producto
</Button>

  </div>

  <div className="flex justify-end mt-4">
    <Typography variant="h6" color="black">
      Total: ${selectedVenta.total.toFixed(2)}
    </Typography>
  </div>
</div>



</div>
</DialogBody>


      <DialogFooter className=" p-4 flex justify-end gap-4 border-t border-gray-200">
      <Button
          variant="text"
          className="btncancelarm"
          size="sm"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          variant="gradient"
          className="btnagregarm"
          size="sm"
          onClick={handleSave}
        >
          Crear Venta
        </Button>

 </DialogFooter>
</div>
  );
}