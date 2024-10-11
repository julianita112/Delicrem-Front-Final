import React from "react";
import {
  Input,
  Select,
  Option,
  Button,
  Typography,
} from "@material-tailwind/react";
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

const ClienteCrear = ({ selectedCliente, setSelectedCliente, fetchClientes, handleHideCreateForm }) => {
  const [formErrors, setFormErrors] = React.useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedCliente({ ...selectedCliente, [name]: value });
    validateFields({ ...selectedCliente, [name]: value });
  };

  const validateFields = (cliente) => {
    const errors = {};

    // Validación para el nombre
    if (!cliente.nombre) {
      errors.nombre = 'El nombre es obligatorio.';
    } else if (cliente.nombre.length < 3) {
      errors.nombre = 'El nombre debe contener al menos 3 letras.';
    } else if (cliente.nombre.length > 25) {
      errors.nombre = 'El nombre no puede tener más de 25 letras.';
    } else if (/[^a-zA-Z\s]/.test(cliente.nombre)) {
      errors.nombre = 'El nombre solo puede contener letras y espacios.';
    }

    // Validación para el número de documento
    if (!cliente.numero_documento) {
      errors.numero_documento = 'El número de documento es obligatorio.';
    } else if (cliente.numero_documento.length < 5) {
      errors.numero_documento = 'El número de documento debe contener al menos 5 dígitos.';
    } else if (cliente.numero_documento.length > 15) {
      errors.numero_documento = 'El número de documento no puede contener más de 15 dígitos.';
    } else if (!/^\d+$/.test(cliente.numero_documento)) {
      errors.numero_documento = 'El número de documento solo puede contener dígitos.';
    }

    // Validación para el tipo de documento
    if (!cliente.tipo_documento) {
      errors.tipo_documento = 'Debe seleccionar un tipo de documento.';
    }

    // Validación para el número de teléfono
    if (!cliente.contacto) {
      errors.contacto = 'El número de teléfono es obligatorio.';
    } else if (cliente.contacto.length < 7) {
      errors.contacto = 'El número de teléfono debe contener al menos 7 caracteres.';
    } else if (cliente.contacto.length > 10) {
      errors.contacto = 'El número de teléfono no puede tener más de 10 dígitos.';
    } else if (!/^\d+$/.test(cliente.contacto)) {
      errors.contacto = 'El número de teléfono solo puede contener números.';
    }

    // Validación para el email
    if (!cliente.email) {
      errors.email = 'El email es obligatorio.';
    } else if (!/\S+@\S+\.\S+/.test(cliente.email)) {
      errors.email = 'El email no es válido.';
    } else if (cliente.email.length > 50) {
      errors.email = 'El email no puede tener más de 50 caracteres.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Nueva función para verificar si el cliente ya existe
  const checkClienteExists = async (nombre) => {
    try {
      const response = await axios.get("https://finalbackenddelicrem2.onrender.com/api/clientes");
      const clientes = response.data;

      return clientes.some(cliente => cliente.nombre.toLowerCase() === nombre.toLowerCase());
    } catch (error) {
      console.error("Error fetching clientes:", error);
      return false; // Si hay un error en la consulta, asumimos que el cliente no existe
    }
  };

  const handleSave = async () => {
    const isValid = await validateFields(selectedCliente);
    if (!isValid) {
      Toast.fire({
        icon: "error",
        title: "Por favor, completa todos los campos correctamente.",
      });
      return;
    }

    // Verifica si el cliente ya existe
    const exists = await checkClienteExists(selectedCliente.nombre);
    if (exists) {
      Toast.fire({
        icon: "error",
        title: "El nombre del cliente ya está registrado.",
      });
      return;
    }

    try {
      if (selectedCliente.id_cliente) {
        await axios.put(`https://finalbackenddelicrem2.onrender.com/api/clientes/${selectedCliente.id_cliente}`, selectedCliente);
        Toast.fire({
          icon: 'success',
          title: 'El cliente ha sido actualizado correctamente.'
        });
      } else {
        await axios.post("https://finalbackenddelicrem2.onrender.com/api/clientes", selectedCliente);
        Toast.fire({
          icon: 'success',
          title: '¡Creación exitosa! El cliente ha sido creado correctamente.'
        });
      }
      fetchClientes();
      handleHideCreateForm();
    } catch (error) {
      console.error("Error saving cliente:", error);
      Toast.fire({
        icon: 'error',
        title: 'Error al guardar cliente. Por favor, inténtalo de nuevo.'
      });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg w-full max-w-6xl mx-auto">
      <Typography variant="h4" color="blue-gray" className="mb-6 text-center font-bold">
        {selectedCliente.id_cliente ? "Editar Cliente" : "Crear Cliente"}
      </Typography>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Select
            label="Tipo Documento"
            name="tipo_documento"
            value={selectedCliente.tipo_documento}
            onChange={(e) => {
              setSelectedCliente({ ...selectedCliente, tipo_documento: e });
              validateFields({ ...selectedCliente, tipo_documento: e });
            }}
            required
          >
            <Option value="">Selecciona un tipo de documento</Option>
            <Option value="Cédula">Cédula</Option>
            <Option value="NIT">NIT</Option>
            <Option value="Pasaporte">Pasaporte</Option>
            <Option value="Cédula Extranjería">Cédula Extranjería</Option>
          </Select>
          {formErrors.tipo_documento && (
            <Typography className="text-red-500 text-sm mt-2">
              {formErrors.tipo_documento}
            </Typography>
          )}
        </div>

        <div>
          <Input
            label="Número Documento"
            name="numero_documento"
            value={selectedCliente.numero_documento}
            onChange={handleChange}
            required
          />
          {formErrors.numero_documento && (
            <Typography className="text-red-500 text-sm mt-2">
              {formErrors.numero_documento}
            </Typography>
          )}
        </div>

        <div>
          <Input
            label="Nombre del cliente"
            name="nombre"
            value={selectedCliente.nombre}
            onChange={handleChange}
            required
          />
          {formErrors.nombre && (
            <Typography className="text-red-500 text-sm mt-2">
              {formErrors.nombre}
            </Typography>
          )}
        </div>

        <div>
          <Input
            label="Número de teléfono"
            name="contacto"
            value={selectedCliente.contacto}
            onChange={handleChange}
            required
          />
          {formErrors.contacto && (
            <Typography className="text-red-500 text-sm mt-2">
              {formErrors.contacto}
            </Typography>
          )}
        </div>

        <div>
          <Input
            label="Email"
            name="email"
            value={selectedCliente.email}
            onChange={handleChange}
            required
          />
          {formErrors.email && (
            <Typography className="text-red-500 text-sm mt-2">
              {formErrors.email}
            </Typography>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-8 space-x-4">
        <Button className="btncancelarm" size="sm" color="red" onClick={handleHideCreateForm}>
          Cancelar
        </Button>
        <Button className="btnagregarm" size="sm" onClick={handleSave}>
          {selectedCliente.id_cliente ? "Guardar Cambios" : "Crear Cliente"}
        </Button>
      </div>
    </div>
  );
};

export default ClienteCrear;
