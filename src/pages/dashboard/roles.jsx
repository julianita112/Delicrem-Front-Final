import {
  Card,
  CardBody,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  IconButton,
  Checkbox,
  Switch, // Importar Switch para el campo estado
} from "@material-tailwind/react";
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

export function Roles() {
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState({
    nombre: "",
    permisosRol: [],
    estado: true, // Inicializar el campo estado por defecto
  });
  const [permisos, setPermisos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [rolesPerPage] = useState(6);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({ nombre: "", permisos: "" });

  useEffect(() => {
    fetchRoles();
    fetchPermisos();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/roles");
      setRoles(response.data);
      setFilteredRoles(response.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const fetchPermisos = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/permisos");
      setPermisos(response.data);
    } catch (error) {
      console.error("Error fetching permisos:", error);
    }
  };

  useEffect(() => {
    filterRoles();
  }, [search, roles]);

  const filterRoles = () => {
    const filtered = roles.filter((role) =>
      role.nombre.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredRoles(filtered);
  };

  const handleOpen = () => {
    setOpen(!open);
  
    if (!open) { 
      setErrors({ nombre: "", permisos: "" });
    }
  };
  
  const handleDetailsOpen = () => setDetailsOpen(!detailsOpen);
  const handleEdit = (role) => {
    setSelectedRole({
      ...role,
      permisosRol: role.permisosRol ? role.permisosRol.map(p => p.id_permiso) : [],
      estado: role.estado,
    });
    setEditMode(true);
    handleOpen();
  };

  const handleCreate = () => {
    setSelectedRole({
      nombre: "",
      permisosRol: [],
      estado: true, 
    });
    setEditMode(false);
    handleOpen();
  };

  const handleDelete = async (role) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Estás seguro de que deseas eliminar el rol ${role.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`https://finalbackenddelicrem2.onrender.com/api/roles/${role.id_rol}`);
        fetchRoles(); 
        Toast.fire({
          icon: "Rol Eliminado",
          title: "El Rol ha sido eliminado exitosamente."
        });
      } catch (error) {
        console.error("Error deleting role:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'No se puede eliminar un rol ya que este se encuentra asociado a un usuario y/o tiene permisos asignados.',
          confirmButtonText: 'Aceptar',
          background: '#ffff',
          iconColor: '#A62A64 ',
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

  const validateForm = () => {
    let valid = true;
    const newErrors = { nombre: "", permisos: "" };
  
    if (!selectedRole.nombre.trim()) {
      newErrors.nombre = "Por favor ingrese un nombre para el rol.";
      valid = false;
    } else if (selectedRole.nombre.length < 4) {
      newErrors.nombre = "El nombre del rol debe tener al menos 4 caracteres.";
      valid = false;
    } else if (selectedRole.nombre.length > 25) {
      newErrors.nombre = "El nombre del rol no debe exceder los 25 caracteres.";
      valid = false;
    } else if (
      roles.some(
        (role) =>
          role.nombre.toLowerCase() === selectedRole.nombre.trim().toLowerCase() &&
          role.id_rol !== selectedRole.id_rol
      )
    ) {
      newErrors.nombre = "Ya existe un rol con este nombre.";
      valid = false;
    }
  
    if (selectedRole.permisosRol.length === 0) {
      newErrors.permisos = "Debe seleccionar al menos un permiso.";
      valid = false;
    }
  
    setErrors(newErrors);
    return valid;
  };
  
  const handleSave = async () => {
    const isValid = validateForm();
    if (!isValid) {
      Toast.fire({
        icon: "error",
        title: "Por favor, completa todos los campos correctamente.",
      });
      return; // Salir si la validación falla
    }

    if (!validateForm()) return;
    try {
      if (editMode) {
        await axios.put(`https://finalbackenddelicrem2.onrender.com/api/roles/${selectedRole.id_rol}`, {
          nombre: selectedRole.nombre,
          permisos: selectedRole.permisosRol,
          estado: selectedRole.estado,
        });
        Toast.fire({
          icon: "success",
          title: "El Rol ha sido actualizado correctamente."
        });
      } else {
        await axios.post("https://finalbackenddelicrem2.onrender.com/api/roles", {
          nombre: selectedRole.nombre,
          permisos: selectedRole.permisosRol,
          estado: selectedRole.estado,
        });
        Toast.fire({
          icon: "success",
          title: "¡Creación exitosa! El Rol creado exitosamente."
        });
      }
      fetchRoles(); 
      handleOpen();
    } catch (error) {
      console.error("Error saving role:", error);
      Swal.fire('Error', 'Hubo un problema al guardar el rol.', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedRole({ ...selectedRole, [name]: value });
  
    if (name === 'nombre') {
      const newErrors = { ...errors };
  
      if (!value.trim()) {
        newErrors.nombre = "Por favor ingrese un nombre para el rol.";
      } else if (value.length < 4) {
        newErrors.nombre = "El nombre del rol debe tener al menos 4 caracteres.";
      } else if (value.length > 25) {
        newErrors.nombre = "El nombre del rol no debe exceder los 25 caracteres.";
      } else if (
        roles.some(
          (role) =>
            role.nombre.toLowerCase() === value.trim().toLowerCase() &&
            role.id_rol !== selectedRole.id_rol 
        )
      ) {
        newErrors.nombre = "Ya existe un rol con este nombre.";
      } else {
        newErrors.nombre = ""; 
      }
  
      setErrors(newErrors);
    }
  };
  
  const handlePermissionChange = (permisoId) => {
    let updatedPermissions;
  
    if (selectedRole.permisosRol.includes(permisoId)) {
      updatedPermissions = selectedRole.permisosRol.filter(id => id !== permisoId);
    } else {
      updatedPermissions = [...selectedRole.permisosRol, permisoId];
    }
  
    setSelectedRole({
      ...selectedRole,
      permisosRol: updatedPermissions,
    });
  
    // Validar en tiempo real y eliminar el error si hay al menos un permiso seleccionado
    if (updatedPermissions.length > 0) {
      setErrors((prevErrors) => ({ ...prevErrors, permisos: '' }));
    }
  };
  
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleViewDetails = (role) => {
    setSelectedRole({
      ...role,
      permisosRol: role.permisosRol ? role.permisosRol : [],
    });
    handleDetailsOpen();
  };

  const toggleActivo = async (id_rol, estado) => {
    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${estado ? 'desactivar' : 'activar'} el rol?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#A62A64',
      cancelButtonColor: '#000000',
      confirmButtonText: `Sí, ${estado ? 'desactivar' : 'activar'}`,
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
        if (estado) { 
          const response = await axios.get(`https://finalbackenddelicrem2.onrender.com/api/usuarios`);
          const usuariosConRol = response.data.filter(usuario => usuario.id_rol === id_rol);
  
          if (usuariosConRol.length > 0) {
            Swal.fire({
              icon: 'warning',
              title: 'No se puede desactivar el rol',
              text: `Hay ${usuariosConRol.length} usuario(s) con este rol asignado.`,
              confirmButtonColor: '#A62A64', 
              background: '#fff', 
              confirmButtonText: 'Aceptar' 
            });
            return;
          }
        }
  
        await axios.patch(`https://finalbackenddelicrem2.onrender.com/api/roles/${id_rol}/estado`, { estado: !estado });
        fetchRoles();
        Toast.fire({
          icon: 'success',
          title: `El rol ha sido ${!estado ? 'activado' : 'desactivado'} correctamente.`,
        });
      } catch (error) {
        console.error("Error al cambiar el estado del rol:", error);
        Toast.fire({
          icon: 'error',
          title: 'Hubo un problema al cambiar el estado del rol.',
        });
      }
    }
  };
  // Obtener roles actuales
  const indexOfLastRole = currentPage * rolesPerPage;
  const indexOfFirstRole = indexOfLastRole - rolesPerPage;
  const currentRoles = filteredRoles.slice(indexOfFirstRole, indexOfLastRole);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredRoles.length / rolesPerPage); i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
<div className="relative h-20 w-full overflow-hidden rounded-xl bg-cover bg-center">
  <div className="absolute inset-0 h-full w-full bg-white-800/75" />
</div>

<Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
  <CardBody className="p-4">
  <div className="flex items-center justify-between mb-6">
  <Button 
    onClick={handleCreate} 
    className="btnagregar"
    size="sm" 
    startIcon={<PlusIcon  />}
  >
    Crear Rol
  </Button>
  <input
  type="text"
  placeholder="Buscar por nombre de Rol..."
  value={search}
  onChange={handleSearchChange}
  className="ml-[28rem] border border-gray-300 rounded-md focus:border-blue-500 appearance-none shadow-none py-2 px-4 text-sm" // Ajusta el padding vertical y horizontal
  style={{ width: '250px' }} 
/>
</div>
          <div className="mb-1">
            <Typography variant="h5" color="blue-gray" className="mb-4">
              Lista de Roles
            </Typography>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {currentRoles.map((role) => (
                <Card key={role.id_rol} className="p-4">
                  <Typography variant="h6" color="blue-gray">
                    {role.nombre}
                  </Typography>
                  <Typography color="blue-gray">
                    Permisos: {(role.permisosRol ? role.permisosRol : []).map(p => p.nombre_permiso).join(', ')}
                  </Typography>                 
                  <div className="flex justify-between items-center mt-4 px-14"> 
                    <button
                    onClick={() => toggleActivo(role.id_rol, role.estado)}
                     className={`relative inline-flex items-center cursor-pointer transition-transform duration-300 ease-in-out h-6 w-12 rounded-full focus:outline-none ${
                        role.estado
                    ? 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg transform scale-105'
                    : 'bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg transform scale-105'
                         }`}
                    >
         <span
      className={`transition-transform duration-300 ease-in-out ${
        role.estado ? 'translate-x-6' : 'translate-x-1'
      } inline-block w-5 h-5 transform bg-white rounded-full shadow-md`}
    />
    <span
      className={`absolute left-1 flex items-center text-xs text-white font-semibold ${
        role.estado ? 'opacity-0' : 'opacity-100'
      }`}
    >      
    </span>
    <span
      className={`absolute right-1 flex items-center text-xs text-white font-semibold ${
        role.estado ? 'opacity-100' : 'opacity-0'
      }`}
        >     
          </span>
              </button>
                    <div className="flex gap-2">
                      <IconButton className="btnedit" size="sm" onClick={() => handleEdit(role)} disabled={!role.estado}>
                        <PencilIcon className="h-5 w-5" />
                      </IconButton>
                      <IconButton className="btnvisualizar" size="sm" onClick={() => handleViewDetails(role)} disabled={!role.estado}>
                        <EyeIcon className="h-5 w-5" />
                      </IconButton>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="mt-4">
              <ul className="flex justify-center items-center space-x-2">
                {pageNumbers.map((number) => (
                  <Button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`pagination ${number === currentPage ? 'active' : ''}`}
                    size="sm"
                  >
                    {number}
                  </Button>
                ))}
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      <Dialog open={open} handler={handleOpen} className="custom-modal  text-blue-gray-900 rounded-3xl">
        <DialogHeader className="text-2xl font-bold border-b border-gray-200 pb-4  text-blue-gray-900">{editMode ? "Editar Rol" : "Crear Rol"}</DialogHeader>
        <DialogBody divider className="overflow-auto max-h-[60vh]">
          <Input
            label="Nombre del rol"
            name="nombre"
            value={selectedRole.nombre}
            onChange={handleChange}
          
            className={`mb-2 ${errors.nombre ? 'border-red-800' : ''}`}
            required
          />
          {errors.nombre && <Typography color="red" className="text-sm">{errors.nombre}</Typography>}
          <Typography variant="h6" color="blue-gray" className="mt-4">
            Permisos
          </Typography>
          <div className="grid grid-cols-4 gap-2 max-h-[30vh] overflow-y-auto">
            
            {permisos.map((permiso) => (
              <Checkbox
                key={permiso.id_permiso}
                label={permiso.nombre_permiso}
                checked={selectedRole.permisosRol.includes(permiso.id_permiso)}
                onChange={() => handlePermissionChange(permiso.id_permiso)}
                disabled={selectedRole.nombre.toLowerCase() === 'administrador' && permiso.nombre_permiso.toLowerCase() === 'roles'}
              />
            ))}
          </div>
          
          {errors.permisos && <Typography color="red" className="text-sm">{errors.permisos}</Typography>}
        </DialogBody>
        <DialogFooter>
          <Button variant="text" className="btncancelarm" size="sm" onClick={handleOpen}>
            Cancelar
          </Button>
          <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleSave}>
            {editMode ? "Guardar Cambios" : "Crear Rol"}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog
  open={detailsOpen}
  handler={handleDetailsOpen}
  className="max-w-xs w-11/12 bg-white rounded-lg shadow-lg p-4"
  size="xs"
>
  <DialogHeader className="text-2xl font-semibold text-center  text-blue-gray-900 border-b-2 pb-2">
    Detalles del Rol
  </DialogHeader>
  <DialogBody divider className="mt-2 space-y-4">
    <div>
      <Typography variant="h6" color="blue-gray" className="mb-1 font-medium">
        Nombre:
      </Typography>
      <Typography className="text-gray-800">{selectedRole.nombre}</Typography>
    </div>
    <div>
      <Typography variant="h6" color="blue-gray" className="mt-4 mb-1 font-medium">
        Permisos:
      </Typography>
      <Typography className="text-gray-800">
        {(selectedRole.permisosRol || []).map((p) => p.nombre_permiso).join(', ')}
      </Typography>
    </div>
  </DialogBody>
  <DialogFooter className="flex justify-end pt-4 border-t-2">
    <Button
      variant="text"
      className="btncancelarm transition-colors"
      size="sm"
      onClick={handleDetailsOpen}
    >
      Cerrar
    </Button>
  </DialogFooter>
</Dialog>

    </>
  );
}