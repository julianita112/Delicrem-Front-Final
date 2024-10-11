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
} from "@material-tailwind/react";
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import { Textarea } from "@material-tailwind/react"; 
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

export function CategoriaInsumos() {
  const [categorias, setCategorias] = useState([]);
  const [filteredCategorias, setFilteredCategorias] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState({
    nombre: "",
    descripcion: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [categoriasPerPage] = useState(6);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/categorias_insumo");
      setCategorias(response.data);
      setFilteredCategorias(response.data);
    } catch (error) {
      console.error("Error fetching categorias:", error);
    }
  };

  useEffect(() => {
    filterCategorias();
  }, [search, categorias]);

  const filterCategorias = () => {
    const filtered = categorias.filter((categoria) =>
      categoria.nombre.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCategorias(filtered);
  };

  const handleOpen = () => {
    setOpen(!open);
    setErrors({});
  };

  const handleDetailsOpen = () => {
    setDetailsOpen(!detailsOpen);
  };

  const handleEdit = (categoria) => {
    setSelectedCategoria(categoria);
    setEditMode(true);
    setOpen(true);
  };

  const handleCreate = () => {
    setSelectedCategoria({
      nombre: "",
      descripcion: "",
    });
    setEditMode(false);
    setOpen(true);
  };

  const handleDelete = async (categoria) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Estás seguro de que deseas eliminar la categoría ${categoria.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/api/categorias_insumo/${categoria.id_categoria}`);
        fetchCategorias();
        
        Toast.fire({
          icon: "success",
          title: "¡Eliminado! La Categoría de Insumos ha sido eliminada.",
        });
    
      } catch (error) {
        console.error("Error deleting categoria:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'Esta categoría de insumos no se puede eliminar ya que se encuentra asociada a una compra y/o a un insumo.',
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
  }
    
  const validateForm = () => {
    let valid = true;
    const newErrors = {};
    const regexNombre = /^[a-zA-ZáéíóúüÁÉÍÓÚÜ\s]+$/; 
    const regexDescripcion = /^.{2,50}$/; 


 // Validación de nombre duplicado
 // Validación de nombre duplicado
 const isDuplicate = categorias.some((categoria) =>
  categoria.nombre.toLowerCase() === selectedCategoria.nombre.trim().toLowerCase() &&
  categoria.id_categoria !== selectedCategoria.id_categoria // Verifica que no sea la misma categoría
);

    if (!selectedCategoria.nombre.trim()) {
      newErrors.nombre = "Por favor, ingrese el nombre de la categoría de insumos.";
    } else if (selectedCategoria.nombre.length < 4) {
      newErrors.nombre = "El nombre debe tener al menos 4 caracteres.";
    } else if (selectedCategoria.nombre.length > 15) {
      newErrors.nombre = "El nombre no puede tener más de 15 caracteres.";
    } else if (!regexNombre.test(selectedCategoria.nombre)) {
      newErrors.nombre = "El nombre solo puede contener letras y espacios.";
    } else if (isDuplicate) { // Si es duplicado y no está en modo edición
      newErrors.nombre = "Ya existe una categoría con este nombre.";
    }

    if (!selectedCategoria.descripcion.trim()) {
      newErrors.descripcion = "Por favor, ingrese la descripción de la categoría.";
    } else if (!regexDescripcion.test(selectedCategoria.descripcion)) {
      newErrors.descripcion = "La descripción debe tener entre 2 y 50 caracteres.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; 
    valid = false; 
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

      if (!validateForm()) return; // Verifica si hay errores antes de guardar
    try {
      if (editMode) {
        await axios.put(`http://localhost:3000/api/categorias_insumo/${selectedCategoria.id_categoria}`, selectedCategoria);
        setOpen(false);
        fetchCategorias();
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
        Toast.fire({
          icon: "success",
          title: "La Categoría de Insumos ha sido actualizada correctamente."
        });
      } else {
        await axios.post("http://localhost:3000/api/categorias_insumo", selectedCategoria);
        fetchCategorias();
        setOpen(false);
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
        Toast.fire({
          icon: "success",
          title: "¡Creación exitosa! Categoría creada exitosamente"
        });
      }
    } catch (error) {
      console.error("Error saving categoria:", error);
      Swal.fire('Error', 'Hubo un problema al guardar la categoría.', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedCategoria({ ...selectedCategoria, [name]: value });
    // Validaciones en tiempo real
    validateForm(); // Llama a la función de validación al cambiar el campo
  };
  
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleViewDetails = (categoria) => {
    setSelectedCategoria(categoria);
    setDetailsOpen(true);
  };

  const handleToggleEstado = async (categoria) => {
    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${categoria.estado ? 'desactivar' : 'activar'} la categoría ${categoria.nombre}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#A62A64',
      cancelButtonColor: '#000000',
      confirmButtonText: `Sí, ${categoria.estado ? 'desactivar' : 'activar'}`,
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
        if (categoria.estado) { 
         
          const response = await axios.get(`http://localhost:3000/api/insumos?categoria_id=${categoria.id_categoria}`);
          const insumosAsociados = response.data;         
        }
        await axios.patch(`http://localhost:3000/api/categorias_insumo/${categoria.id_categoria}/estado`, { estado: !categoria.estado });
        fetchCategorias();
        Toast.fire({
          icon: 'success',
          title: `La categoría ha sido ${!categoria.estado ? 'activada' : 'desactivada'} correctamente.`,
       
        });
      } catch (error) {
        console.error("Error al cambiar el estado de la categoría:", error);
        Swal.fire({
          icon: 'error',
          title: 'Hubo un problema al cambiar el estado de la categoría.',
          confirmButtonColor: '#A62A64',
          background: '#fff',
          confirmButtonText: 'Aceptar'
        });
      }
    }
  };

  const indexOfLastCategoria = currentPage * categoriasPerPage;
  const indexOfFirstCategoria = indexOfLastCategoria - categoriasPerPage;
  const currentCategorias = filteredCategorias.slice(indexOfFirstCategoria, indexOfLastCategoria);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredCategorias.length / categoriasPerPage); i++) {
    pageNumbers.push(i);
  }

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
    className="btnagregar w-40" 
    size="sm" 
   
    startIcon={<PlusIcon className="h-20 w-4" />} 
    style={{ width: '200px' }}  
  >
    Crear Categoría
  </Button>
  <input
  type="text"
  placeholder="Buscar por nombre de Categoría..."
  value={search}
  onChange={handleSearchChange}
  className="ml-[28rem] border border-gray-300 rounded-md focus:border-blue-500 appearance-none shadow-none py-2 px-4 text-sm" // Ajusta el padding vertical y horizontal
  style={{ width: '265px' }}
