import {
  DialogBody,
  DialogFooter,
  Typography,
  Textarea,
  Button,
  IconButton,
} from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "../../utils/axiosConfig";

export function CrearFichaTecnica({ handleClose, fetchFichas, productos, insumos, fichas }) {
  const [selectedFicha, setSelectedFicha] = useState({
    id_producto: "",
    descripcion: "",
    insumos: "",
    detallesFichaTecnicat: [{ id_insumo: "", cantidad: "" }],
  });
  const [errors, setErrors] = useState({});
  const [fichaSeleccionada, setFichaSeleccionada] = useState("");

  useEffect(() => {
    if (fichaSeleccionada) {
      const ficha = fichas.find(f => f.id_ficha === parseInt(fichaSeleccionada));
      if (ficha) {
        setSelectedFicha({
          id_producto: ficha.id_producto,
          descripcion: ficha.descripcion,
          insumos: ficha.insumos,
          detallesFichaTecnicat: ficha.detallesFichaTecnicat.map(detalle => ({
            id_insumo: detalle.id_insumo,
            cantidad: detalle.cantidad
          })),
        });
        setErrors({});
      }
    }
  }, [fichaSeleccionada, fichas]);

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
  
  const handleFichaChange = (e) => {
    setFichaSeleccionada(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedFicha({ ...selectedFicha, [name]: value });
    validateField(name, value); // Validar en tiempo real
 }; 

 const handleDetalleChange = (index, e) => {
  const { name, value } = e.target;
  const detalles = [...selectedFicha.detallesFichaTecnicat];
  detalles[index][name] = value;
  setSelectedFicha({ ...selectedFicha, detallesFichaTecnicat: detalles });
  validateField(`${name}_${index}`, value); // Validar en tiempo real
};


const validateField = (name, value) => {
  const newErrors = { ...errors };

  // Validaciones para los campos de producto, descripción e insumos
  if (name === "id_producto") {
    if (!value) {
      newErrors.id_producto = "El producto es requerido";
    } else {
      delete newErrors.id_producto; // Eliminar el error si es válido
    }
  } else if (name === "descripcion") {
    // Validación para descripción
    if (!value) {
      newErrors.descripcion = "La descripción es requerida";
    } else if (value.length < 5) {
      newErrors.descripcion = "La descripción debe tener al menos 5 caracteres.";
    } else if (value.length > 25) {
      newErrors.descripcion = "La descripción no puede tener más de 25 caracteres.";
    } else if (/[^a-zA-Z0-9\s]/.test(value)) {
      newErrors.descripcion = "La descripción no puede contener caracteres especiales.";
    } else {
      delete newErrors.descripcion; // Eliminar el error si es válido
    }
  } else if (name === "insumos") {
    // Validación para insumos
    if (!value) {
      newErrors.insumos = "Los insumos son requeridos";
    } else if (value.length < 5) {
      newErrors.insumos = "Los insumos deben tener al menos 5 caracteres.";
    } else if (value.length > 25) {
      newErrors.insumos = "Los insumos no pueden tener más de 25 caracteres.";
    } else if (/[^a-zA-Z0-9\s]/.test(value)) {
      newErrors.insumos = "Los insumos no pueden contener caracteres especiales.";
    } else {
      delete newErrors.insumos; // Eliminar el error si es válido
    }
  }

  // Validación para los detalles de insumos
  if (name.startsWith("id_insumo_")) {
    const index = name.split("_")[2];
    if (!value) {
      newErrors[`id_insumo_${index}`] = "El insumo es requerido";
    } else {
      delete newErrors[`id_insumo_${index}`]; // Eliminar el error si es válido
    }
  } else if (name.startsWith("cantidad_")) {
    const index = name.split("_")[1];
    if (!value) {
        newErrors[`cantidad_${index}`] = "La cantidad es requerida";
    } else if (value === "0") {
        newErrors[`cantidad_${index}`] = "La cantidad no puede ser 0.";
    } else if (value < 1) {
        newErrors[`cantidad_${index}`] = "La cantidad debe ser al menos 1.";
    } else {
        delete newErrors[`cantidad_${index}`]; // Eliminar el error si es válido
    }
}


  // Validar duplicados de insumos
  if (hasDuplicateInsumos()) {
    newErrors.general = "No se pueden tener insumos duplicados.";
  } else {
    delete newErrors.general; // Eliminar el error si no hay duplicados
  }

  setErrors(newErrors); // Actualizar los errores
  return Object.keys(newErrors).length === 0; // Retornar si no hay errores
};


  const hasDuplicateInsumos = () => {
    const insumosIds = selectedFicha.detallesFichaTecnicat.map(detalle => detalle.id_insumo);
    return insumosIds.some((id, index) => insumosIds.indexOf(id) !== index);
  };

  const handleAddDetalle = () => {
    // Verificar si hay campos vacíos
    const hasEmptyFields = selectedFicha.detallesFichaTecnicat.some(detalle => 
      !detalle.id_insumo || !detalle.cantidad
    );
  
    if (hasEmptyFields) {
      Toast.fire({
        icon: 'error',
        title: 'Por favor, completa todos los campos antes de agregar un nuevo insumo.'
      });
      return;
    }
  
    if (hasDuplicateInsumos()) {
      Toast.fire({
        icon: 'error',
        title: 'No se pueden agregar insumos duplicados.'
      });
      return;
    }
  
    setSelectedFicha({
      ...selectedFicha,
      detallesFichaTecnicat: [...selectedFicha.detallesFichaTecnicat, { id_insumo: "", cantidad: "" }]
    });
  };
  
  const handleRemoveDetalle = (index) => {
    const updatedDetalles = [...selectedFicha.detallesFichaTecnicat];
    updatedDetalles.splice(index, 1); // Elimina el detalle en el índice dado
    setSelectedFicha({
      ...selectedFicha,
      detallesFichaTecnicat: updatedDetalles
    });
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!selectedFicha.id_producto) newErrors.id_producto = "El producto es requerido";
    if (!selectedFicha.descripcion) newErrors.descripcion = "La descripción es requerida";
    if (!selectedFicha.insumos) newErrors.insumos = "Los insumos son requeridos";

    selectedFicha.detallesFichaTecnicat.forEach((detalle, index) => {
      if (!detalle.id_insumo) newErrors[`id_insumo_${index}`] = "El insumo es requerido";
      if (!detalle.cantidad) newErrors[`cantidad_${index}`] = "La cantidad es requerida";
    });

    if (hasDuplicateInsumos()) {
      newErrors.general = "No se pueden tener insumos duplicados.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Toast.fire({
        icon: 'error',
        title: 'Por favor, completa los datos correctamente.'
      });
      return;
    }
  
    const fichaToSave = {
      ...selectedFicha,
      detallesFichaTecnica: selectedFicha.detallesFichaTecnicat,
    };
  
    try {
      await axios.post("http://localhost:3000/api/fichastecnicas", fichaToSave);
      Toast.fire({
        icon: 'success',
        title: '¡Creación exitosa! La ficha técnica ha sido creada correctamente.'
      });
      fetchFichas();
      handleClose();
    } catch (error) {
      console.error("Error saving ficha:", error);
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: "Hubo un problema al guardar la ficha técnica." });
      }
    }
  };    
  
  return (
    <div className="rounded-3xl flex flex-col gap-6 p-6 bg-gray-50  text-blue-gray-900 shadow-lg">
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#000000',
          marginBottom: '0.5rem',
        }}
      >
        Crear Ficha Técnica
      </div>

      <DialogBody divider className="flex flex-col max-h-[100vh] overflow-hidden">
  <div className="flex flex-col gap-4 w-full p-4 bg-white rounded-lg shadow-sm">
  <div className="flex gap-4">
  <div className="flex flex-col gap-2 w-1/2">
    <label className="block text-sm font-medium  text-blue-gray-900">Cargar Ficha Técnica Existente 'Opcional':</label>
    <select
      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
      onChange={handleFichaChange}
      value={fichaSeleccionada}
    >
      <option value="">Seleccione una ficha técnica</option>
      {fichas.filter(ficha => ficha.estado).map(ficha => (
        <option key={ficha.id_ficha} value={ficha.id_ficha}>
          {ficha.descripcion}
        </option>
      ))}
    </select>
  </div>

  <div className="flex flex-col gap-2 w-1/2">
    <label className="block text-sm font-medium  text-blue-gray-900">Producto:</label>
    <select
      className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
      name="id_producto"
      required
      value={selectedFicha.id_producto}
      onChange={handleChange}
    >
      <option value="">Seleccione un producto</option>
      {productos.filter(producto => producto.estado).map(producto => (
        <option key={producto.id_producto} value={producto.id_producto}>
          {producto.nombre}
        </option>
      ))}
    </select>
    {errors.id_producto && <p className="text-red-500 text-xs mt-1">{errors.id_producto}</p>}
  </div>
