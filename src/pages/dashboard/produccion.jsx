import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Input,
  IconButton,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import { PlusIcon, EyeIcon, CogIcon, ArrowDownTrayIcon, ArchiveBoxArrowDownIcon, PencilIcon, TrashIcon, XMarkIcon, ClipboardDocumentListIcon } from "@heroicons/react/24/solid";
import axios from "../../utils/axiosConfig";
import Swal from 'sweetalert2';
import OrdenesProducidas from "./OrdenesProducidas";
import OrdenesInactivas from "./OrdenesInactivas";
import CrearProduccion from "./CrearProduccion";
import EditarProduccion from "./EditarProduccion";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ClipboardDocumentCheckIcon } from "@heroicons/react/24/outline";


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


export function OrdenesProduccion() {
  const [ordenes, setOrdenes] = useState([]);
  const [filteredOrdenes, setFilteredOrdenes] = useState([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [ordenesPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [showOrdenesProducidas, setShowOrdenesProducidas] = useState(false);
  const [showOrdenesInactivas, setShowOrdenesInactivas] = useState(false);
  const [showCrearProduccion, setShowCrearProduccion] = useState(false);
  const [showEditarProduccion, setShowEditarProduccion] = useState(false);
  const [estados, setEstados] = useState([]);  // Para guardar los estados
  const [showAnulacionDialog, setShowAnulacionDialog] = useState(false); // Diálogo para anulación
  const [ordenToAnular, setOrdenToAnular] = useState(null); // Orden seleccionada para anular
  const [motivoAnulacion, setMotivoAnulacion] = useState(""); // Motivo de anulación


  // Obtener las órdenes y los estados
  useEffect(() => {
    fetchOrdenes();
    fetchEstados();  // Llamar a la API de estados
  }, []);


  // Obtener estados desde la API
  const fetchEstados = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/estados");
      setEstados(response.data); // Guardar los estados en el state
    } catch (error) {
      console.error("Error fetching estados:", error);
    }
  };


  const fetchOrdenes = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ordenesproduccion");
      setOrdenes(response.data);
      setFilteredOrdenes(response.data);
    } catch (error) {
      console.error("Error fetching ordenes de producción:", error);
    }
  };


  // Filtrar las órdenes por búsqueda
  useEffect(() => {
    const filtered = ordenes.filter((orden) =>
      orden.numero_orden.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredOrdenes(filtered);
  }, [search, ordenes]);


  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };


  const handleViewDetails = (orden) => {
    setSelectedOrden(orden);
    setDetailsOpen(true);
  };


  const handleDetailsOpen = () => setDetailsOpen(!detailsOpen);


  // Función para obtener el nombre del estado según el id_estado
  const getNombreEstado = (id_estado) => {
    const estado = estados.find(est => est.id_estado === id_estado);
    return estado ? estado.nombre_estado : 'Desconocido';  // Mostrar "Desconocido" si no se encuentra
  };


  const handleProducirWithConfirmation = async (id_orden) => {
    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas producir esta orden?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#A62A64',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Sí, producir',
      cancelButtonText: 'Cancelar',
    });


    if (result.isConfirmed) {
      handleProducir(id_orden); // Llama a la función de producción si se confirma
    }
  };


  const handleProducir = async (idOrden) => {
    try {
      await axios.post(`http://localhost:3000/api/ordenesproduccion/${idOrden}/producir`);
      Toast.fire({
        icon: 'success',
        title: '¡Orden producida exitosamente!'
      });
      fetchOrdenes(); // Actualizar la lista de órdenes después de la producción
    } catch (error) {
      console.error("Error produciendo la orden:", error);
 
      // Capturar el mensaje de error enviado por el backend
      const errorMessage = error.response && error.response.data && error.response.data.error
        ? error.response.data.error
        : 'Hubo un problema al intentar producir la orden.';
 
      Swal.fire({
        icon: 'error',
        title: 'Error al producir',
        html: errorMessage.replace(/\n/g, '<br/>'), // Mostrar el mensaje real del backend
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
  };


  // Función para anular orden
  const handleAnularOrden = (orden) => {
    setOrdenToAnular(orden);
    setShowAnulacionDialog(true); // Mostrar diálogo de anulación
  };


  const handleConfirmAnulacion = async () => {
    if (!motivoAnulacion.trim()) {
      Toast.fire({
        icon: 'error',
        title: 'Debe proporcionar un motivo de anulación.',
      });
      return;
    }


    try {
      await axios.patch(`http://localhost:3000/api/ordenesproduccion/${ordenToAnular.id_orden}/estado`, {
        id_estado: 5, // Estado Anulado
        motivo_anulacion: motivoAnulacion,
      });
      Toast.fire({
        icon: 'success',
        title: 'Orden de producción anulada correctamente.'
      });
      fetchOrdenes(); // Actualizar la lista de órdenes
      setShowAnulacionDialog(false);
      setMotivoAnulacion('');
    } catch (error) {
      console.error("Error al anular la orden:", error);
      Toast.fire({
        icon: 'error',
        title: 'Hubo un problema al anular la orden de producción.',
      });
    }
  };


  const handleEditOrden = (orden) => {
    setSelectedOrden(orden);
    setShowEditarProduccion(true);
  };


  const toggleOrdenesProducidas = () => {
    setShowOrdenesProducidas(!showOrdenesProducidas);
    setShowOrdenesInactivas(false); // Asegurar que no se muestren ambas listas al mismo tiempo
  };


  const toggleOrdenesInactivas = () => {
    setShowOrdenesInactivas(!showOrdenesInactivas);
    setShowOrdenesProducidas(false); // Asegurar que no se muestren ambas listas al mismo tiempo
  };


  const toggleCrearProduccion = () => {
    setShowCrearProduccion(!showCrearProduccion);
    if (showCrearProduccion) {
      fetchOrdenes(); // Refresca las órdenes al cerrar el diálogo
    }
  };


  const toggleEditarProduccion = () => {
    setShowEditarProduccion(!showEditarProduccion);
    if (showEditarProduccion) {
      fetchOrdenes(); // Refresca las órdenes al cerrar el diálogo
    }
  };


  const handleDownloadDetails = (orden) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
 
    // Agregar el logo en la parte superior izquierda
    const logo = "/img/delicremlogo.png";
    doc.addImage(logo, "JPEG", 10, 10, 30, 15);
 
    // Título del PDF centrado, alineado verticalmente con el logo
    doc.setFontSize(20);
    doc.text('Detalles de la Orden de Producción', 105, 20, { align: 'center' });
 
    // Información general de la orden
    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50); // Color gris oscuro para texto
    doc.text(`Número de Orden: ${orden.numero_orden}`, 20, 50);
    doc.text(`Fecha de Orden: ${new Date(orden.fecha_orden).toLocaleDateString()}`, 20, 58);
 
    // Detalles de los productos
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // Negro para encabezados
    doc.text('Detalles de los Productos', 20, 75);
 
    // Agregar tabla con detalles de los productos
    doc.autoTable({
      startY: 85,
      head: [['Producto', 'Cantidad']],
      body: orden.ordenProduccionDetalles.map(detalle => [
        detalle.productoDetalleOrdenProduccion.nombre,
        detalle.cantidad
      ]),
      theme: 'grid',
      styles: {
        fillColor: [230, 230, 230], // Color gris claro para el fondo de la tabla
        textColor: [0, 0, 0], // Negro para el texto
        lineColor: [0, 0, 0], // Negro para las líneas
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [174, 1, 126], // Color #AE017E para el encabezado
        textColor: [255, 255, 255], // Blanco para el texto del encabezado
      },
    });
 
    // Información adicional
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50); // Gris oscuro para información adicional
    doc.text(`Fecha de Creación: ${new Date(orden.createdAt).toLocaleString()}`, 20, doc.internal.pageSize.height - 20);
    doc.text(`Última Actualización: ${new Date(orden.updatedAt).toLocaleString()}`, 20, doc.internal.pageSize.height - 10);
 
    doc.save(`Orden_${orden.numero_orden}_detalles.pdf`);
  };


  const indexOfLastOrden = currentPage * ordenesPerPage;
  const indexOfFirstOrden = indexOfLastOrden - ordenesPerPage;
  const currentOrdenes = filteredOrdenes.slice(indexOfFirstOrden, indexOfLastOrden);


  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleBackToMain = () => {
    setShowOrdenesProducidas(false); // Asegúrate de que esté manipulando correctamente el estado
  };
  
  const handleBackToMain2 = () => {
    setShowOrdenesInactivas(false); // Asegúrate de que esté manipulando correctamente el estado
  };



  return (
    <div className="flex">
      {/* Main Content */}
      <div className="w-3/4">
        <div className="relative h-20 w-full overflow-hidden rounded-xl bg-cover bg-center">
          <div className="absolute inset-0 h-full w-full bg-white-900/75" />
        </div>


        {showOrdenesProducidas ? (
          <OrdenesProducidas handleBackToMain={handleBackToMain}/>
        ) : showOrdenesInactivas ? (
          <OrdenesInactivas handleBackToMain={handleBackToMain2} />
        ) : (
          <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
            <CardBody className="p-6">
              <Input
                type="text"
                placeholder="Buscar por número de orden..."
                value={search}
                onChange={handleSearchChange}
                className="mb-20"
              />
              <div className="mb-3">
              <Typography
  variant="h5"
  color="blue-gray"
  className="mb-4"
  style={{ paddingTop: '15px' }} // Ajusta el valor según necesites
>
  Lista de Órdenes de Producción
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
                          Productos
                        </th>
                        <th scope="col" className="px-20 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th scope="col" className="px-20 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentOrdenes.map((orden) => (
                        <tr key={orden.id_orden}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {orden.numero_orden}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {orden.fecha_orden}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getNombreEstado(orden.id_estado)} {/* Mostrar el nombre del estado */}
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


                              <IconButton
  className="btnproducir"
  size="sm"
  color="green"
  onClick={() => handleProducirWithConfirmation(orden.id_orden)}
>
  <ClipboardDocumentCheckIcon className="h-4 w-4" />
</IconButton>


                              <IconButton
                                className="btnedit"
                                size="sm"
                                color="blue"
                                onClick={() => handleEditOrden(orden)}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </IconButton>




                              <IconButton
  className="btnanular"
  size="sm"
  color="red"
  onClick={() => handleAnularOrden(orden)}
>
  <XMarkIcon className="h-4 w-4" /> {/* Utiliza el nuevo ícono aquí */}
</IconButton>






                             
                              <IconButton
                                className="btnpdf"
                                size="sm"
                                onClick={() => handleDownloadDetails(orden)}
                              >
                                <ArrowDownTrayIcon className="h-4 w-4" />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center mt-4">
                  {Array.from({ length: Math.ceil(filteredOrdenes.length / ordenesPerPage) }, (_, i) => i + 1).map(number => (
                    <Button
                      key={number}
                      className={`pagination ${currentPage === number ? "active" : ""}`}
                      onClick={() => paginate(number)}
                    >
                      {number}
                    </Button>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>
        )}
      </div>


      {/* Sidebar dentro del componente */}
      <div className="w-1/4 p-6 bg-gray-50 border-l border-gray-200 shadow-md">
        <Typography variant="h6" color="blue-gray" className="mb-6 font-semibold text-lg">
          Opciones
        </Typography>
        <ul className="space-y-4">
          <li>
            <Button
              fullWidth
              className="btnagregarm"
              size="sm"
              onClick={toggleCrearProduccion}
            >
              Crear Órdenes de Producción
            </Button>
          </li>
          <li>
            <Button
              fullWidth
              className="btnagregarm"
              size="sm"
              onClick={toggleOrdenesProducidas}
            >
              Órdenes Producidas
            </Button>
          </li>
          <li>
            <Button
              fullWidth
              className="btnagregarm"
              size="sm"
              onClick={toggleOrdenesInactivas}
            >
              Órdenes Anuladas
            </Button>
          </li>
        </ul>
      </div>


      {/* Modal de detalles */}
      <Dialog open={detailsOpen} handler={handleDetailsOpen} className="max-w-xs w-11/12 bg-white rounded-lg shadow-lg" size="xs">
        <DialogHeader className="text-xl font-bold  text-blue-gray-900">
          Detalles de la Orden de Producción
        </DialogHeader>
        <DialogBody className="space-y-2">
          <div className="space-y-1">
            <Typography variant="subtitle2" className="font-bold text-gray-800">ID Orden:</Typography>
            <Typography className="text-sm">{selectedOrden.id_orden}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Número de Orden:</Typography>
            <Typography className="text-sm">{selectedOrden.numero_orden}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Fecha de Orden:</Typography>
            <Typography className="text-sm">{selectedOrden.fecha_orden}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Producción Completada:</Typography>
            <Typography className="text-sm">{selectedOrden.produccion_completada ? "Sí" : "No"}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Estado:</Typography>
            <Typography className="text-sm">{getNombreEstado(selectedOrden.id_estado)}</Typography> {/* Mostrar el estado aquí */}
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


     {/* Modal de anulación */}
{showAnulacionDialog && (
  <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
    <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full transition-transform transform scale-100 hover:scale-105">
    <Typography variant="h5" className="font-semibold mb-4 text-righ">
      Motivo de Anulación de la Orden de Producción
      </Typography>
      <textarea
        label="Motivo de Anulación"
        value={motivoAnulacion}
        onChange={(e) => setMotivoAnulacion(e.target.value)}
        type="text"
         placeholder="Escribe el motivo de anulación aquí..."
         className={`w-full p-4 border ${motivoAnulacion.length < 5 || motivoAnulacion.length > 30 ? 'border-red-500' : 'border-gray-300'} rounded-lg mb-4 resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition duration-200`}
         rows={4}
         required
      />
     
      {motivoAnulacion.length < 5 && (
        <p className="text-red-500 text-sm">El motivo debe tener al menos 5 letras.</p>
      )}
      {motivoAnulacion.length > 30 && (
        <p className="text-red-500 text-sm">El motivo no puede tener más de 30 letras.</p>
      )}
      <div className="flex justify-end gap-3 mt-4">
        <Button
          variant="text"
          className="btncancelarm text-white"
          size="sm"
          onClick={() => setShowAnulacionDialog(false)}
        >
          Cancelar
        </Button>
        <Button
          variant="gradient"
         className="btnagregarm bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition duration-200"
          size="sm"
          disabled={motivoAnulacion.length < 5 || motivoAnulacion.length > 30} // Deshabilitar el botón si no cumple la validación
          onClick={handleConfirmAnulacion}
        >
          Anular Orden
        </Button>
      </div>
    </div>
  </div>
)}




      {/* Incluir los componentes CrearProduccion y EditarProduccion con su estado de visibilidad */}
      <CrearProduccion open={showCrearProduccion} handleCreateProductionOpen={toggleCrearProduccion} refreshOrders={fetchOrdenes} />
      <EditarProduccion open={showEditarProduccion} handleEditProductionOpen={toggleEditarProduccion} orden={selectedOrden} refreshOrders={fetchOrdenes} />
    </div>
  );
}


export default OrdenesProduccion;