/>
</div>         
          <div className="mb-1">
            <Typography variant="h5" color="blue-gray" className="mb-4">
              Lista de Categorías de Insumo
            </Typography>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-20 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción Categoría
                    </th>
                    <th scope="col" className="px-8 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-12 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentCategorias.map((categoria) => (
                    <tr key={categoria.id_categoria}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{categoria.nombre}</td>
                      <td className="px-20 py-4 whitespace-nowrap text-sm text-gray-500">{categoria.descripcion}</td>
                      <td className="px-10 py-4 whitespace-nowrap text-sm text-gray-500">
    <label className="inline-flex relative items-center cursor-pointer">
        <input
            type="checkbox"
            className="sr-only peer"
            checked={categoria.estado}
            onChange={() => handleToggleEstado(categoria)}
        />
        <div
            className={`relative inline-flex items-center cursor-pointer transition-transform duration-300 ease-in-out h-6 w-12 rounded-full focus:outline-none ${
                categoria.estado
                    ? 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg transform scale-105'
                    : 'bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg transform scale-105'
            }`}
        >
            <span
                className={`transition-transform duration-300 ease-in-out ${
                    categoria.estado ? 'translate-x-6' : 'translate-x-1'
                } inline-block w-5 h-5 transform bg-white rounded-full shadow-md`}
            />
        </div>
        <span
            className={`absolute left-1 flex items-center text-xs text-white font-semibold ${
                categoria.estado ? 'opacity-0' : 'opacity-100'
            }`}
        >
            
        </span>
        <span
            className={`absolute right-1 flex items-center text-xs text-white font-semibold ${
                categoria.estado ? 'opacity-100' : 'opacity-0'
            }`}
        >
            
        </span>
    </label>
