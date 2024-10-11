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

export function CrearPedido({ clientes, productos, fetchPedidos, onCancel }) {
  const generateUniqueOrderNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let orderNumber = '';
    for (let i = 0; i < 10; i++) {
      orderNumber += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return orderNumber;
  };

  const [selectedPedido, setSelectedPedido] = useState({
    id_cliente: "",
    numero_pedido: generateUniqueOrderNumber(),
    fecha_entrega: "",
    fecha_pago: "",
    id_estado: 7,
    detallesPedido: [],
    clientesh: { nombre: "", contacto: "" },
    total: 0 // Agregar total al estado
  });

  const [errors, setErrors] = useState({});
  const [ventas, setVentas] = useState([]); // Estado para almacenar las ventas
  const [loadingVentas, setLoadingVentas] = useState(true); // Estado de carga para ventas

  // useEffect para obtener las ventas de la API cuando el componente se monte
  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/ventas");
        setVentas(response.data); // Actualiza el estado con las ventas obtenidas
        setLoadingVentas(false); // Termina la carga
      } catch (error) {
        console.error("Error fetching ventas:", error);
        setLoadingVentas(false); // Termina la carga incluso si hay error
      }
    };

    fetchVentas();
  }, []);

// Realiza la validación cada vez que cambie 'selectedPedido'
useEffect(() => {
  validateFields();
}, [selectedPedido]);

const validateFields = () => {
  const newErrors = {};
  if (!selectedPedido.id_cliente) {
    newErrors.id_cliente = "El cliente es obligatorio";
  }
  if (!selectedPedido.fecha_entrega) {
    newErrors.fecha_entrega = "La fecha de entrega es obligatoria";
  } else if (new Date(selectedPedido.fecha_entrega) < new Date()) {
    newErrors.fecha_entrega = "La fecha de entrega debe ser a futuro";
  }
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
  setErrors(newErrors);
};

const handleChange = (e) => {
  const { name, value } = e.target;
  const updatedValue = name === 'id_cliente' ? value : value.trim();

  // Update state
  setSelectedPedido({ ...selectedPedido, [name]: updatedValue });

  // Eliminar el validateFields de aquí, ya que ahora lo manejamos con useEffect
};

