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
import { Producir } from "./Producir"; // Importar el nuevo componente

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

export function ProductoTerminado() {
  const [productos, setProductos] = useState([]);
  const [productosActivos, setProductosActivos] = useState([]);
  const [filteredProductos, setFilteredProductos] = useState([]);
  const [open, setOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedProducto, setSelectedProducto] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [productosPerPage] = useState(5);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProductos();
    fetchProductosActivos();
  }, []);

  const fetchProductos = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/productos");
      setProductos(response.data);
      setFilteredProductos(response.data);
    } catch (error) {
      console.error("Error fetching productos:", error);
    }
  };

  const fetchProductosActivos = async () => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/productos/activos");
      setProductosActivos(response.data);
    } catch (error) {
      console.error("Error fetching productos activos:", error);
    }
  };

  useEffect(() => {
    filterProductos();
  }, [search, productos]);

  const filterProductos = () => {
    const filtered = productos.filter((producto) =>
      producto.nombre.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProductos(filtered);
  };

  const handleOpen = () => setOpen(!open);
  const handleProductionOpen = () => setProductionOpen(!productionOpen);
  const handleDetailsOpen = () => setDetailsOpen(!detailsOpen);

  const handleEdit = (producto) => {
    setSelectedProducto(producto);
    setEditMode(true);
    handleOpen();
  };

  const handleCreate = () => {
    setSelectedProducto({
      nombre: "",
      descripcion: "",
      precio: "",
    });
    setEditMode(false);
    setErrors({});
    handleOpen();
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
        await axios.put(`https://finalbackenddelicrem2.onrender.com/api/productos/${selectedProducto.id_producto}`, selectedProducto);
        Toast.fire({
          icon: 'success',
          title: 'El producto ha sido actualizado correctamente.'
        });
      } else {
        await axios.post("https://finalbackenddelicrem2.onrender.com/api/productos", selectedProducto);
        Toast.fire({
          icon: 'success',
          title: '¡Creación exitosa! El producto ha sido creado correctamente.'
        });
      }
      fetchProductos();
      handleOpen();
    } catch (error) {
      console.error("Error saving producto:", error);
      Toast.fire({
        icon: 'error',
        title: 'Hubo un problema al guardar el producto.'
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let valid = true;

    // Validación del nombre del producto
    if (!selectedProducto.nombre) {
        newErrors.nombre = "El nombre es requerido";
        valid = false; // Asegúrate de establecer valid en false
    } else if (selectedProducto.nombre.length < 2 || selectedProducto.nombre.length > 15) {
        newErrors.nombre = "El nombre debe tener entre 2 y 15 caracteres"; // Corregido a 2
        valid = false; // Asegúrate de establecer valid en false
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(selectedProducto.nombre)) {
        newErrors.nombre = "El nombre solo puede contener letras, tildes y espacios";
        valid = false; // Asegúrate de establecer valid en false
    } 

    // Validación de duplicados
    const normalizedNombre = selectedProducto.nombre.trim().toLowerCase();
    if (
        normalizedNombre.length > 0 && // Asegúrate de que haya un nombre antes de validar duplicados
        productos.some((producto) => {
            console.log(
                `Comparando: "${producto.nombre.toLowerCase()}" con "${normalizedNombre}"`
            ); // Para depuración
            return (
                producto.nombre.toLowerCase() === normalizedNombre &&
                producto.id_producto !== selectedProducto.id_producto
            );
        })
    ) {
        newErrors.nombre = "Ya existe un producto con este nombre.";
        valid = false; // Establece valid en false si hay un duplicado
    }

    // Validación de la descripción
    if (!selectedProducto.descripcion) {
        newErrors.descripcion = "La descripción es requerida";
    } else if (selectedProducto.descripcion.length < 5 || selectedProducto.descripcion.length > 25) {
        newErrors.descripcion = "La descripción debe tener entre 5 y 25 caracteres";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(selectedProducto.descripcion)) {
        newErrors.descripcion = "La descripción solo puede contener letras, tildes y espacios";
    }

    // Validación del precio
    if (!selectedProducto.precio) {
        newErrors.precio = "El precio es requerido";
    } else if (selectedProducto.precio.length < 3 || selectedProducto.precio.length > 4) { 
        newErrors.precio = "El precio debe contener entre 3 y 5 dígitos"; 
    } else if (!/^\d+$/.test(selectedProducto.precio)) {
        newErrors.precio = "El precio solo puede contener números";
    } else if (selectedProducto.precio === "0" || selectedProducto.precio === "0000") {
        newErrors.precio = "El precio no puede ser 0 o 0000";
    }

    setErrors(newErrors);
    return valid;
};


  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedProducto({ ...selectedProducto, [name]: value });
    validateForm(); // Llamar a la validación en tiempo real
  };

  const handleDelete = async (producto) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Estás seguro de que deseas eliminar el producto ${producto.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: "#000000",
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`https://finalbackenddelicrem2.onrender.com/api/productos/${producto.id_producto}`);
        fetchProductos();
        Toast.fire({
          icon: 'success',
          title: 'El producto ha sido eliminado correctamente.'
        });
        fetchProductosActivos();
      } catch (error) {
        console.error("Error deleting producto:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'El producto no se puede eliminar ya que se encuentra asociado a una venta y/o a una orden de producción.',
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

  const handleViewDetails = (producto) => {
    setSelectedProducto(producto);
    handleDetailsOpen();
  };

  const toggleActivo = async (id_producto, estado) => {
    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${estado ? 'desactivar' : 'activar'} el producto?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#A62A64',
      cancelButtonColor: '#000000',
      confirmButtonText: `Sí, ${estado ? 'desactivar' : 'activar'}`,
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
        // Verificar si hay productos asignados a una orden de producción
        const ordenesResponse = await axios.get(`https://finalbackenddelicrem2.onrender.com/api/ordenesProduccion`);
        const productosConOrden = ordenesResponse.data.filter(orden => orden.id_producto === id_producto);
        // Verificar si hay productos asignados a una venta
        const ventasResponse = await axios.get(`https://finalbackenddelicrem2.onrender.com/api/ventas`);
        const productosConVenta = ventasResponse.data.filter(venta => venta.id_producto === id_producto);
  
        if (productosConOrden.length > 0 || productosConVenta.length > 0) {
          Swal.fire({
            icon: 'warning',
            title: 'No se puede desactivar el producto',
            text: `Hay ${productosConOrden.length} orden(es) de producción y ${productosConVenta.length} venta(s) con este producto asignado.`,
            confirmButtonColor: '#A62A64',
            background: '#fff',
            confirmButtonText: 'Aceptar'
          });
          return;
        }
  
        await axios.patch(`https://finalbackenddelicrem2.onrender.com/api/productos/${id_producto}/estado`, { estado: !estado });
        fetchProductos();
        fetchProductosActivos();
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
          icon: 'success',
          title: `El producto ha sido ${!estado ? 'activado' : 'desactivado'} correctamente.`,
        });
      } catch (error) {
        console.error("Error al cambiar el estado del producto:", error);
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
          icon: 'error',
          title: 'Hubo un problema al cambiar el estado del producto.',
        });
      }
    }
  };
  
  const indexOfLastProducto = currentPage * productosPerPage;
  const indexOfFirstProducto = indexOfLastProducto - productosPerPage;
  const currentProductos = filteredProductos.slice(indexOfFirstProducto, indexOfLastProducto);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredProductos.length / productosPerPage); i++) {
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
          <Button onClick={handleCreate} className="btnagregar" size="sm" startIcon={<PlusIcon />}>
            Crear Producto
          </Button>       
          <input
  type="text"
  placeholder="Buscar por nombre de Producto..."
  value={search}
  onChange={handleSearchChange}
  className="border border-gray-300 rounded-md focus:border-blue-500 appearance-none shadow-none py-2 px-4 text-sm"
  style={{ width: '265px', marginLeft: '400px' }} // Ajuste en el margen izquierdo
/>               
          <div className="mb-1">
            <Typography variant="h5" color="blue-gray" className="mb-4">
              Lista de Productos
            </Typography>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th scope="col" className="px-10 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Editar</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentProductos.map((producto) => (
                    <tr key={producto.id_producto}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{producto.nombre}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.descripcion}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.precio}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <label className="inline-flex relative items-center cursor-pointer">
  <input
    type="checkbox"
    className="sr-only peer"
    checked={producto.estado}
    onChange={() => toggleActivo(producto.id_producto, producto.estado)}
  />
  <div
    className={`relative inline-flex items-center h-6 w-12 rounded-full p-1 duration-300 ease-in-out ${
      producto.estado
        ? 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg'
        : 'bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg'
    }`}
  >
    <span
      className={`inline-block w-5 h-5 transform bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
        producto.estado ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </div>
</label>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-1">
                          <IconButton
                            className="btnedit"
                            size="sm"
                            color="blue"
                            onClick={() => handleEdit(producto)}
                            disabled={!producto.estado} // Disable edit button if product is inactive
                          >
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            className="cancelar"
                            size="sm"
                            color="red"
                            onClick={() => handleDelete(producto)}
                            disabled={!producto.estado} // Disable delete button if product is inactive
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            className="btnvisualizar"
                            size="sm"
                            onClick={() => handleViewDetails(producto)}
                             // Disable view details button if product is inactive
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

      <Dialog open={open} handler={handleOpen} 
      className="max-w-md w-10/12 p-6 bg-white rounded-3xl shadow-xl"
  size="xs"
       >
       <DialogHeader className="text-2xl font-semibold  text-blue-gray-900">
          {editMode ? "Editar Producto Terminado" : "Crear Producto"}
        </DialogHeader>
        <DialogBody divider className="space-y-4">
    <div className="space-y-3">
            <Input
              name="nombre"
              label="Nombre del Producto"
              required
              value={selectedProducto.nombre}
              onChange={(e) => {
                const newNombre = e.target.value;
                setSelectedProducto({ ...selectedProducto, nombre: newNombre });
                validateForm(); // Llama a la validación en cada cambio
            }}
              
              className="rounded-lg border-gray-300"
            />
            {errors.nombre && <Typography className="text-red-500 mt-1 text-sm">{errors.nombre}</Typography>}
          </div>
          <div>
  <Textarea
      label="Breve descripción del Producto"
    name="descripcion"
    value={selectedProducto.descripcion}
    required
    onChange={handleChange}
      className="w-full"
        rows="4"
  />
  {errors.descripcion && (
    <Typography className="text-red-500 mt-1 text-sm">{errors.descripcion}</Typography>
  )}
</div>
<div>
  <Input
    name="precio"
    label="Precio Unitario"
    type="number"
    value={selectedProducto.precio}
    onChange={(e) => {
      const value = e.target.value;
      if (value < 0) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          precio: "El precio no puede ser negativo",
        }));
      } else {
        // Limpia el error si el valor es válido
        setErrors((prevErrors) => ({
          ...prevErrors,
          precio: undefined,
        }));
      }
      handleChange(e);
    }}
    required
    min="0" // Establecer el mínimo a 0 para no permitir números negativos
    className="rounded-lg border-gray-300"
  />
  {errors.precio && <Typography className="text-red-500 mt-1 text-sm">{errors.precio}</Typography>}
</div>
        </DialogBody>
        <DialogFooter className="flex justify-end pt-4">
          <Button variant="text" className="btncancelarm" size="sm" onClick={handleOpen}>
            Cancelar
          </Button>
          <Button variant="gradient" className="btnagregarm" size="sm" color="green" onClick={handleSave}>
            {editMode ? "Guardar Cambios" : "Crear Producto"}
          </Button>
        </DialogFooter>
      </Dialog>

      <Producir
        open={productionOpen}
        handleProductionOpen={handleProductionOpen}
        productosActivos={productosActivos}
        fetchProductos={fetchProductos}
        fetchProductosActivos={fetchProductosActivos}
      />

      <Dialog open={detailsOpen} handler={handleDetailsOpen}className="max-w-xs w-11/12 bg-white rounded-lg shadow-lg" size="xs">
        <DialogHeader className="font-bold text-gray-900">Detalles del Producto</DialogHeader>
        <DialogBody divider>
          <table className="min-w-full">
            <tbody>
              <tr>
                <td className=" text-blue-gray-900 font-semibold">Nombre:</td>
                <td>{selectedProducto.nombre}</td>
              </tr>
              <tr>
                <td className="  text-blue-gray-900 font-semibold">Descripción:</td>
                <td>{selectedProducto.descripcion}</td>
              </tr>
              <tr>
                <td className=" text-blue-gray-900 font-semibold">Precio:</td>
                <td>{selectedProducto.precio}</td>
              </tr>
              <tr>
                <td className="  text-blue-gray-900 font-semibold">Stock:</td>
                <td>{selectedProducto.stock}</td>
              </tr>
              <tr>
                <td className=" text-blue-gray-900 font-semibold">Creado:</td>
                <td>{selectedProducto.createdAt ? new Date(selectedProducto.createdAt).toLocaleString() : "N/A"}</td>
              </tr>
              <tr>
                <td className=" text-blue-gray-900 font-semibold">Actualizado:</td>
                <td>{new Date(selectedProducto.updatedAt).toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </DialogBody>
        <DialogFooter>
          <Button variant="gradient"
           className="btncancelarm" size="sm" color="blue-gray" onClick={handleDetailsOpen}>
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}