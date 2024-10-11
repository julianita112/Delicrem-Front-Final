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

export function Producir({ open, handleProductionOpen, productosActivos }) {
  const [ventas, setVentas] = useState([]);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [productionDetails, setProductionDetails] = useState([]);
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    fetchVentas();
    fetchPedidos();

    // Polling para actualizar ventas cada 10 segundos
    const pollingInterval = setInterval(() => {
      fetchVentas();
    }, 3000);

    return () => clearInterval(pollingInterval);
  }, []);

  const fetchVentas = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ventas");
      const ventasFiltradas = response.data.filter(
        (v) => v.activo && v.estado === "en preparación"
      );
      setVentas(ventasFiltradas);
    } catch (error) {
      console.error("Error fetching ventas:", error);
    }
  };

  const fetchPedidos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/pedidos");
      setPedidos(response.data);
    } catch (error) {
      console.error("Error fetching pedidos:", error);
    }
  };

  const handleVentaChange = (id_venta, isChecked) => {
    if (isChecked) {
      const venta = ventas.find((v) => v.id_venta === id_venta);
      const pedido = pedidos.find((p) => p.numero_pedido === venta.numero_pedido);
      if (venta && pedido) {
        const nuevosDetalles = [...productionDetails];
        const fechaEntrega = pedido.fecha_entrega;

        venta.detalles.forEach((detalle) => {
          const existingDetail = nuevosDetalles.find(
            (d) =>
              d.id_producto === detalle.id_producto &&
              d.fecha_entrega === fechaEntrega
          );
          if (existingDetail) {
            existingDetail.cantidad += detalle.cantidad;
          } else {
            nuevosDetalles.push({ ...detalle, fecha_entrega: fechaEntrega });
          }
        });

        setProductionDetails(nuevosDetalles);
        setSelectedVentas([...selectedVentas, id_venta]);
      }
    } else {
      const nuevasVentasSeleccionadas = selectedVentas.filter(
        (id) => id !== id_venta
      );
      const venta = ventas.find((v) => v.id_venta === id_venta);
      const pedido = pedidos.find((p) => p.numero_pedido === venta.numero_pedido);

      if (venta && pedido) {
        const fechaEntrega = pedido.fecha_entrega;
        const nuevosDetalles = productionDetails.reduce((acc, detalle) => {
          const detalleVenta = venta.detalles.find(
            (d) => d.id_producto === detalle.id_producto
          );

          if (
            detalleVenta &&
            detalle.fecha_entrega === fechaEntrega &&
            detalle.cantidad === detalleVenta.cantidad
          ) {
            // No añadir el detalle si coincide con el que se está desmarcando
          } else if (
            detalleVenta &&
            detalle.fecha_entrega === fechaEntrega
          ) {
            const nuevaCantidad = detalle.cantidad - detalleVenta.cantidad;
            acc.push({ ...detalle, cantidad: nuevaCantidad });
          } else {
            acc.push(detalle);
          }

          return acc;
        }, []);

        setProductionDetails(nuevosDetalles);
        setSelectedVentas(nuevasVentasSeleccionadas);
      }
    }
  };

  const handleProductionSave = async () => {
    try {
      await axios.post("http://localhost:3000/api/productos/producir", {
        productosProduccion: productionDetails,
      });
      Swal.fire({
        icon: "success",
        title: "Producción realizada correctamente",
      });
      setSelectedVentas([]);
      setProductionDetails([]);
      handleProductionOpen();
    } catch (error) {
      console.error("Error al realizar la producción:", error);
      Swal.fire({
        icon: "error",
        title: "Hubo un problema al realizar la producción",
      });
    }
  };

  // Agrupar ventas por fecha de entrega
  const ventasAgrupadasPorFecha = ventas.reduce((acc, venta) => {
    const pedido = pedidos.find((p) => p.numero_pedido === venta.numero_pedido);
    if (pedido) {
      const fechaEntrega = pedido.fecha_entrega.split("T")[0];
      if (!acc[fechaEntrega]) {
        acc[fechaEntrega] = [];
      }
      acc[fechaEntrega].push(venta);
    }
    return acc;
  }, {});

  // Calcular total de productos por fecha de entrega
  const totalProductosPorFecha = productionDetails.reduce((acc, detalle) => {
    const fechaEntrega = detalle.fecha_entrega.split('T')[0];
    if (!acc[fechaEntrega]) {
      acc[fechaEntrega] = 0;
    }
    acc[fechaEntrega] += detalle.cantidad;
    return acc;
  }, {});

  return (
    <Dialog
      open={open}
      handler={handleProductionOpen}
      className="custom-modal w-screen h-screen"
      size="xxl"
    >
      <div className="flex justify-between items-center p-4">
        <IconButton
          variant="text"
          color="blue-gray"
          size="sm"
          onClick={handleProductionOpen}
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </IconButton>
        <Typography variant="h5" color="blue-gray">
          Producción
        </Typography>
        <div className="w-6"></div> {/* Placeholder para equilibrar el espacio */}
      </div>
      <DialogBody divider className="flex h-[80vh] p-4 gap-6">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          <Typography variant="h6" color="blue-gray" className="mb-4 text-sm">
            Seleccionar Pedidos a Producir
          </Typography>
          {Object.entries(ventasAgrupadasPorFecha).map(([fechaEntrega, ventas]) => (
            <div key={fechaEntrega} className="mb-4">
              <Typography variant="subtitle1" color="blue-gray" className="mb-2">
                Fecha de Entrega: {fechaEntrega}
              </Typography>
              <ul>
                {ventas.map((venta) => (
                  <li key={venta.id_venta} className="mb-2">
                    <Checkbox
                      id={`venta-${venta.id_venta}`}
                      label={`Pedido ${venta.numero_pedido}`}
                      onChange={(e) =>
                        handleVentaChange(venta.id_venta, e.target.checked)
                      }
                      checked={selectedVentas.includes(venta.id_venta)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>



        <div className="w-full max-w-xs bg-gray-100 p-4 rounded-lg shadow-md max-h-[80vh] overflow-y-auto">
  <Typography variant="h6" color="blue-gray" className="mb-4 text-lg">
    Resumen de Producción
  </Typography>
  {Object.entries(
    productionDetails.reduce((acc, detalle) => {
      const fechaEntrega = detalle.fecha_entrega.split('T')[0];
      if (!acc[fechaEntrega]) {
        acc[fechaEntrega] = [];
      }
      acc[fechaEntrega].push(detalle);
      return acc;
    }, {})
  ).map(([fecha, detalles]) => (
    <div key={fecha} className="mb-4">
      <Typography variant="subtitle1" color="blue-gray">
        Fecha de Entrega: {fecha}
      </Typography>
      <ul className="list-disc pl-4 text-sm">
        {detalles.map((detalle, index) => {
          // Encuentra el producto correspondiente en productosActivos
          const productoSeleccionado = productosActivos.find(
            (p) => p.id_producto === detalle.id_producto
          );

          // Depuración
          console.log('Detalle:', detalle);
          console.log('Producto Seleccionado:', productoSeleccionado);

          return (
            <li key={index} className="mb-2">
              <span className="font-semibold text-gray-800">
                {productoSeleccionado ? productoSeleccionado.nombre : "Producto no encontrado"}:
              </span>{" "}
              Cantidad {detalle.cantidad}
            </li>
          );
        })}
      </ul>
      <Typography variant="h6" color="blue-gray" className="mt-4">
        Total Productos: {totalProductosPorFecha[fecha] || 0}
      </Typography>
    </div>
  ))}
</div>



      </DialogBody>
      <DialogFooter className="bg-white p-4 flex justify-end gap-2">
        <Button
          variant="text"
          className="btncancelarm"
          size="sm"
          onClick={handleProductionOpen}
        >
          Cancelar
        </Button>
        <Button
          variant="gradient"
          className="btnagregarm"
          size="sm"
          on
          Click={handleProductionSave}
          >
          Guardar Producción
          </Button>
          </DialogFooter>
          </Dialog>
          );
          }