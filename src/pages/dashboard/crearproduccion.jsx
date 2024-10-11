import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Checkbox,
  Typography,
  IconButton,
} from "@material-tailwind/react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import Swal from "sweetalert2";
import axios from "../../utils/axiosConfig";

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

export function CrearProduccion({ open, handleCreateProductionOpen }) {
  const [ventas, setVentas] = useState([]);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [productionDetails, setProductionDetails] = useState({});
  const [pedidos, setPedidos] = useState([]);
  const [ventasAsociadas, setVentasAsociadas] = useState([]);
  const [productos, setProductos] = useState({});
  const [totalProductosEnProduccion, setTotalProductosEnProduccion] = useState(0); // Total productos en estado 2
  const [validationError, setValidationError] = useState(""); // Nuevo estado de validación


  const LIMITE_PRODUCCION = 2000; // Límite de productos por día

  useEffect(() => {
    if (open) {
      setSelectedVentas([]);
      setProductionDetails({});
      setValidationError(""); // Reiniciar el error de validación
      fetchVentas();
      fetchPedidos();
      fetchVentasAsociadas();
      fetchProductos();
      fetchTotalProductosEnProduccion(); // Llamar para obtener el total de productos en producción
    }
  }, [open]);

  const fetchVentas = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/ventas");
      setVentas(response.data);
    } catch (error) {
      console.error("Error fetching ventas:", error);
    }
  };

  const fetchPedidos = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/pedidos");
      setPedidos(response.data);
    } catch (error) {
      console.error("Error fetching pedidos:", error);
    }
  };

  const fetchVentasAsociadas = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/ordenesproduccion/todas_ventas_asociadas");
      const ventasAsociadas = response.data.map((venta) => venta.numero_venta);
      setVentasAsociadas(ventasAsociadas);
    } catch (error) {
      console.error("Error fetching ventas asociadas:", error);
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/productos");
      const productosMap = {};
      response.data.forEach(producto => {
        productosMap[producto.id_producto] = producto.nombre;
      });
      setProductos(productosMap);
    } catch (error) {
      console.error("Error fetching productos:", error);
    }
  };

  // Nueva función para obtener el total de productos en producción (id_estado = 2)
  const fetchTotalProductosEnProduccion = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/ordenesproduccion?estado=2");
      const ordenesProduccion = response.data;

      // Sumar la cantidad total de productos en todas las órdenes con id_estado = 2
      const totalProductos = ordenesProduccion.reduce((total, orden) => {
        if (orden.ordenProduccionDetalles && Array.isArray(orden.ordenProduccionDetalles)) {
          const totalProductosOrden = orden.ordenProduccionDetalles.reduce((subtotal, detalle) => {
            return subtotal + detalle.cantidad;
          }, 0);
          return total + totalProductosOrden;
        }
        return total;
      }, 0);

      setTotalProductosEnProduccion(totalProductos);
    } catch (error) {
      console.error("Error fetching total de productos en producción:", error);
    }
  };

  const handleVentaChange = (numero_venta, isChecked) => {
    const venta = ventas.find((v) => v.numero_venta === numero_venta);
    if (!venta) return;

    if (isChecked) {
      setSelectedVentas([...selectedVentas, numero_venta]);

      const nuevosDetalles = { ...productionDetails };
      venta.detalles.forEach((detalle) => {
        if (nuevosDetalles[detalle.id_producto]) {
          nuevosDetalles[detalle.id_producto].cantidad += detalle.cantidad;
        } else {
          nuevosDetalles[detalle.id_producto] = {
            nombre: productos[detalle.id_producto] || `Producto ${detalle.id_producto}`,
            cantidad: detalle.cantidad,
          };
        }
      });

      setProductionDetails(nuevosDetalles);
    } else {
      const nuevasVentasSeleccionadas = selectedVentas.filter(
        (num) => num !== numero_venta
      );
      setSelectedVentas(nuevasVentasSeleccionadas);

      const nuevosDetalles = { ...productionDetails };
      venta.detalles.forEach((detalle) => {
        if (nuevosDetalles[detalle.id_producto]) {
          nuevosDetalles[detalle.id_producto].cantidad -= detalle.cantidad;
          if (nuevosDetalles[detalle.id_producto].cantidad <= 0) {
            delete nuevosDetalles[detalle.id_producto];
          }
        }
      });

      setProductionDetails(nuevosDetalles);
    }
  };

  const handleCreateProductionSave = async () => {
    if (selectedVentas.length === 0) {
      Toast.fire({
        icon: "error",
        title: "Selección requerida",
        text: "Debes seleccionar al menos una venta para crear la orden de producción.",
      });
      return; // No continuar si no hay ventas seleccionadas
    }
    // Calcular el total de productos de la nueva orden
    const totalProductosNuevaOrden = Object.values(productionDetails).reduce((total, detalle) => total + detalle.cantidad, 0);

    // Calcular productos restantes para llegar al límite
    const productosRestantes = LIMITE_PRODUCCION - totalProductosEnProduccion;

    // Verificar si se supera el límite de capacidad
    if (totalProductosNuevaOrden > productosRestantes) {
      Swal.fire({
        icon: "error",
        title: "Capacidad excedida",
        text: `No se puede crear la orden de producción porque se excedería el límite de ${LIMITE_PRODUCCION} productos por día. 
        Puedes agregar un máximo de ${productosRestantes} productos.`,
      });
      return; // No continuar con la creación de la orden
    }

    const numeroOrdenUnico = `ORD${Math.floor(Math.random() * 1000000)}`;
    const fechaActual = new Date().toISOString().split('T')[0];

    try {
      await axios.post("https://finalbackenddelicrem2.onrender.com/api/ordenesproduccion", {
        numero_orden: numeroOrdenUnico,
        fecha_orden: fechaActual,
        productos: Object.entries(productionDetails).map(([id_producto, detalle]) => ({
          id_producto: parseInt(id_producto),
          cantidad: detalle.cantidad,
        })),
        numero_ventas: selectedVentas,
      });
      Toast.fire({
        icon: "success",
        title: "Orden de producción creada correctamente.",
      });
      setSelectedVentas([]);
      setProductionDetails({});
      setValidationError(""); // Limpiar el mensaje de error
      handleCreateProductionOpen();
    } catch (error) {
      console.error("Error al crear la orden de producción:", error);
      Toast.fire({
        icon: "error",
        title: "Hubo un problema al crear la orden de producción",
      });
    }
  };

  // Filtrar las ventas disponibles para mostrar solo las que no están asociadas
  const ventasFiltradas = ventas.filter((venta) => !ventasAsociadas.includes(venta.numero_venta));

  return (
    <Dialog
      open={open}
      handler={handleCreateProductionOpen}
      className="custom-modal w-screen h-screen"
      size="xxl"
    >
      <div className="flex justify-between items-center p-4">
        <IconButton
          variant="text"
          color="blue-gray"
          size="sm"
          onClick={handleCreateProductionOpen}
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </IconButton>
        <Typography variant="h5" color="blue-gray">
          Crear Orden de Producción
        </Typography>
        <div className="w-6"></div>
      </div>
      <DialogBody divider className="flex h-[80vh] p-4 gap-6">
  <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
    <Typography variant="h6" color="blue-gray" className="mb-4 text-sm">
      Seleccionar Ventas para la Orden
    </Typography>
    {ventasFiltradas.map((venta) => (
      <div key={venta.id_venta} className="mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Checkbox
            id={`venta-${venta.id_venta}`}
            label={`Venta ${venta.numero_venta} - Cliente: ${venta.cliente.nombre} - Documento: ${venta.cliente.numero_documento}`}
            onChange={(e) => handleVentaChange(venta.numero_venta, e.target.checked)}
            checked={selectedVentas.includes(venta.numero_venta)}
          />
        </div>
        <span className="ml-4  text-blue-gray-900" style={{ fontWeight: 'bold' }}>
          Fecha de Entrega: {new Date(venta.fecha_entrega).toISOString().split('T')[0]}
        </span>
      </div>
    </div>
    

    ))}
  </div>

  <div className="w-full max-w-xs bg-gray-100 p-4 rounded-lg shadow-md max-h-[80vh] overflow-y-auto">
    <Typography variant="h6" color="blue-gray" className="mb-4 text-lg">
      Resumen de Producción
    </Typography>
    <ul className="list-disc pl-4 text-sm">
      {Object.entries(productionDetails).map(([id_producto, detalle]) => (
        <li key={id_producto} className="mb-2">
          {detalle.nombre}: Cantidad {detalle.cantidad}
        </li>
      ))}
    </ul>
  </div>
</DialogBody>

      <DialogFooter className="bg-white p-4 flex justify-end gap-2">
        <Button
          variant="text"
          className="btncancelarm"
          size="sm"
          onClick={handleCreateProductionOpen}
        >
          Cancelar
        </Button>
        <Button
          variant="gradient"
          className="btnagregarm"
          size="sm"
          onClick={handleCreateProductionSave}
        >
          Crear orden
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default CrearProduccion;