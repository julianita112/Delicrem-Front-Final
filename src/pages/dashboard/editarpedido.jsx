
import React, { useState, useEffect } from 'react';
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
import Swal from 'sweetalert2';
// Función para formatear la fecha en formato YYYY-MM-DD
const formatDate = (isoDate) => {
  return isoDate ? new Date(isoDate).toISOString().substring(0, 10) : '';
};
export function EditarPedido({ pedido, clientes = [], productos = [], fetchPedidos, onCancel }) {
  const [selectedPedido, setSelectedPedido] = useState({
    id_cliente: "",
    numero_pedido: "",
    fecha_entrega: "",
    fecha_pago: "",
    id_estado: 7,  // Estado inicial: Esperando Pago
    detallesPedido: [],
    clientesh: { nombre: "", contacto: "" },
    total: 0
  });
  const [ventas, setVentas] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(true);
  const [clienteNombre, setClienteNombre] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/ventas");
        setVentas(response.data);
        setLoadingVentas(false);
      } catch (error) {
        console.error("Error fetching ventas:", error);
        setLoadingVentas(false);
      }
    };
    fetchVentas();
    if (pedido) {
      if (pedido.id_estado !== 7) {
        Swal.fire({
          title: 'No se puede editar',
          text: 'Solo se pueden editar pedidos con estado "Esperando Pago".',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          onCancel();
        });
        return;
      }
      const detallesConSubtotal = pedido.detallesPedido.map(detalle => {
        const producto = productos.find(p => p.id_producto === detalle.id_producto);
        const precioUnitario = producto ? producto.precio : 0;
        const cantidad = detalle.cantidad;
        const subtotal = cantidad * precioUnitario;
        return { ...detalle, precio_unitario: precioUnitario, subtotal };
      });
      const cliente = clientes.find(cliente => cliente.id_cliente === pedido.id_cliente);
      setClienteNombre(cliente ? cliente.nombre : "");
      setSelectedPedido(prevState => ({
        ...pedido,
        fecha_entrega: formatDate(pedido.fecha_entrega),
        fecha_pago: formatDate(pedido.fecha_pago),
        detallesPedido: detallesConSubtotal,
        id_estado: pedido.id_estado,
        clientesh: pedido.clientesh || { nombre: "", contacto: "" },
        total: calcularTotal(detallesConSubtotal)
      }));
    }
  }, [pedido, productos, clientes, onCancel]);
  const calcularTotal = (detalles) => {
    return detalles.reduce((acc, detalle) => acc + (detalle.subtotal || 0), 0);
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedPedido({ ...selectedPedido, [name]: value });
  };
  
  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    const detalles = [...selectedPedido.detallesPedido];
    if (name === 'id_producto') {
      const productoSeleccionado = productos.find(p => p.id_producto === parseInt(value));
      if (productoSeleccionado) {
        detalles[index].precio_unitario = productoSeleccionado.precio;
        detalles[index].subtotal = detalles[index].cantidad * productoSeleccionado.precio;
      }
    }
    detalles[index][name] = value;
    if (name === 'cantidad' || name === 'precio_unitario') {
      const cantidad = parseInt(detalles[index].cantidad) || 0;
      const precioUnitario = parseFloat(detalles[index].precio_unitario) || 0;
      detalles[index].subtotal = cantidad * precioUnitario;
    }
    setSelectedPedido({ ...selectedPedido, detallesPedido: detalles });
    updateTotal(detalles);
  };

  
  const handleAddDetalle = () => {
    // Verificar si hay campos vacíos
    const hasEmptyFields = selectedPedido.detallesPedido.some(detalle => 
      !detalle.id_producto || !detalle.cantidad
    );

    if (hasEmptyFields) {
      Swal.fire({
        icon: 'error',
        title: 'Por favor, completa todos los campos antes de agregar un nuevo detalle.',
      });
      return;
    }

    // Verificar duplicados antes de agregar
    if (hasDuplicateProductos()) {
      Swal.fire({
        icon: 'error',
        title: 'No se pueden agregar productos duplicados.',
      });
      return;
    }

    // Si todo está bien, agrega un nuevo detalle
    setSelectedPedido({
      ...selectedPedido,
      detallesPedido: [
        ...selectedPedido.detallesPedido,
        { id_producto: "", cantidad: "", precio_unitario: "", subtotal: 0 }
      ]
    });
};
  
  const handleRemoveDetalle = (index) => {
    const detalles = [...selectedPedido.detallesPedido];
    detalles.splice(index, 1);
    setSelectedPedido({ ...selectedPedido, detallesPedido: detalles });
    updateTotal(detalles);
  };
  const updateTotal = (detalles) => {
    const total = calcularTotal(detalles);
    setSelectedPedido(prevState => ({
      ...prevState,
      total
    }));
  };

  useEffect(() => {
    if (selectedPedido.id_estado === 6) {  // Si el estado es 'Pagado'
      setSelectedPedido(prevState => ({
        ...prevState,
        fecha_pago: formatDate(new Date())  // Asignar la fecha actual
      }));
    } else {
      setSelectedPedido(prevState => ({
        ...prevState,
        fecha_pago: ""  // Limpiar la fecha si no está pagado
      }));
    }
  }, [selectedPedido.id_estado]);

  // Nueva función de validación en tiempo real
  const validateRealTime = () => {
    const newErrors = {};
    
    // Validación de fecha de entrega
    if (!selectedPedido.fecha_entrega) {
      newErrors.fecha_entrega = "La fecha de entrega es obligatoria";
    } else if (new Date(selectedPedido.fecha_entrega) < new Date()) {
      newErrors.fecha_entrega = "La fecha de entrega debe ser a futuro";
    }
  
    // Validación de fecha de pago
    if (selectedPedido.fecha_pago && new Date(selectedPedido.fecha_pago) > new Date()) {
      newErrors.fecha_pago = "La fecha de pago no puede ser en el futuro";
    }
    // Validación de detalles
    if (selectedPedido.detallesPedido.length === 0) {
      newErrors.detallesPedido = "Debe agregar al menos un detalle de pedido";
    }
    selectedPedido.detallesPedido.forEach((detalle, index) => {
      if (!detalle.id_producto) {
        newErrors[`producto_${index}`] = "El producto es obligatorio";
      }
      if (!detalle.cantidad || isNaN(detalle.cantidad) || detalle.cantidad <= 0) {
        newErrors[`cantidad_${index}`] = "La cantidad debe ser un número positivo";
      }
      if (!detalle.precio_unitario || isNaN(detalle.precio_unitario) || detalle.precio_unitario <= 0) {
        newErrors[`precio_unitario_${index}`] = "El precio unitario debe ser un número positivo";
      }
    });
    setErrors(newErrors); // Actualiza los errores en el estado
  };

  useEffect(() => {
    validateRealTime();
  }, [selectedPedido]);

  const hasDuplicateProductos = () => {
    const productos = selectedPedido.detallesPedido.map(detalle => detalle.id_producto);
    return new Set(productos).size !== productos.length;
};

  const handleSave = async () => {
    const newErrors = {};
    const today = new Date().toISOString().split("T")[0]; // Obtener la fecha de hoy en formato YYYY-MM-DD
  
    // Validar fecha de entrega
    if (!selectedPedido.fecha_entrega) {
      newErrors.fecha_entrega = "La fecha de entrega es obligatoria";
    } else if (new Date(selectedPedido.fecha_entrega) < new Date(today)) {
      newErrors.fecha_entrega = "La fecha de entrega no puede ser en el pasado";
    }
    // Validaciones adicionales para los detalles del pedido
    if (selectedPedido.detallesPedido.length === 0) {
      newErrors.detallesPedido = "Debe agregar al menos un detalle de pedido";
    }
  if (hasDuplicateProductos()) {
      newErrors.detallesPedido = "No se pueden agregar productos duplicados.";
    }

    selectedPedido.detallesPedido.forEach((detalle, index) => {
      if (!detalle.id_producto) {
        newErrors[`producto_${index}`] = "El producto es obligatorio";
      }
      if (!detalle.cantidad || isNaN(detalle.cantidad) || detalle.cantidad <= 0) {
        newErrors[`cantidad_${index}`] = "La cantidad debe ser un número positivo";
      }
      if (!detalle.precio_unitario || isNaN(detalle.precio_unitario) || detalle.precio_unitario <= 0) {
        newErrors[`precio_unitario_${index}`] = "El precio unitario debe ser un número positivo";
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Por favor, complete todos los campos requeridos correctamente.',
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }
  
    // Nueva lógica para verificar si la cantidad total de productos vendidos en la fecha excede el límite
    const fechaEntrega = selectedPedido.fecha_entrega;
  
    // Calcular la cantidad total de productos vendidos para la fecha de entrega seleccionada
    const cantidadTotalVendidaEnFecha = ventas
      .filter(venta => venta.fecha_entrega.split('T')[0] === fechaEntrega) // Filtra ventas por fecha de entrega
      .reduce((acc, venta) => {
        // Suma la cantidad de cada detalle de venta
        return acc + venta.detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0);
      }, 0);
  
    // Calcular la cantidad de la nueva compra (pedido)
    const cantidadNuevaCompra = selectedPedido.detallesPedido.reduce((acc, detalle) => acc + parseInt(detalle.cantidad), 0);
  
    const cantidadTotalFinal = cantidadTotalVendidaEnFecha + cantidadNuevaCompra;
    const disponibilidadRestante = 2000 - cantidadTotalVendidaEnFecha;
  
    // Si supera el límite, mostrar alerta
    if (cantidadTotalFinal > 2000) {
      Swal.fire({
        title: "Error",
        text: `La cantidad total de productos para la fecha ${fechaEntrega} excede el límite de 2000 unidades. Actualmente, solo puedes agregar ${disponibilidadRestante} unidades más.`,
        icon: "error",
      });
      return;
    }
  
    const pedidoToSave = {
      id_cliente: selectedPedido.id_cliente,
      numero_pedido: selectedPedido.numero_pedido,
      fecha_entrega: new Date(selectedPedido.fecha_entrega).toISOString(),
      fecha_pago: selectedPedido.fecha_pago ? new Date(selectedPedido.fecha_pago).toISOString() : null,
      id_estado: selectedPedido.id_estado, // Guardar el nuevo estado seleccionado
      detallesPedido: selectedPedido.detallesPedido.map(detalle => ({
        id_producto: parseInt(detalle.id_producto),
        cantidad: parseInt(detalle.cantidad),
        precio_unitario: parseFloat(detalle.precio_unitario),
        subtotal: parseFloat(detalle.subtotal) // Incluyendo el subtotal
      })),
      total: selectedPedido.total // Incluyendo el total
    };
  
    
  
    try {
      await axios.put(`https://finalbackenddelicrem2.onrender.com/api/pedidos/${selectedPedido.id_pedido}`, pedidoToSave);
      Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'El pedido ha sido actualizado correctamente.',
          showConfirmButton: false,
          timer: 3000,
      });
      fetchPedidos(); // Actualizar la lista de pedidos
      onCancel(); // Regresar a la lista de pedidos
  } catch (error) {
      console.error("Error updating pedido:", error);
      Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Hubo un problema al actualizar el pedido.',
          showConfirmButton: false,
          timer: 3000,
      });
    }
  };
  return (
    <div className="max-w-6xl mx-auto bg-white p-2 rounded-lg shadow-md">     
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '0.5rem',
            }}
          >
            Editar Pedido
          </div>
   
       
          <DialogBody divider className="flex flex-col max-h-[200vh] overflow-hidden">
     <div className="flex flex-col gap-4 w-full p-4 bg-white rounded-lg shadow-sm">
  <div className="flex gap-4">
  <div className="flex flex-col gap-2 w-1/2">
          <label className="block text-sm font-medium text-gray-700">Cliente:</label>
            <Input             
              name="cliente_nombre"
              type="text"
              value={clienteNombre}
               className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
              disabled
            />
          </div>
  
            <div className="flex flex-col gap-2 w-1/2">
          <label className="block text-sm font-medium text-gray-700">Nro. Pedido:</label>
            <Input            
              name="numero_pedido"
              type="text"
              value={selectedPedido.numero_pedido}
              className="w-full text-xs"
              disabled
            />
          </div>
          </div>
  
          <div className="flex gap-4">
          <div className="flex flex-col gap-2 w-1/2">
            <label className="block text-sm font-medium text-gray-700">Fecha de Entrega:</label>
            <Input
              name="fecha_entrega"
              type="date"
              value={selectedPedido.fecha_entrega}
              onChange={handleChange}
              className="w-full text-xs"
              required
            />
            {errors.fecha_entrega && (
              <p className="text-red-500 text-xs mt-1">{errors.fecha_entrega}</p>
            )}
          </div>
         
         
          <div className="flex flex-col gap-2 w-1/2">
    <label className="block text-sm font-medium text-gray-700">Fecha de Pago:</label>
    <Input
        name="fecha_pago"
        type="date"
        value={selectedPedido.fecha_pago || ""}
        onChange={handleChange}
        className="w-full text-xs"
        disabled
       // Deshabilitar si el estado no es 'Pagado'
    />
    {errors.fecha_pago && (
        <p className="text-red-500 text-xs mt-1">{errors.fecha_pago}</p>
    )}
