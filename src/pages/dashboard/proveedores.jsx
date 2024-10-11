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
  Select,
  Option,
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
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});


export function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [filteredProveedores, setFilteredProveedores] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState({
    nombre: "",
    tipo_documento: "",
    numero_documento: "",
    contacto: "",
    asesor: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [proveedoresPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [formErrors, setFormErrors] = useState({
    nombre: '',
    tipo_documento: '',
    numero_documento: '',
    contacto: '',
    asesor: ''
  });

  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/proveedores");
      setProveedores(response.data);
      setFilteredProveedores(response.data);
    } catch (error) {
      console.error("Error fetching proveedores:", error);
      Toast.fire({
        icon: 'error',
        title: 'Error al cargar proveedores'
      });
    }
  };

  useEffect(() => {
    filterProveedores();
  }, [search, proveedores]);

  const filterProveedores = () => {
    const filtered = proveedores.filter((proveedor) =>
      proveedor.nombre.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProveedores(filtered);
  };

  const handleOpen = () => {
    setOpen(!open);
    setFormErrors({
      nombre: '',
      tipo_documento: '',
      numero_documento: '',
      contacto: '',
      asesor: ''
    });
  };

  const handleDetailsOpen = () => setDetailsOpen(!detailsOpen);

  const handleEdit = (proveedor) => {
    setSelectedProveedor(proveedor);
    setEditMode(true);
    handleOpen();
  };

  const handleCreate = () => {
    setSelectedProveedor({
      nombre: "",
      tipo_documento: "",
      numero_documento: "",
      contacto: "",
      asesor: "",
    });
    setEditMode(false);
    handleOpen();
  };

  const handleDelete = async (proveedor) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Estás seguro de que deseas eliminar al proveedor ${proveedor.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`https://finalbackenddelicrem2.onrender.com/api/proveedores/${proveedor.id_proveedor}`);
        fetchProveedores(); // Refrescar la lista de proveedores
        Toast.fire({
          icon: "success",
          title: "¡Eliminado! El proveedor ha sido eliminado.",
        });
      } catch (error) {
        console.error("Error deleting proveedor:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'No se puede eliminar el proveedor ya que se encuentra asociado a una compra.',
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


  const handleSave = async () => {
    const isValid = validateForm();
    if (!isValid) {
      Toast.fire({
        icon: "error",
        title: "Por favor, completa todos los campos correctamente.",
      });
      return; // Salir si la validación falla
    }
  
    if (validateForm()) {
      try {
        if (editMode) {
          await axios.put(`https://finalbackenddelicrem2.onrender.com/api/proveedores/${selectedProveedor.id_proveedor}`, selectedProveedor);
          Toast.fire({
            icon: 'success',
            title: 'El proveedor ha sido actualizado correctamente.'
          });
        } else {
          await axios.post("https://finalbackenddelicrem2.onrender.com/api/proveedores", selectedProveedor);
          Toast.fire({
            icon: 'success',
            title: '¡Creación exitosa! El Proveedor creado exitosamente.'
          });
        }
        fetchProveedores(); // Refrescar la lista de proveedores
        handleOpen();
      } catch (error) {
        console.error("Error saving proveedor:", error);
        Swal.fire('Error', 'Hubo un problema al guardar el proveedor.', 'error');
      }
    }
  };
  
  const validateForm = (currentData = selectedProveedor) => {
    let isValid = true;
    const errors = {};
  
    // Validar nombre del proveedor
    if (!currentData.nombre.trim()) {
      errors.nombre = 'El nombre del proveedor es requerido.';
      isValid = false;
  } else if (currentData.nombre.trim().length < 4) {
      errors.nombre = 'El nombre del proveedor debe contener al menos 4 letras.';
      isValid = false;
  } else if (currentData.nombre.trim().length > 20) {
      errors.nombre = 'El nombre del proveedor no puede tener más de 20 letras.';
      isValid = false;
  } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(currentData.nombre)) {
      errors.nombre = 'El nombre del proveedor solo puede contener letras y espacios.';
      isValid = false;
  } else {
      // Validación de duplicados
      const normalizedNombre = currentData.nombre.trim().toLowerCase();
      if (
          proveedores.some((proveedor) => {
              console.log(
                  `Comparando: "${proveedor.nombre.toLowerCase()}" con "${normalizedNombre}"`
              ); // Para depuración
              return (
                  proveedor.nombre.toLowerCase() === normalizedNombre &&
                  proveedor.id_proveedor !== currentData.id_proveedor // Asegúrate de tener un id para comparar
              );
          })
      ) {
          errors.nombre = 'Ya existe un proveedor con este nombre.';
          isValid = false;
      }
  }
  
  
    // Validar tipo de documento
    if (!currentData.tipo_documento.trim()) {
      errors.tipo_documento = 'El tipo de documento es requerido.';
      isValid = false;
    }
  
    // Validar número de documento
    if (!currentData.numero_documento.trim()) {
      errors.numero_documento = 'El número de documento es requerido.';
      isValid = false;
  } else if (!/^\d{7,10}$/.test(currentData.numero_documento)) {
      errors.numero_documento = 'El número de documento debe contener entre 7 y 10 dígitos numéricos.';
      isValid = false;
  } else {
      // Validación de duplicados
      const normalizedNumeroDocumento = currentData.numero_documento.trim();
      if (
          proveedores.some((proveedor) => {
              console.log(
                  `Comparando: "${proveedor.numero_documento}" con "${normalizedNumeroDocumento}"`
              ); // Para depuración
              return (
                  proveedor.numero_documento === normalizedNumeroDocumento &&
                  proveedor.id_proveedor !== currentData.id_proveedor // Asegúrate de tener un id para comparar
              );
          })
      ) {
          errors.numero_documento = 'Ya existe un proveedor con este número de documento.';
          isValid = false;
      }
  }
  
  
    // Validar número de contacto
    if (!currentData.contacto.trim()) {
      errors.contacto = 'El número de contacto es requerido.';
      isValid = false;
    } else if (!/^\d{6,12}$/.test(currentData.contacto)) {
      errors.contacto = 'El número de contacto debe contener entre 6 y 12 dígitos numéricos.';
      isValid = false;
    }
  
    // Validar nombre del asesor
    if (!currentData.asesor.trim()) {
      errors.asesor = 'El nombre del asesor es requerido.';
      isValid = false;
    } else if (currentData.asesor.trim().length < 4) {
      errors.asesor = 'El nombre del asesor debe contener al menos 4 letras.';
      isValid = false;
    } else if (currentData.asesor.trim().length > 20) {
      errors.asesor = 'El nombre del asesor no puede tener más de 20 letras.';
      isValid = false;
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(currentData.asesor)) {
      errors.asesor = 'El nombre del asesor solo puede contener letras y espacios.';
      isValid = false;
    }
  
    setFormErrors(errors);
    return isValid;
  };
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedProveedor({ ...selectedProveedor, [name]: value });
  
    // Limpiar errores de validación para el campo específico
    if (formErrors[name]) {
      const newErrors = { ...formErrors };
      delete newErrors[name];
      setFormErrors(newErrors);
    }
  
    // Llamar a la validación en tiempo real
    validateForm({ ...selectedProveedor, [name]: value });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleViewDetails = (proveedor) => {
    setSelectedProveedor(proveedor);
    handleDetailsOpen();
  };

  const toggleActivo = async (id_proveedor, estado) => {
    // Mostrar el diálogo de confirmación con SweetAlert
    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${estado ? 'desactivar' : 'activar'} el proveedor?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#A62A64',
      cancelButtonColor: '#000000',
      confirmButtonText: `Sí, ${estado ? 'desactivar' : 'activar'}`,
      cancelButtonText: 'Cancelar'
    });
  
    // Si el usuario confirma, proceder con la actualización del estado
    if (result.isConfirmed) {
      try {
        // Realizar la solicitud para cambiar el estado del proveedor
        await axios.patch(`https://finalbackenddelicrem2.onrender.com/api/proveedores/${id_proveedor}/estado`, { estado: !estado });
        fetchProveedores(); 
        Toast.fire({
          icon: 'success',
          title: `El proveedor ha sido ${!estado ? 'activado' : 'desactivado'} correctamente.`,
        });
      } catch (error) {
        console.error("Error al cambiar el estado del proveedor:", error);
        Toast.fire({
          icon: 'error',
          title: 'Hubo un problema al cambiar el estado del proveedor.',
        });
      }
    }
  };
  
  // Obtener proveedores actuales
  const indexOfLastProveedor = currentPage * proveedoresPerPage;
  const indexOfFirstProveedor = indexOfLastProveedor - proveedoresPerPage;
  const currentProveedores = filteredProveedores.slice(indexOfFirstProveedor, indexOfLastProveedor);

  // Array de números de página
  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredProveedores.length / proveedoresPerPage); i++) {
    pageNumbers.push(i);
  }

  // Cambiar de página
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
       <div className="relative h-20 w-full overflow-hidden rounded-xl bg-cover bg-center">
       <div className="absolute inset-0 h-full w-full bg-white-900/75" />
      </div>


      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
  <CardBody className="p-4">
  <div className="flex items-center justify-between mb-6">
  <Button 
    onClick={handleCreate} 
    className="btnagregar w-40" // Ajusta el ancho horizontal del botón
    size="sm" 
    startIcon={<PlusIcon className="h-20 w-4" />} 
    style={{ width: '200px' }}  // Ajusta el ancho aquí
  >
    Crear Proveedor
  </Button>
  <input
  type="text"
  placeholder="Buscar por nombre de Proveedor..."
  value={search}
  onChange={handleSearchChange}
  className="ml-[28rem] border border-gray-300 rounded-md focus:border-blue-500 appearance-none shadow-none py-2 px-4 text-sm" // Ajusta el padding vertical y horizontal
  style={{ width: '300px' }} // Ajusta el ancho del campo de búsqueda