</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <IconButton
                            className="btnedit"
                            size="sm"
                            onClick={() => handleEdit(categoria)}
                            disabled={!categoria.estado}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            className="btncancelarinsumo"
                            size="sm"
                            onClick={() => handleDelete(categoria)}
                            disabled={!categoria.estado}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            className="btnvisualizar"
                            size="sm"
                            onClick={() => handleViewDetails(categoria)}
                            disabled={!categoria.estado}
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
            <div className="mt-4">
              <ul className="flex justify-center items-center space-x-2">
                {pageNumbers.map((number) => (
                  <Button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`pagination ${number === currentPage ? "active" : ""}`}
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
      
      <Dialog
  open={open}
  handler={handleOpen}
  className="max-w-md w-10/12 p-6 bg-white rounded-3xl shadow-xl"
  size="xs"
>
  <DialogHeader className="text-2xl font-semibold  text-blue-gray-900">
    {editMode ? "Editar Categoría de Insumos" : "Crear Categoría de Insumos"}
  </DialogHeader>
  <DialogBody divider className="space-y-4">
    <div className="space-y-3">
      <Input
        label="Nombre de la Categoría de Insumos"
        name="nombre"
        value={selectedCategoria.nombre}
        onChange={handleChange}
     required 
        className="w-full"
      />
      {errors.nombre && <Typography color="red" className="text-sm">{errors.nombre}</Typography>}
      <Textarea
        label="Breve descripción de la Categoría"
        name="descripcion"
        value={selectedCategoria.descripcion}
        onChange={handleChange}
        required
        className="w-full"
        rows="4"
      />
      {errors.descripcion && <Typography color="red" className="text-sm">{errors.descripcion}</Typography>}
    </div>
  </DialogBody>
  <DialogFooter className="flex justify-end gap-3">
    <Button variant="text" className="btncancelarm" size="sm" onClick={handleOpen}> 
      Cancelar
    </Button>
    <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleSave}>
      {editMode ? "Guardar Cambios" : "Crear Categoría"}
    </Button>
  </DialogFooter>
</Dialog>


      <Dialog open={detailsOpen} handler={handleDetailsOpen} className="max-w-xs w-11/12" size="xs">
        <DialogHeader className="font-bold text-gray-900">
          Detalles de la Categoría de Insumos
        </DialogHeader>
        <DialogBody>
          <div className="space-y-2">
            <Typography variant="subtitle2" className="font-bold text-gray-800">Nombre:</Typography>
            <Typography className="text-sm">{selectedCategoria.nombre}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Descripción:</Typography>
            <Typography className="text-sm">{selectedCategoria.descripcion}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Creado:</Typography>
            <Typography className="text-sm">{selectedCategoria.createdAt ? new Date(selectedCategoria.createdAt).toLocaleString() : 'N/A'}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Actualizado:</Typography>
            <Typography className="text-sm">{selectedCategoria.updatedAt ? new Date(selectedCategoria.updatedAt).toLocaleString() : 'N/A'}</Typography>
            {selectedCategoria.insumos && (
              <>
                <Typography variant="subtitle2" className="font-bold text-gray-800">Insumos:</Typography>
                {selectedCategoria.insumos.map((insumo) => (
                  <Typography key={insumo.id_insumo} className="text-sm">
                    {insumo.nombre} (Stock: {insumo.stock_actual})
                  </Typography>
                ))}
              </>
            )}
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