</div> </div>


        
  
          {/* Select para cambiar el estado a "Pagado" */}
          <div className="flex flex-col gap-2 w-1/3">
          <label className="block text-sm font-medium text-gray-700">Estado de Pago del Pedido:</label>
            <Select
             
              name="id_estado"
              value={selectedPedido.id_estado}
              onChange={(e) => setSelectedPedido({ ...selectedPedido, id_estado: parseInt(e) })}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
            >
              <Option value={7}>Esperando Pago</Option>
              <Option value={6}>Pagado</Option>
            </Select>
          </div>
      
    
        {/* Columna derecha */}
        <div className="w-full p-4 bg-white rounded-lg shadow-lg">
<Typography variant="h6" color="black" className="text-lg font-semibold mb-4">
            Detalles del Pedido
          </Typography>
  
          <div className="overflow-x-auto max-h-60">
          <table className="min-w-full table-auto border-collapse">
      <thead>
        <tr className="bg-gray-100">
          
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
            {selectedPedido.detallesPedido.map((detalle, index) => (
              <tr key={index} className="flex flex-col md:flex-row items-start gap-4 mb-4 p-4 bg-white rounded-lg shadow-sm">
                <td className="px-4 py-2">
{/* Producto y Cantidad en la misma fila */}
        
              <label className="block text-sm font-medium text-gray-700">Producto:</label>
                  <Select          
                    required
                    name="id_producto"
                    value={detalle.id_producto}
                    onChange={(e) => handleDetalleChange(index, { target: { name: 'id_producto', value: e } })}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
                  >
                    {productos.map(producto => (
                      <Option key={producto.id_producto} value={producto.id_producto}>
                        {producto.nombre}
                      </Option>
                    ))}
                  </Select>
                  {errors[`producto_${index}`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`producto_${index}`]}</p>
                  )}
                 </td>
  
                 <td className="px-4 py-2">
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
                      }}}
                    className="text-sm w-24 p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0"
                  />
                   {errors[`cantidad_${index}`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`cantidad_${index}`]}</p>
                  )}
                   </td>
  
                  {/* Precio Unitario y Subtotal en la misma fila */}
                  <td className="px-4 py-2">
                  <label className="block text-sm font-medium text-gray-700">Precio Unitario:</label>
                  <Input
                   
                    name="precio_unitario"
                    type="number"
                    disabled
                    step="0.01"
                    value={detalle.precio_unitario}
                    c   className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-0"
                    style={{ width: '200px', padding: '10px' }} 
                    readOnly
                  />
    </td>
    <td className="-px-12 py-2">
                  <label className="block text-sm font-medium text-gray-700">Subtotal:</label>
                  <input
                    name="subtotal"
                    type="number"
                    step="0.01"
                    value={detalle.subtotal}
                    className="text-sm bg-gray-100 border border-gray-300 rounded-lg" // Elimina el ancho fijo
                    style={{ width: '120px', padding: '10px' }} 
                    readOnly
                  />
                 </td>
   {/* Botón de eliminar (Trash Icon) alineado a la derecha */}
   <td className="px-4 py-2 text-righ">
              <IconButton
                      color="red"
                      onClick={() => handleRemoveDetalle(index)}
                         className="btncancelarm"
                      size="sm"
                    >
                      <TrashIcon className="h-5 w-5" />
                </IconButton>
                </td>
                    </tr>
            ))}
             {errors.detallesPedido && (
            <p className="text-red-500 text-xs mb-4">{errors.detallesPedido}</p>
          )}
</tbody>
    </table>
  </div>   
  
    {/* Botón para agregar detalle */}
    <div className="flex justify-end mt-4">
  <Button 
    size="sm" 
    onClick={handleAddDetalle}
    className="flex items-center gap-2 bg-black text-white hover:bg-pink-800 px-4 py-2 rounded-md"
  >
    <PlusIcon className="h-5 w-5" />
    Agregar Producto
  </Button>
</div>
</div>
  </div>

      <div className="flex justify-end mt-4">
            <Typography variant="h6" color="blue-gray">
              Total de la Compra: ${(selectedPedido.total || 0).toFixed(2)}
            </Typography>
         
          
          </div>
</DialogBody>
    
  
<DialogFooter className=" p-4 flex justify-end gap-4 border-t border-gray-200">
        <Button variant="text" className="btncancelarm" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleSave}>
          Guardar Cambios
        </Button>
        </DialogFooter>
    </div>
  );
}
