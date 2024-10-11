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

export function EditarProduccion({ open, handleEditProductionOpen, orden }) {
  const [ventas, setVentas] = useState([]);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [productionDetails, setProductionDetails] = useState({});
  const [ventasAsociadas, setVentasAsociadas] = useState([]);
  const [ventasAsociadasActuales, setVentasAsociadasActuales] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [productos, setProductos] = useState({});
  const [totalProductosEnProduccion, setTotalProductosEnProduccion] = useState(0); // Total productos en estado 2

  const LIMITE_PRODUCCION = 2000; // Límite de productos por día

  useEffect(() => {
    if (open) {
      setSelectedVentas([]);
      setProductionDetails({});
      setDataLoaded(false);
      fetchVentas();
      fetchProductos();
      fetchTotalProductosEnProduccion(); // Obtener el total de productos actuales
    }
  }, [open]);

  useEffect(() => {
    if (ventas.length > 0 && !dataLoaded) {
      fetchVentasAsociadas().then(() => {
        loadOrderDetails();
      });
    }
  }, [ventas, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      aplicarFiltradoDeVentas();
    }
  }, [dataLoaded, ventas, ventasAsociadas, ventasAsociadasActuales]);

  const fetchVentas = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ventas");
      setVentas(response.data);
    } catch (error) {
      console.error("Error fetching ventas:", error);
    }
  };

  const fetchProductos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/productos");
      const productosMap = {};
      response.data.forEach(producto => {
        productosMap[producto.id_producto] = producto.nombre;
      });
      setProductos(productosMap);
    } catch (error) {
      console.error("Error fetching productos:", error);
    }
  };

  const fetchTotalProductosEnProduccion = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ordenesproduccion?estado=2");
      const ordenesProduccion = response.data;

      const totalProductos = ordenesProduccion.reduce((total, orden) => {
        if (orden.ordenProduccionDetalles && Array.isArray(orden.ordenProduccionDetalles)) {
          const totalProductosOrden = orden.ordenProduccionDetalles.reduce((subtotal, detalle) => subtotal + detalle.cantidad, 0);
          return total + totalProductosOrden;
        }
        return total;
      }, 0);

      setTotalProductosEnProduccion(totalProductos);
    } catch (error) {
      console.error("Error fetching total de productos en producción:", error);
    }
  };

  const fetchVentasAsociadas = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ordenesproduccion/todas_ventas_asociadas");
      const ventasAsociadas = response.data.map(venta => venta.numero_venta);
      setVentasAsociadas(ventasAsociadas);
    } catch (error) {
      console.error("Error fetching ventas asociadas:", error);
    }
  };

  const loadOrderDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/ordenesproduccion/${orden.id_orden}/ventas_asociadas`);
      const ventasAsociadas = response.data.map(venta => venta.numero_venta);
      setSelectedVentas(ventasAsociadas);
      setVentasAsociadasActuales(ventasAsociadas);

      const detallesProduccion = {};
      for (const numero_venta of ventasAsociadas) {
        const venta = ventas.find(v => v.numero_venta === numero_venta);
        if (venta) {
          venta.detalles.forEach(detalle => {
            if (detallesProduccion[detalle.id_producto]) {
              detallesProduccion[detalle.id_producto].cantidad += detalle.cantidad;
            } else {
              detallesProduccion[detalle.id_producto] = {
                nombre: productos[detalle.id_producto] || `Producto ${detalle.id_producto}`,
                cantidad: detalle.cantidad,
              };
            }
          });
        }
      }

      setProductionDetails(detallesProduccion);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading order details:", error);
    }
  };

  const aplicarFiltradoDeVentas = () => {
    const filtradas = ventas.filter(venta =>
      !ventasAsociadas.includes(venta.numero_venta) || ventasAsociadasActuales.includes(venta.numero_venta)
    );
    setVentasFiltradas(filtradas);
  };

  const handleVentaChange = (numero_venta, isChecked) => {
    const venta = ventas.find(v => v.numero_venta === numero_venta);

    if (!venta) {
      console.log("Venta no encontrada para:", numero_venta);
      return;
    }

    if (isChecked) {
      setSelectedVentas([...selectedVentas, numero_venta]);

      const nuevosDetalles = { ...productionDetails };
      venta.detalles.forEach(detalle => {
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
      const nuevasVentasSeleccionadas = selectedVentas.filter(num => num !== numero_venta);
      setSelectedVentas(nuevasVentasSeleccionadas);

      const nuevosDetalles = { ...productionDetails };
      venta.detalles.forEach(detalle => {
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

  const handleUpdateProductionSave = async () => {
    // Calcular el total de productos de la orden editada
    const totalProductosNuevaOrden = Object.values(productionDetails).reduce((total, detalle) => total + detalle.cantidad, 0);

    // Calcular productos restantes para llegar al límite
    const productosRestantes = LIMITE_PRODUCCION - totalProductosEnProduccion;

    // Verificar si se supera el límite de capacidad
    if (totalProductosNuevaOrden > productosRestantes) {
      Swal.fire({
        icon: "error",
        title: "Capacidad excedida",
        text: `No se puede actualizar la orden de producción porque se excedería el límite de ${LIMITE_PRODUCCION} productos por día. Puedes agregar un máximo de ${productosRestantes} productos.`,
      });
      return; // No continuar con la actualización de la orden
    }

    const updatedOrder = {
      fecha_orden: new Date().toISOString().split('T')[0],
      productos: Object.entries(productionDetails).map(([id_producto, detalle]) => ({
        id_producto: parseInt(id_producto),
        cantidad: detalle.cantidad,
      })),
      numero_ventas: selectedVentas,
    };

    try {
      await axios.put(`http://localhost:3000/api/ordenesproduccion/${orden.id_orden}`, updatedOrder);
      Swal.fire({
        icon: "success",
        title: "Orden de producción actualizada correctamente",
      });
      handleEditProductionOpen();
    } catch (error) {
      console.error("Error al actualizar la orden de producción:", error);
      Swal.fire({
        icon: "error",
        title: "Hubo un problema al actualizar la orden de producción",
      });
    }
  };

  return (
    <Dialog
      open={open}
      handler={handleEditProductionOpen}
      className="custom-modal w-screen h-screen"
      size="xxl"
    >
      <div className="flex justify-between items-center p-4">
        <IconButton
          variant="text"
          color="blue-gray"
          size="sm"
          onClick={handleEditProductionOpen}
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </IconButton>
        <Typography variant="h5" color="blue-gray">
          Editar Orden de Producción
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
        <Checkbox
          id={`venta-${venta.id_venta}`}
          label={`Venta ${venta.numero_venta} - Cliente: ${venta.cliente.nombre} - Documento: ${venta.cliente.numero_documento}`}
          onChange={(e) => handleVentaChange(venta.numero_venta, e.target.checked)}
          checked={selectedVentas.includes(venta.numero_venta)}
        />
        <div style={{ fontWeight: 'bold', marginTop: '8px' }}>
          <span>Fecha de Entrega:</span>
          <br />
          <span>{new Date(venta.fecha_entrega).toISOString().split('T')[0]}</span>
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
          onClick={handleEditProductionOpen}
        >
          Cancelar
        </Button>
        <Button
          variant="gradient"
          className="btnagregarm"
          size="sm"
          onClick={handleUpdateProductionSave}
        >
          Guardar Cambios
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default EditarProduccion;