import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  IconButton,
  Select,
  Option,
  Typography,
} from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import Swal from "sweetalert2";
import axios from "../../utils/axiosConfig";

export function CrearCompra({ handleClose, fetchCompras, proveedores, insumos }) {
  const [selectedCompra, setSelectedCompra] = useState({
    id_proveedor: "",
    fecha_compra: "",
    fecha_registro: "",
    numero_recibo: "",
    id_estado: 1,
    detalleCompras: [],
    total: 0,
    subtotal: 0,
  });
  const [errors, setErrors] = useState({});

    // Establecer la fecha de hoy como la fecha de registro cuando el componente se monta
    useEffect(() => {
      const today = new Date().toISOString().split("T")[0]; // Formato YYYY-MM-DD
      setSelectedCompra((prevState) => ({
        ...prevState,
        fecha_registro: today,
      }));
    }, []);
  

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    },
  });

  const validateForm = () => {
    const newErrors = {};
    if (!selectedCompra.id_proveedor) {
      newErrors.id_proveedor = "El proveedor es obligatorio";
    }
    if (!selectedCompra.fecha_compra) {
      newErrors.fecha_compra = "La fecha de compra es obligatoria";
    } else if (new Date(selectedCompra.fecha_compra) > new Date()) {
      newErrors.fecha_compra = "La fecha de compra no puede ser en el futuro";
    }
    

    if (!selectedCompra.numero_recibo) {
      newErrors.numero_recibo = "El número de recibo es obligatorio";
    }
    if (!selectedCompra.id_estado) {
      newErrors.id_estado = "El estado es obligatorio";
    }
    if (selectedCompra.detalleCompras.length === 0) {
      newErrors.detalleCompras = "Debe agregar al menos un detalle de compra";
    }
    selectedCompra.detalleCompras.forEach((detalle, index) => {
      if (!detalle.id_insumo) {
        newErrors[`insumo_${index}`] = "El insumo es obligatorio";
      }
      if (!detalle.cantidad || detalle.cantidad <= 0) {
        newErrors[`cantidad_${index}`] = "Completa este campo";
      }
      if (!detalle.precio_unitario || detalle.precio_unitario <= 0) {
        newErrors[`precio_unitario_${index}`] = "El precio unitario debe ser mayor a 0";
      }
    });
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  

  const handleSave = async () => {
    if (!validateForm()) {
      // Muestra un toast si hay errores en el formulario
      Toast.fire({
        icon: 'error',
        title: 'Por favor, completa los datos correctamente.'
      });
      return;
    }
  

    const insumosSeleccionados = selectedCompra.detalleCompras.map(
      (detalle) => detalle.id_insumo
    );
    const insumosUnicos = new Set(insumosSeleccionados);
    if (insumosSeleccionados.length !== insumosUnicos.size) {
      Toast.fire({
        icon: "error",
        title: "No se pueden seleccionar insumos duplicados.",
      });
      return;
    }

    const compraToSave = {
      id_proveedor: parseInt(selectedCompra.id_proveedor),
      fecha_compra: selectedCompra.fecha_compra,
      fecha_registro: selectedCompra.fecha_registro,
      numero_recibo: selectedCompra.numero_recibo,
      id_estado: selectedCompra.id_estado,
      total: selectedCompra.total,
      detalleCompras: selectedCompra.detalleCompras.map((detalle) => ({
        id_insumo: parseInt(detalle.id_insumo),
        cantidad: parseInt(detalle.cantidad),
        precio_unitario: parseFloat(detalle.precio_unitario),
      })),
    };

    try {
      await axios.post("http://localhost:3000/api/compras", compraToSave);
      Toast.fire({
        icon: "success",
        title: "¡Creación exitosa! La compra ha sido creada correctamente.",
      });
      fetchCompras();
      handleClose();
    } catch (error) {
      console.error("Error saving compra:", error);
      Toast.fire({
        icon: "error",
        title: "Hubo un problema al guardar la compra.",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedCompra({ ...selectedCompra, [name]: value });
    validateField(name, value);
  };
  

  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    const detalles = [...selectedCompra.detalleCompras];

    if (name === "cantidad") {
      detalles[index][name] = value.replace(/\D/, "");
    } else if (name === "precio_unitario") {
      detalles[index][name] = value.replace(/[^\d.]/, "");
    } else {
      detalles[index][name] = value;
    }

    const cantidad = parseFloat(detalles[index].cantidad) || 0;
    const precioUnitario = parseFloat(detalles[index].precio_unitario) || 0;
    detalles[index].subtotal = cantidad * precioUnitario;

    setSelectedCompra({ ...selectedCompra, detalleCompras: detalles });
    setErrors({ ...errors, [`${name}_${index}`]: "" });
    updateTotal(detalles);
  };

  const validateField = (name, value, index = null) => {
    const newErrors = { ...errors };
  
    switch (name) {
      case "id_proveedor":
        if (!value) {
          newErrors.id_proveedor = "El proveedor es obligatorio";
        } else {
          delete newErrors.id_proveedor;
        }
        break;
        case "fecha_compra":
          if (!value) {
            newErrors.fecha_compra = "La fecha de compra es obligatoria";
          } else if (new Date(value) > new Date().setHours(0, 0, 0, 0)) {
            newErrors.fecha_compra = "La fecha de compra no puede ser en el futuro";
          } else {
            delete newErrors.fecha_compra;
          }
          break;
        
     
      case "numero_recibo":
        if (!value) {
          newErrors.numero_recibo = "El número de recibo es obligatorio";
        } else if (value.length < 4 || value.length > 15) {
          newErrors.numero_recibo = "El número de recibo debe tener entre 4 y 15 caracteres";
        } else if (!/^[a-zA-Z0-9]+$/.test(value)) {
          newErrors.numero_recibo = "El número de recibo solo puede contener letras y números";
        } else {
          delete newErrors.numero_recibo;
        }
        break;
      case "cantidad":
        if (!value) {
          newErrors[`cantidad_${index}`] = "La cantidad es obligatoria";
        } else if (!/^\d+$/.test(value)) {
          newErrors[`cantidad_${index}`] = "La cantidad solo puede contener dígitos";
        } else if (parseInt(value, 10) <= 0) {
          newErrors[`cantidad_${index}`] = "La cantidad debe ser mayor a 0";
        } else {
          delete newErrors[`cantidad_${index}`];
        }
        break;
      case "precio_unitario":
        if (!value) {
          newErrors[`precio_unitario_${index}`] = "El precio unitario es obligatorio";
        } else if (!/^\d*\.?\d*$/.test(value)) {
          newErrors[`precio_unitario_${index}`] = "El precio unitario debe ser un número válido";
        } else if (parseFloat(value) <= 0) {
          newErrors[`precio_unitario_${index}`] = "El precio unitario debe ser mayor a 0";
        } else {
          delete newErrors[`precio_unitario_${index}`];
        }
        break;
      default:
        break;
    }
  
    setErrors(newErrors);
  };
  

  const handleAddDetalle = () => {
    // Verificar si hay campos vacíos en los detalles existentes
    const hasEmptyFields = selectedCompra.detalleCompras.some(detalle => 
      !detalle.id_insumo || !detalle.cantidad
    );
  
    if (hasEmptyFields) {
      Toast.fire({
        icon: 'error',
        title: 'Por favor, completa todos los campos antes de agregar un nuevo insumo.'
      });
      return;
    }
  
    // Verificar si hay insumos duplicados
    const hasDuplicateInsumos = () => {
      const ids = selectedCompra.detalleCompras.map(detalle => detalle.id_insumo);
      return new Set(ids).size !== ids.length;
    };
  
    if (hasDuplicateInsumos()) {
      Toast.fire({
        icon: 'error',
        title: 'No se pueden agregar insumos duplicados.'
      });
      return;
    }
  
    // Agregar un nuevo detalle a la lista de detalles
    setSelectedCompra({
      ...selectedCompra,
      detalleCompras: [
        ...selectedCompra.detalleCompras,
        { id_insumo: "", cantidad: "", precio_unitario: "", subtotal: 0 },
      ],
    });
  };
  
  const handleRemoveDetalle = (index) => {
    const detalles = [...selectedCompra.detalleCompras];
    detalles.splice(index, 1);
    setSelectedCompra({ ...selectedCompra, detalleCompras: detalles });
    updateTotal(detalles);
  };

  const updateTotal = (detalles) => {
    const total = detalles.reduce((acc, detalle) => acc + (detalle.subtotal || 0), 0);
    setSelectedCompra((prevState) => ({
      ...prevState,
      total,
      subtotal: total,
    }));
  };

  return (

    <div className="flex-1 flex flex-col gap-4">
      <div className="flex gap-4 mb-4">
      <div className="flex flex-col gap-4 w-1/4 pr-4 bg-white rounded-lg shadow-sm p-4">
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#000000',
          marginBottom: '0.5rem',
        }}
      >
        Crear Compra
      </div>

          <div>
            
            <Select
              label="Seleccione un Proveedor"
              name="id_proveedor"
              value={selectedCompra.id_proveedor}
              onChange={(e) => {
                setSelectedCompra({ ...selectedCompra, id_proveedor: e });
                setErrors({ ...errors, id_proveedor: "" });
              }}
              className={`w-full ${errors.id_proveedor ? "border-red-500" : ""}`}
              required
            >
              {proveedores
                .filter((proveedor) => proveedor.estado)
                .map((proveedor) => (
                  <Option key={proveedor.id_proveedor} value={proveedor.id_proveedor}>
                    {proveedor.nombre}
                  </Option>
                ))}
            </Select>
            {errors.id_proveedor && <p className="text-red-500 text-xs mt-1">{errors.id_proveedor}</p>}
          </div>
          <div>
          <label className="block text-sm font-medium  text-blue-gray-900">Fecha de Compra:</label>
            <Input
           
              name="fecha_compra"
              type="date"
              value={selectedCompra.fecha_compra}
              onChange={handleChange}
              className={`w-full ${errors.fecha_compra ? "border-red-500" : ""}`}
              required
            />
            {errors.fecha_compra && <p className="text-red-500 text-xs mt-1">{errors.fecha_compra}</p>}
          </div>
          <div>
          <label className="block text-sm font-medium  text-blue-gray-900">Fecha de Registro:</label>
            <Input
              label="Fecha de Registro"
              name="fecha_registro"
              type="date"
              value={selectedCompra.fecha_registro}
              disabled // Deshabilitar para que no se pueda editar
              className="w-full bg-gray-100" // Cambiar el fondo para indicar que está deshabilitado
            />
            {errors.fecha_registro && <p className="text-red-500 text-xs mt-1">{errors.fecha_registro}</p>}
          </div>
          <div>
          <label className="block text-sm font-medium  text-blue-gray-900">Nro. de Recibo:</label>
            <Input

              name="numero_recibo"
              type="text"
              value={selectedCompra.numero_recibo}
              onChange={handleChange}
              className={`w-full ${errors.numero_recibo ? "border-red-500" : ""}`}
              required
            />
            {errors.numero_recibo && <p className="text-red-500 text-xs mt-1">{errors.numero_recibo}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-4xl overflow-y-auto p-4 bg-white rounded-lg shadow-md" style={{ maxHeight: '400px' }}> {/* Ajusta la altura máxima según sea necesario */}
  <Typography variant="h6" color="blue-gray" className="text-lg font-semibold">
    Insumos a comprar
  </Typography>

  <div className="flex flex-col gap-4 overflow-y-auto"> {/* Asegúrate de que esta sección también tenga overflow */}
    {selectedCompra.detalleCompras.map((detalle, index) => (
      <div key={index} className="flex flex-col md:flex-row items-start gap-4 mb-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 w-full">
        
          <div className="flex flex-col md:w-1/2 gap-2">
            <label className="block text-sm font-medium text-gray-700">Insumo:</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
              name="id_insumo"
              value={detalle.id_insumo}
              required
              onChange={(e) => {
                handleDetalleChange(index, { target: { name: "id_insumo", value: e.target.value } });
                setErrors({ ...errors, [`insumo_${index}`]: "" });
              }}
            >
              <option value="">Seleccione un insumo</option>
              {insumos
                .filter(insumo => insumo.estado)
                .map(insumo => (
                  <option key={insumo.id_insumo} value={insumo.id_insumo}>
                    {insumo.nombre}
                  </option>
                ))}
            </select>
            {errors[`insumo_${index}`] && (
              <p className="text-red-500 text-xs mt-1">{errors[`insumo_${index}`]}</p>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full">
            <div className="flex flex-col md:w-1/4 gap-2">
              <label className="block text-sm font-medium text-gray-700">Cantidad:</label>
              <input
                name="cantidad"
                type="number"
                required
                value={detalle.cantidad}
                onChange={(e) => {
                  handleDetalleChange(index, e);
                  setErrors({ ...errors, [`cantidad_${index}`]: "" });
                }}
                className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:border-blue-500 focus:ring-0"
              />
              {errors[`cantidad_${index}`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`cantidad_${index}`]}</p>
              )}
            </div>

            <div className="flex flex-col md:w-2/4 gap-2">
              <label className="block text-sm font-medium text-gray-700">Precio Unitario:</label>
              <input
                name="precio_unitario"
                type="number"
                step="0.01"
                required
                value={detalle.precio_unitario}
                onChange={(e) => {
                  handleDetalleChange(index, e);
                  setErrors({ ...errors, [`precio_unitario_${index}`]: "" });
                }}
                className="w-full text-xs border border-gray-300 rounded-lg p-2 focus:border-blue-500 focus:ring-0"
              />
              {errors[`precio_unitario_${index}`] && (
                <p className="text-red-500 text-xs mt-1">{errors[`precio_unitario_${index}`]}</p>
              )}
            </div>

            <div className="flex flex-col md:w-1/4 gap-2">
              <label className="block text-sm font-medium text-gray-700">Subtotal:</label>
              <input
                name="subtotal"
                type="text"
                value={`$${(detalle.subtotal || 0).toFixed(2)}`}
                readOnly
                className="w-full text-xs bg-gray-100 border border-gray-300 rounded-lg p-2"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mt-4 md:mt-0">
          <IconButton
            color="red"
            onClick={() => handleRemoveDetalle(index)}
            size="sm"
          >
            <TrashIcon className="h-4 w-4" />
          </IconButton>
        </div>
      </div>
    ))}

    <div className="flex items-center mt-4">
      <Button
        size="sm"
        onClick={handleAddDetalle}
        className="flex items-center gap-2 bg-black text-white hover:bg-pink-800 px-4 py-2 rounded-md normal-case"
>
<PlusIcon className="h-5 w-5" />
  Agregar Insumo
</Button>

    </div>
  </div>

  <div className="flex justify-end mt-4">
    <Typography variant="h6" color="blue-gray">
      Total de la Compra: ${(selectedCompra.total || 0).toFixed(2)}
    </Typography>
  </div>
</div>
</div>
      <div className="mt-4 flex justify-end gap-4">
        <Button variant="text" className="btncancelarm" size="sm" onClick={handleClose}>
          Cancelar
        </Button>
        <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleSave}>
          Crear Compra
        </Button>
      </div>
    </div>
  );
}