</div>

<div className="flex gap-4">
<div className="flex flex-col gap-2 w-1/2">
      <label className="block text-sm font-medium  text-blue-gray-900">Descripción de la ficha técnica:</label>
      <Textarea
        name="descripcion"
        required
        value={selectedFicha.descripcion}
        onChange={handleChange}
        rows={2}
        className="text-sm w-full max-w-[400px] resize-none border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0"
      />
      {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
    </div>
    <div className="flex flex-col gap-2 w-1/2">
      <label className="block text-sm font-medium  text-blue-gray-900">Descripción detallada de los insumos:</label>
      <Textarea
        name="insumos"
        required
        value={selectedFicha.insumos}
        onChange={handleChange}
        rows={2}
        className="text-sm w-full max-w-[400px] resize-none border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0"
      />
      {errors.insumos && <p className="text-red-500 text-xs mt-1">{errors.insumos}</p>}
    </div>
  </div>
  </div>
  
<div className="w-full p-4 bg-white rounded-lg shadow-lg">
  <Typography variant="h6" color="black" className="text-lg font-semibold mb-4">
    Detalles de Insumos
  </Typography>
  <div className="overflow-x-auto max-h-64">
    <table className="min-w-full table-auto border-collapse">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-40 py-2 text-left text-sm font-medium  text-blue-gray-900 border-b">Insumo</th>
          <th className="px-6 py-2 text-left text-sm font-medium  text-blue-gray-900 border-b">Cantidad</th>
          <th className="px-4 py-2 text-left text-sm font-medium  text-blue-gray-900border-b">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200">
        {selectedFicha.detallesFichaTecnicat.map((detalle, index) => (
          <tr key={index} className="bg-white hover:bg-gray-100 transition-colors">
            <td className="px-4 py-2">
              <select
                className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
                name="id_insumo"
                value={detalle.id_insumo}
                required
                onChange={(e) => handleDetalleChange(index, e)}
              >
                <option value="">Seleccione un insumo</option>
                {insumos.filter(insumo => insumo.estado).map(insumo => (
                  <option key={insumo.id_insumo} value={insumo.id_insumo}>
                    {insumo.nombre}
                  </option>
                ))}
              </select>
              {errors[`id_insumo_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`id_insumo_${index}`]}</p>}
            </td>
            <td className="px-4 py-2">
  <input
    name="cantidad"
    required
    type="number"
    value={detalle.cantidad}
    onChange={(e) => {
      const value = e.target.value;
      if (value >= 0) {
        handleDetalleChange(index, e); 
      }}}
    className="text-sm w-24 p-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0"
  />
  {errors[`cantidad_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`cantidad_${index}`]}</p>}
</td>
            <td className="px-4 py-2 text-righ">
              <IconButton
                color="red"
                onClick={() => handleRemoveDetalle(index)}
                size="sm"
              >
                <TrashIcon className="h-5 w-5" />
              </IconButton>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  <div className="flex justify-end mt-4">
    <Button
      size="sm"
      onClick={handleAddDetalle}
      className="flex items-center gap-2 bg-black text-white hover:bg-pink-800 px-4 py-2 rounded-md"
    >
      <PlusIcon className="h-5 w-5" />
      Agregar Insumo
    </Button>
  </div>
</div>
</DialogBody>
<DialogFooter className=" p-4 flex justify-end gap-4 border-t border-gray-200">
  <Button
    variant="text"
    size="sm"
    onClick={handleClose}
    className="btncancelarm text-white"
  >
    Cancelar
  </Button>
  <Button
    variant="gradient"
    size="sm"
    onClick={handleSave}
    className="btnagregarm text-white"
  >
    Crear Ficha Técnica
  </Button>
</DialogFooter>
</div>
  );
}