/>
</div>
          <div className="mb-1">
            <Typography variant="h5" color="blue-gray" className="mb-4">
              Lista de Proveedores
            </Typography>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre del proveedor
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de Documento
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número de Documento
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Número de Contacto
                    </th>
                    <th scope="col" className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asesor
                    </th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentProveedores.map((proveedor) => (
                    <tr key={proveedor.id_proveedor}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        <div className="text-sm text-gray-900">{proveedor.nombre}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap  text-gray-900">
                        <div className="text-sm text-gray-900">{proveedor.tipo_documento}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        <div className="text-sm text-gray-900">{proveedor.numero_documento}</div>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap ">
                        <div className="text-sm text-gray-900">{proveedor.contacto}</div>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap ">
                        <div className="text-sm text-gray-900">{proveedor.asesor}</div>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
    <label className="inline-flex relative items-center cursor-pointer">
        <input
            type="checkbox"
            className="sr-only peer"
            checked={proveedor.estado}
            onChange={() => toggleActivo(proveedor.id_proveedor, proveedor.estado)}
        />
        <div
            className={`relative inline-flex items-center cursor-pointer transition-transform duration-300 ease-in-out h-6 w-12 rounded-full focus:outline-none ${
                proveedor.estado
                    ? 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg transform scale-105'
                    : 'bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg transform scale-105'
            }`}
        >
            <span
                className={`transition-transform duration-300 ease-in-out ${
                    proveedor.estado ? 'translate-x-6' : 'translate-x-1'
                } inline-block w-5 h-5 transform bg-white rounded-full shadow-md`}
            />
        </div>
        <span
            className={`absolute left-1 flex items-center text-xs text-white font-semibold ${
                proveedor.estado ? 'opacity-0' : 'opacity-100'
            }`}
        >
            
        </span>
        <span
            className={`absolute right-1 flex items-center text-xs text-white font-semibold ${
                proveedor.estado ? 'opacity-100' : 'opacity-0'
            }`}
        >
           
        </span>
    </label>
</td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-1">
                          <IconButton className="btnedit" size="sm" onClick={() => handleEdit(proveedor)} disabled={!proveedor.estado}>
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton className="cancelar" size="sm" onClick={() => handleDelete(proveedor)} disabled={!proveedor.estado}>
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton className="btnView" size="sm" onClick={() => handleViewDetails(proveedor)} >
                            <EyeIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* Modal para crear/editar proveedor */}
      <Dialog open={open} onClose={handleOpen} className="max-w-md w-11/12 p-6 bg-white rounded-3xl shadow-lg" size="xs">
  <DialogHeader className="text-2xl font-bold border-b border-gray-200 pb-4  text-blue-gray-900">
    {editMode ? "Editar Proveedor" : "Crear Proveedor"}
  </DialogHeader>

        <DialogBody>
          <div className="flex flex-col space-y-3">
            <Input
              type="text"
              name="nombre"
              value={selectedProveedor.nombre}
              onChange={handleChange}
              label="Nombre del proveedor"
              required
             
            />
            {formErrors.nombre && (
              <Typography color="red" className="text-sm">
                {formErrors.nombre}
              </Typography>
            )}
            <Select
  label="Tipo de Documento"
  name="tipo_documento"
  value={selectedProveedor.tipo_documento}
  onChange={(e) => {
    const value = e; // Suponiendo que `e` es el valor seleccionado
    setSelectedProveedor({ ...selectedProveedor, tipo_documento: value });
    
    // Limpiar el error de validación para tipo_documento
    if (formErrors.tipo_documento) {
      const newErrors = { ...formErrors };
      delete newErrors.tipo_documento;
      setFormErrors(newErrors);
    }
  }}
  required
>
  <Option value="CC">CC</Option>
  <Option value="NIT">NIT</Option>
  <Option value="PP">PP</Option>
  <Option value="CE">CE</Option>
</Select>
{formErrors.tipo_documento && (
  <Typography color="red" className="text-sm">
    {formErrors.tipo_documento}
  </Typography>


            )}
            <Input
              type="text"
              name="numero_documento"
              value={selectedProveedor.numero_documento}
              onChange={handleChange}
              label="Número de Documento"
              required
              
            />
            {formErrors.numero_documento && (
              <Typography color="red" className="text-sm">
                {formErrors.numero_documento}
              </Typography>
            )}
            <Input
              type="text"
              name="contacto"
              value={selectedProveedor.contacto}
              onChange={handleChange}
              label="Número de contacto"
              required
             
            />
            {formErrors.contacto && (
              <Typography color="red" className="text-sm">
                {formErrors.contacto}
              </Typography>
            )}
            <Input
              type="text"
              name="asesor"
              value={selectedProveedor.asesor}
              onChange={handleChange}
              label="Nombre del asesor"
              required
             
            />
            {formErrors.asesor && (
              <Typography color="red" className="text-sm">
                {formErrors.asesor}
              </Typography>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={handleOpen} className="btncancelarm" size="sm">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="btnagregarm" size="sm" color="green">
            {editMode ? "Guardar Cambios" : "Crear Proveedor"}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={detailsOpen} handler={handleDetailsOpen} className="max-w-xs w-11/12" size="xs">
        <DialogHeader className="font-bold text-gray-900">
        <Typography variant="h4" className="font-semibold">
            Detalles del Proveedor
        </Typography>
        </DialogHeader>
        <DialogBody divider className="overflow-auto max-h-[60vh] p-4 bg-white">
          <div className="space-y-1">
            <Typography variant="subtitle2" className="font-bold text-gray-800">Nombre:</Typography>
            <Typography className="text-sm">{selectedProveedor.nombre}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Tipo de Documento:</Typography>
            <Typography className="text-sm">{selectedProveedor.tipo_documento}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Número de Documento:</Typography>
            <Typography className="text-sm">{selectedProveedor.numero_documento}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Contacto:</Typography>
            <Typography className="text-sm">{selectedProveedor.contacto}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Asesor:</Typography>
            <Typography className="text-sm">{selectedProveedor.asesor}</Typography>
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