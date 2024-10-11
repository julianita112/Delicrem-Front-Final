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
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/solid";
import axios from "../../utils/axiosConfig";
import ClienteCrear from "./ClienteCrear";
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

export function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [filteredClientes, setFilteredClientes] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState({
    id_cliente: "",
    nombre: "",
    contacto: "",
    email: "",
    tipo_documento: "",
    numero_documento: "",
    estado: true,
    createdAt: "",
    updatedAt: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [clientesPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/clientes");
      setClientes(response.data);
      setFilteredClientes(response.data);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    }
  };

  useEffect(() => {
    const filtered = clientes.filter((cliente) =>
      cliente.nombre.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredClientes(filtered);
  }, [search, clientes]);

  const handleShowCreateForm = () => {
    setSelectedCliente({
      id_cliente: "",
      nombre: "",
      contacto: "",
      email: "",
      tipo_documento: "",
      numero_documento: "",
      estado: true,
      createdAt: "",
      updatedAt: ""
    });
    setEditMode(false);
    setFormErrors({});
    setShowCreateForm(true);
  };

  const handleHideCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleEdit = (cliente) => {
    setSelectedCliente(cliente);
    setEditMode(true);
    setFormErrors({});
    setShowCreateForm(true); // Mostrar el formulario también para la edición
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Estás seguro de que deseas eliminar este cliente?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
        await axios.delete(`https://finalbackenddelicrem2.onrender.com/api/clientes/${id}`);
        fetchClientes();
        Toast.fire({
          icon: 'success',
          title: '¡Eliminado! El cliente ha sido eliminado.'
        });
      } catch (error) {
        console.error("Error deleting cliente:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'El cliente no se puede eliminar porque se encuentra asociado a una venta o pedido.',
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

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleViewDetails = (cliente) => {
    setSelectedCliente(cliente);
    setDetailsOpen(true);  // Abrir modal de detalles
  };

  const handleDetailsOpen = () => setDetailsOpen(!detailsOpen);

  const handleToggleEstado = async (cliente) => {
    // Suponiendo que tienes una función que verifica las asociaciones
    const tieneAsociaciones = await verificarAsociaciones(cliente.id_cliente);
  
    // Si el cliente está asociado a un pedido o venta, muestra un mensaje y termina la función
    if (cliente.estado && tieneAsociaciones) {
      Swal.fire({
        icon: 'error',
        title: 'No se puede desactivar el cliente',
        text: 'Este cliente está asociado a un pedido o a una venta.',
        confirmButtonColor: '#A62A64',
        confirmButtonText: 'Aceptar'
      });
      return; // Salir de la función
    }
  
    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${cliente.estado ? 'desactivar' : 'activar'} el cliente?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#A62A64',
      cancelButtonColor: '#000000',
      confirmButtonText: `Sí, ${cliente.estado ? 'desactivar' : 'activar'}`,
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
        await axios.patch(`https://finalbackenddelicrem2.onrender.com/api/clientes/${cliente.id_cliente}/estado`, {
          estado: !cliente.estado,
        });
        fetchClientes();
        Toast.fire({
          icon: 'success',
          title: `El cliente ha sido ${!cliente.estado ? 'activado' : 'desactivado'} correctamente.`,
        });
      } catch (error) {
        console.error("Error al cambiar el estado del cliente:", error);
        Toast.fire({
          icon: 'error',
          title: 'Hubo un problema al cambiar el estado del cliente.',
        });
      }
    }
  };
  
  // Ejemplo de función para verificar asociaciones (implementación debe adaptarse a tu lógica)
  const verificarAsociaciones = async (id_cliente) => {
    try {
      const response = await axios.get(`https://finalbackenddelicrem2.onrender.com/api/clientes/${id_cliente}/verificar-asociaciones`);
      return response.data.asociado; // Supongamos que devuelve un booleano
    } catch (error) {
      console.error("Error al verificar asociaciones:", error);
      return false; // Si hay un error, asumimos que no hay asociaciones
    }
  };
  

  const indexOfLastCliente = currentPage * clientesPerPage;
  const indexOfFirstCliente = indexOfLastCliente - clientesPerPage;
  const currentClientes = filteredClientes.slice(indexOfFirstCliente, indexOfLastCliente);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
     <div className="relative h-20 w-full overflow-hidden rounded-xl bg-cover bg-center">
     <div className="absolute inset-0 h-full w-full bg-white-900/75" />
      </div>


      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
  <CardBody className="p-4">
    {showCreateForm ? (
      <ClienteCrear
        selectedCliente={selectedCliente}
        setSelectedCliente={setSelectedCliente}
        fetchClientes={fetchClientes}
        handleHideCreateForm={handleHideCreateForm}
      />
    ) : (
      <>
        <div className="flex items-center justify-between mb-6">
          <Button 
            onClick={handleShowCreateForm} 
            className="btnagregar w-40" // Ajusta el ancho horizontal del botón
            size="sm" 
            startIcon={<PlusIcon className="h-4 w-4" />}
          >
            Crear Cliente
          </Button>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={handleSearchChange}
            className="ml-4 border border-gray-300 rounded-md focus:border-blue-500 appearance-none shadow-none py-2 px-4 text-sm"
            style={{ width: '265px' }} // Ajusta el ancho del campo de búsqueda
          />
        </div>
              
              <div className="mb-1">
                <Typography variant="h5" color="blue-gray" className="mb-4">
                  Lista de Clientes
                </Typography>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nombre
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Número de teléfono
                        </th>
                        <th scope="col" className="px-16 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo Documento
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Número Documento
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentClientes.map((cliente) => (
                        <tr key={cliente.id_cliente}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {cliente.nombre}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {cliente.contacto}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {cliente.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {cliente.tipo_documento}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {cliente.numero_documento}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleToggleEstado(cliente)}
                              className={`relative inline-flex items-center h-6 w-12 rounded-full p-1 duration-300 ease-in-out ${
                                cliente.estado
                                  ? 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg'
                                  : 'bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg'
                              }`}
                            >
                              <span
                                className={`inline-block w-5 h-5 transform bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                                  cliente.estado ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-1">
                              <IconButton
                                className="btnedit"
                                size="sm"
                                onClick={() => handleEdit(cliente)}
                                disabled={!cliente.estado}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </IconButton>
                              <IconButton
                                className="btncancelarinsumo"
                                size="sm"
                                color="red"
                                onClick={() => handleDelete(cliente.id_cliente)}
                                disabled={!cliente.estado}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </IconButton>
                              <IconButton
                                className="btnvisualizar"
                                size="sm"
                                onClick={() => handleViewDetails(cliente)}
                                
                              >
                                <EyeIcon className="h-4 w-4" />
                              </IconButton>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-center mt-4">
                  {Array.from({ length: Math.ceil(filteredClientes.length / clientesPerPage) }, (_, i) => i + 1).map(number => (
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
            </>
          )}
        </CardBody>
      </Card>

      <Dialog open={detailsOpen} handler={handleDetailsOpen} className="max-w-xs w-11/12 bg-white rounded-lg shadow-lg" size="xs">
        <DialogHeader className="text-2xl font-bold  text-blue-gray-900">
          Detalles del Cliente
        </DialogHeader>
        <DialogBody className="space-y-2">
          <div className="space-y-1">
            <Typography variant="subtitle2" className="font-bold text-gray-800">ID único:</Typography>
            <Typography className="text-sm">{selectedCliente.id_cliente}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Nombre del cliente:</Typography>
            <Typography className="text-sm">{selectedCliente.nombre}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Número de teléfono:</Typography>
            <Typography className="text-sm">{selectedCliente.contacto}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Email:</Typography>
            <Typography className="text-sm">{selectedCliente.email}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Tipo Documento:</Typography>
            <Typography className="text-sm">{selectedCliente.tipo_documento}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Número Documento:</Typography>
            <Typography className="text-sm">{selectedCliente.numero_documento}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Creado:</Typography>
            <Typography className="text-sm">{selectedCliente.createdAt ? new Date(selectedCliente.createdAt).toLocaleString() : 'N/A'}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Actualizado:</Typography>
            <Typography className="text-sm">{selectedCliente.updatedAt ? new Date(selectedCliente.updatedAt).toLocaleString() : 'N/A'}</Typography>
          </div>
        </DialogBody>
        <DialogFooter className="flex justify-center">
          <Button className="btncancelarm" size="sm" onClick={handleDetailsOpen}>
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export default Clientes;