const handleDetalleChange = (index, e) => {
  const { name, value } = e.target;
  const detalles = [...selectedPedido.detallesPedido];

  if (name === 'id_producto') {
    const productoSeleccionado = productos.find(p => p.id_producto === parseInt(value));

    // Verificar si el producto ya existe en otro detalle
    const productoDuplicado = detalles.some((detalle, i) => detalle.id_producto === parseInt(value) && i !== index);

    if (productoDuplicado) {
        // Mostrar mensaje de SweetAlert2
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'warning',
            title: 'Este producto ya ha sido seleccionado.',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
        return; // Detener la ejecución si el producto está duplicado
    }

    if (productoSeleccionado) {
        detalles[index].precio_unitario = productoSeleccionado.precio;
    } else {
        console.error("Producto no encontrado:", value);
    }

      detalles[index].precio_unitario = productoSeleccionado ? productoSeleccionado.precio : "";
  }

  // Actualizar el valor del campo seleccionado
  detalles[index][name] = value;

  // Calcular el subtotal si se cambia la cantidad o el precio unitario
  if (name === 'cantidad' || name === 'precio_unitario') {
      const cantidad = parseInt(detalles[index].cantidad) || 0;
      const precioUnitario = parseFloat(detalles[index].precio_unitario) || 0;
      detalles[index].subtotal = cantidad * precioUnitario;
  }

  // Actualizar el estado con los nuevos detalles
  setSelectedPedido({ ...selectedPedido, detallesPedido: detalles });
  updateTotal(detalles);

  // Validar los campos después de hacer un cambio
  validateFields();
};


  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener("mouseenter", Swal.stopTimer);
      toast.addEventListener("mouseleave", Swal.resumeTimer);
    },
  });

  const handleAddDetalle = () => {
    // Comprobar si ya existe un detalle con el mismo id_producto vacío
    const productoDuplicado = selectedPedido.detallesPedido.some(detalle => detalle.id_producto === "");
  
    if (productoDuplicado) {
      Swal.fire({
        icon: 'error',
        title: 'Producto duplicado',
        text: 'Ya has agregado un producto sin completar. Por favor, completa o elimina el producto antes de agregar uno nuevo.',
      });
      return;
    }
  
    // Agregar un nuevo detalle de producto si no hay duplicados
    setSelectedPedido({
      ...selectedPedido,
      detallesPedido: [...selectedPedido.detallesPedido, { id_producto: "", cantidad: "", precio_unitario: "", subtotal: 0 }]
    });
  };
  

  const handleRemoveDetalle = (index) => {
    const detalles = [...selectedPedido.detallesPedido];
    detalles.splice(index, 1);
    setSelectedPedido({ ...selectedPedido, detallesPedido: detalles });
    updateTotal(detalles);
  };

  const updateTotal = (detalles) => {
    const total = detalles.reduce((acc, detalle) => acc + (detalle.subtotal || 0), 0);
    setSelectedPedido(prevState => ({
      ...prevState,
      total
    }));
  };

  const handleSave = async () => {
    // Validaciones previas
    const newErrors = {};
    if (!selectedPedido.id_cliente) {
        newErrors.id_cliente = "El cliente es obligatorio";
    }
    if (!selectedPedido.fecha_entrega) {
        newErrors.fecha_entrega = "La fecha de entrega es obligatoria";
    }
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

      // Validación de duplicados
    const idsProductos = selectedPedido.detallesPedido.map(detalle => detalle.id_producto);
    const duplicados = idsProductos.filter((item, index) => idsProductos.indexOf(item) !== index);

    if (duplicados.length > 0) {
        newErrors.duplicados = "Hay productos duplicados en el pedido. Por favor, elimínalos o cámbialos antes de continuar.";
    }

    // Configurar errores en el estado
    setErrors(newErrors);


    if (Object.keys(newErrors).length > 0) {
        // Si hay errores, mostrar alerta y no guardar el pedido
        Toast.fire({
          icon: "error",
          title: "Por favor, completa todos los campos correctamente.",
        });
        return;
    }

    const fechaEntrega = selectedPedido.fecha_entrega;

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

    // Si no supera el límite, continuar guardando el pedido
    const pedidoToSave = {
        id_cliente: parseInt(selectedPedido.id_cliente),
        numero_pedido: selectedPedido.numero_pedido,
        fecha_entrega: new Date(selectedPedido.fecha_entrega).toISOString(),
        fecha_pago: selectedPedido.fecha_pago ? new Date(selectedPedido.fecha_pago).toISOString() : null,
        id_estado: selectedPedido.id_estado, // Asegúrate de asignar el estado correctamente
        detallesPedido: selectedPedido.detallesPedido.map(detalle => ({
            id_producto: parseInt(detalle.id_producto),
            cantidad: parseInt(detalle.cantidad),
            precio_unitario: parseFloat(detalle.precio_unitario),
            subtotal: parseFloat(detalle.subtotal)
        })),
        total: selectedPedido.total
    };

    try {
        await axios.post("https://finalbackenddelicrem2.onrender.com/api/pedidos", pedidoToSave);
        Toast.fire({
            title: '¡Creación exitosa!',
            text: 'El pedido ha sido creado correctamente.',
            icon: 'success',
        });
        fetchPedidos(); // Actualizar la lista de pedidos
        onCancel(); // Regresar a la lista de pedidos
    } catch (error) {
        console.error("Error saving pedido:", error);
        Toast.fire({
            title: 'Error',
            text: 'Hubo un problema al guardar el pedido.',
            icon: 'error',
        });
    }
};

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">      
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '0.5rem',
            }}
          >
            Crear Pedido
          </div>
      <DialogBody divider className="flex flex-col max-h-[100vh] overflow-hidden">
     <div className="flex flex-col gap-4 w-full p-4 bg-white rounded-lg shadow-sm">
  <div className="flex gap-4">
          {/* Mostrar un mensaje de carga mientras se obtienen las ventas */}
          {loadingVentas && (
            <Typography variant="h6" color="blue">
              Cargando ventas...
            </Typography>
          )}
           <div className="flex flex-col gap-2 w-1/2">
            <label className="block text-sm font-medium text-gray-700">Cliente:</label>
            <Select
              name="id_cliente"
              value={selectedPedido.id_cliente}
              onChange={(e) => handleChange({ target: { name: 'id_cliente', value: e } })}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
              required
            >
              {clientes
                .filter(cliente => cliente.estado)
                .map(cliente => (
                  <Option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {`${cliente.nombre} - ${cliente.numero_documento}`} {/* Mostrar nombre y número de documento */}
                  </Option>
                ))}
            </Select>
            {errors.id_cliente && (
              <p className="text-red-500 text-xs mt-1">{errors.id_cliente}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 w-1/2">
            <label className="block text-sm font-medium text-gray-700">Nro. Pedido:</label>
            <Input
              label="Número de Pedido"
              name="numero_pedido"
              type="text"
              value={selectedPedido.numero_pedido}
              onChange={handleChange}
             className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
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
        </div>
{/* Columna derecha */}
<div className="w-full p-4 bg-white rounded-lg shadow-lg">
<Typography variant="h6" color="black" className="text-lg font-semibold mb-4">
Agregar Productos
          </Typography>
          
          <div className="overflow-x-auto max-h-64">
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
                    name="id_producto"
                    value={detalle.id_producto}
                    onChange={(e) => handleDetalleChange(index, { target: { name: 'id_producto', value: e } })}
                      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
                    required
                  >
                    {productos
                      .filter(producto => producto.estado)
                      .map(producto => (
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
                    value={detalle.precio_unitario}
                    onChange={(e) => handleDetalleChange(index, e)}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-0"
                    style={{ width: '200px', padding: '10px' }} 
                   
                  />
                  {errors[`precio_unitario_${index}`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`precio_unitario_${index}`]}</p>
                  )}
               </td>

               <td className="-px-12 py-2">
                  <label className="block text-sm font-medium text-gray-700">Subtotal:</label>
                  <input
                    name="subtotal"
                    type="text"
                    disabled
                    value={`$${(detalle.subtotal || 0).toFixed(2)}`}
                    readOnly
                    className="text-sm bg-gray-100 border border-gray-300 rounded-lg" // Elimina el ancho fijo
                    style={{ width: '120px', padding: '10px' }} 
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

            <div className="flex justify-end mt-4">
            <Typography variant="h6" color="blue-gray">
              Total del Pedido: ${(selectedPedido.total || 0).toFixed(2)}
            </Typography>
          </div>
        </div>
      </div>

      </DialogBody>

      <div className="bg-white p-4 flex justify-end gap-4 border-t border-gray-200">
        <Button
          variant="text"
          size="sm"
          onClick={onCancel}
          className="btncancelarm text-white"
        >
          Cancelar
        </Button>
        <Button
          variant="gradient"
          size="sm"
          onClick={handleSave}
          className="btnagregarm text-white"
        >
          Crear Pedido
        </Button>
      </div>
    </div>
  );
}