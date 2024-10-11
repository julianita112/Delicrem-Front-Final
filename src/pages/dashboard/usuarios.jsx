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
import Swal from "sweetalert2";
import { useAuth } from "@/context/authContext";
import CrearUsuario from "./crearusuario";

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

export function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState({
    nombre: "",
    email: "",
    password: "",
    id_rol: "",
    tipo_documento: "",
    numero_documento: "",
    genero: "",
    nacionalidad: "",
    telefono: "",
    direccion: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [usuariosPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsuarios();
    fetchRoles();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/usuarios");
      const data = response.data;
      setUsuarios(data);
      setFilteredUsuarios(data.filter((usuario) => usuario.id_usuario !== currentUser.id_usuario));
    } catch (error) {
      console.error("Error fetching usuarios:", error);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/roles");
      const data = response.data;
      setRoles(data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  useEffect(() => {
    const filtered = usuarios.filter(
      (user) =>
        user.nombre.toLowerCase().includes(search.toLowerCase()) &&
        user.id_usuario !== currentUser.id_usuario
    );
    setFilteredUsuarios(filtered);
  }, [search, usuarios, currentUser.id_usuario]);

  const handleOpen = () => {
    setOpen(!open);
    setSelectedUser({
      nombre: "",
      email: "",
      password: "",
      id_rol: "",
      tipo_documento: "",
      numero_documento: "",
      genero: "",
      nacionalidad: "",
      telefono: "",
      direccion: "",
    });
    setEditMode(false);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditMode(true);
    setOpen(true);
  };

  const handleDelete = async (user) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Estás seguro de que deseas eliminar al usuario ${user.nombre}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#000000 ",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/api/usuarios/${user.id_usuario}`);
        fetchUsuarios();
        Toast.fire({
          icon: "success",
          title: "¡Eliminado! El usuario ha sido eliminado.",
        });
      } catch (error) {
        console.error("Error deleting usuario:", error);
        Toast.fire({
          icon: "error",
          title: "Error al eliminar usuario. Por favor, inténtalo de nuevo.",
        });
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const indexOfLastUsuario = currentPage * usuariosPerPage;
  const indexOfFirstUsuario = indexOfLastUsuario - usuariosPerPage;
  const currentUsuarios = filteredUsuarios.slice(indexOfFirstUsuario, indexOfLastUsuario);
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredUsuarios.length / usuariosPerPage); i++) {
    pageNumbers.push(i);
  }

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const handleDetailsOpen = () => setDetailsOpen(false);

  const toggleActivo = async (id_usuario, estado) => {
    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${estado ? 'desactivar' : 'activar'} el usuario?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#A62A64',
      cancelButtonColor: '#000000',
      confirmButtonText: `Sí, ${estado ? 'desactivar' : 'activar'}`,
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
  
        await axios.patch(`http://localhost:3000/api/usuarios/${id_usuario}/estado`, { estado: !estado });
        fetchUsuarios();
        Toast.fire({
          icon: 'success',
          title: `El usuario ha sido ${!estado ? 'activado' : 'desactivado'} correctamente.`,
        });
      } catch (error) {
        console.error("Error al cambiar el estado del usuario:", error);
        Toast.fire({
          icon: 'error',
          title: 'Hubo un problema al cambiar el estado del usuario.',
        });
      }
    }
  };

  return (
    <>
      <div className="relative h-20 w-full overflow-hidden rounded-xl bg-cover bg-center">
      <div className="absolute inset-0 h-full w-full bg-white-900/75" />
      </div>

      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
        <div className="flex items-center justify-between mb-6">
        <Button 
  onClick={handleOpen} 
  className="btnagregar" 
  color="green" 
  size="sm" 
  startIcon={<PlusIcon className="h-20 w-4" />} 
  style={{ width: '150px' }} 
>
  Crear Usuario
</Button>

  <input
  type="text"
  placeholder="Buscar por nombre de Usuario..."
  value={search}
  onChange={handleSearchChange}
  className="ml-[28rem] border border-gray-300 rounded-md focus:border-blue-500 appearance-none shadow-none py-2 px-4 text-sm" // Ajusta el padding vertical y horizontal
  style={{ width: '265px' }} 
/>
</div>
        <div className="mb-1">
            <Typography variant="h5" color="blue-gray" className="mb-4">
              Lista de Usuarios
            </Typography>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th className="px-20 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número Documento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Género</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dirección</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentUsuarios.map((user) => (
                    <tr key={user.id_usuario}>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{user.nombre}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">{user.email}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {roles.find((role) => role.id_rol === user.id_rol)?.nombre || "Rol no encontrado"}
                      </td>
                      <td className="px-10 py-4 whitespace-nowrap text-sm">{user.tipo_documento}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{user.numero_documento}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{user.genero}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{user.telefono}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{user.direccion}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => toggleActivo(user.id_usuario, user.estado)}
                          className={`relative inline-flex items-center cursor-pointer transition-transform duration-300 ease-in-out h-6 w-12 rounded-full focus:outline-none ${
                            user.estado
                              ? "bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg transform scale-105"
                              : "bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg transform scale-105"
                          }`}
                        >
                          <span
                            className={`transition-transform duration-300 ease-in-out ${
                              user.estado ? "translate-x-6" : "translate-x-1"
                            } inline-block w-5 h-5 transform bg-white rounded-full shadow-md`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-1">
                          <IconButton size="sm" className="btnedit" onClick={() => handleEdit(user)} disabled={!user.estado}>
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton className="btncancelarm" size="sm" onClick={() => handleDelete(user)} disabled={!user.estado}>
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton className="btnvisualizar" size="sm" onClick={() => handleViewDetails(user)}>
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
              {pageNumbers.map((number) => (
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

      <CrearUsuario
        open={open}
        handleOpen={handleOpen}
        fetchUsuarios={fetchUsuarios}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        editMode={editMode}
        roles={roles}
      />

      {/* Dialogo para ver detalles */}
      <Dialog open={detailsOpen} handler={handleDetailsOpen} className="max-w-xs w-11/12" size="xs">
        <DialogHeader className="font-bold text-gray-900">
          <Typography variant="h4">Detalles del Usuario</Typography>
        </DialogHeader>
        <DialogBody divider className="p-4">
          <div className="space-y-1">
            <Typography variant="subtitle2" className="font-bold text-gray-800">Nombre:</Typography>
            <Typography className="text-sm">{selectedUser.nombre || 'N/A'}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Email:</Typography>
            <Typography className="text-sm">{selectedUser.email || 'N/A'}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Rol:</Typography>
            <Typography className="text-sm">{roles.find(role => role.id_rol === selectedUser.id_rol)?.nombre || 'N/A'}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Tipo Documento:</Typography>
            <Typography className="text-sm">{selectedUser.tipo_documento || 'N/A'}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Número Documento:</Typography>
            <Typography className="text-sm">{selectedUser.numero_documento || 'N/A'}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Género:</Typography>
            <Typography className="text-sm">{selectedUser.genero || 'N/A'}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Teléfono:</Typography>
            <Typography className="text-sm">{selectedUser.telefono || 'N/A'}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Dirección:</Typography>
            <Typography className="text-sm">{selectedUser.direccion || 'N/A'}</Typography>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button className="btncancelarm" size="sm" onClick={handleDetailsOpen}>
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}

export default Usuarios;