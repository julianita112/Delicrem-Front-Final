import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
  IconButton,
  Dialog,
  Button,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import { EyeIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import axios from "../../utils/axiosConfig";
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export function OrdenesProducidas({handleBackToMain}) {
  const [ordenesProducidas, setOrdenesProducidas] = useState([]);
  const [estados, setEstados] = useState([]); // Guardar los estados
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState({});

  useEffect(() => {
    fetchOrdenesProducidas();
    fetchEstados(); // Llamar a la función para obtener los estados
  }, []);

  const fetchOrdenesProducidas = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/ordenesproduccion/producidas");
      setOrdenesProducidas(response.data);
    } catch (error) {
      console.error("Error fetching órdenes producidas:", error);
    }
  };

  const fetchEstados = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/estados");
      setEstados(response.data); // Guardar los estados obtenidos
    } catch (error) {
      console.error("Error fetching estados:", error);
    }
  };

  // Función para obtener el nombre del estado basado en el id_estado
  const getNombreEstado = (id_estado) => {
    const estado = estados.find(e => e.id_estado === id_estado);
    return estado ? estado.nombre_estado : "Estado desconocido";
  };

  const handleViewDetails = (orden) => {
    setSelectedOrden(orden);
    setDetailsOpen(true);
  };

  const handleDetailsOpen = () => setDetailsOpen(!detailsOpen);

  const handleCompleteOrder = async (idOrden) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "¿Quieres marcar esta orden como completada? Esta acción ajustará el stock de productos.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#A62A64',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Sí, completar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.put(`https://finalbackenddelicrem2.onrender.com/api/ordenesproduccion/${idOrden}/estado`, {
          estado: 'completado',
        });
        Toast.fire({
          icon: 'success',
          title: 'Orden marcada como completada y stock ajustado!'
        });
        fetchOrdenesProducidas(); // Refrescar la lista de órdenes producidas
      } catch (error) {
        console.error("Error al completar la orden:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al completar',
          text: 'Hubo un problema al intentar completar la orden.',
          confirmButtonText: 'Aceptar',
          background: '#ffff',
          iconColor: '#A62A64',
          confirmButtonColor: '#000000',
          customClass: {
            title: 'text-lg font-semibold',
            icon: 'text-2xl',
            confirmButton: 'px-4 py-2 text-white'
          }
        });
      }
    }
  };
  

  return (
    <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
      <CardBody className="p-4">
      <Button 
          onClick={handleBackToMain}
          className="mb-4 btnagregarm"
          color="black"
        >
          Volver a Órdenes de Producción
        </Button>

        <Typography variant="h5" color="blue-gray" className="mb-4">
          Historial de Órdenes Producidas
        </Typography>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número de Orden
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Orden
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Productos
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenesProducidas.map((orden) => (
                <tr key={orden.id_orden}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {orden.numero_orden}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {orden.fecha_orden}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getNombreEstado(orden.id_estado)} {/* Muestra el nombre del estado */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {orden.ordenProduccionDetalles.slice(0, 3).map(detalle => (
                      <div key={detalle.id_detalle_orden}>
                        <Typography className="text-sm">
                          {detalle.productoDetalleOrdenProduccion.nombre}: {detalle.cantidad}
                        </Typography>
                      </div>
                    ))}
                    {orden.ordenProduccionDetalles.length > 3 && (
                      <Typography className="text-sm text-gray-400">
                        y {orden.ordenProduccionDetalles.length - 3} más...
                      </Typography>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-1">
                      <IconButton
                        className="btnvisualizar"
                        size="sm"
                        onClick={() => handleViewDetails(orden)}
                      >
                        <EyeIcon className="h-4 w-4" />
                      </IconButton>
                      {orden.id_estado !== 1 && ( // Mostrar solo si el estado no es 'Completado'
                        <IconButton
                          className="btnagregarm"
                          size="sm"
                          color="blue"
                          onClick={() => handleCompleteOrder(orden.id_orden)}
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                        </IconButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>

      <Dialog open={detailsOpen} handler={handleDetailsOpen} className="max-w-xs w-11/12 bg-white rounded-lg shadow-lg" size="xs">
        <DialogHeader className="text-xl font-bold  text-blue-gray-900">
          Detalles de la Orden de Producida
        </DialogHeader>
        <DialogBody className="space-y-2">
          <div className="space-y-1">
            <Typography variant="subtitle2" className="font-bold text-gray-800">ID Orden:</Typography>
            <Typography className="text-sm">{selectedOrden.id_orden}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Número de Orden:</Typography>
            <Typography className="text-sm">{selectedOrden.numero_orden}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Fecha de Orden:</Typography>
            <Typography className="text-sm">{selectedOrden.fecha_orden}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Estado:</Typography>
            <Typography className="text-sm">{getNombreEstado(selectedOrden.id_estado)}</Typography> {/* Mostrar nombre del estado */}
            <Typography variant="subtitle2" className="font-bold text-gray-800">Productos:</Typography>
            {selectedOrden.ordenProduccionDetalles?.map(detalle => (
              <Typography key={detalle.id_detalle_orden} className="text-sm">
                {detalle.productoDetalleOrdenProduccion.nombre}: {detalle.cantidad}
              </Typography>
            ))}
            <Typography variant="subtitle2" className="font-bold text-gray-800">Creado:</Typography>
            <Typography className="text-sm">{selectedOrden.createdAt ? new Date(selectedOrden.createdAt).toLocaleString() : 'N/A'}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Actualizado:</Typography>
            <Typography className="text-sm">{selectedOrden.updatedAt ? new Date(selectedOrden.updatedAt).toLocaleString() : 'N/A'}</Typography>
          </div>
        </DialogBody>
        <DialogFooter className="flex justify-center">
          <Button className="btncancelarm" size="sm" onClick={handleDetailsOpen}>
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>
    </Card>
  );
}

export default OrdenesProducidas;