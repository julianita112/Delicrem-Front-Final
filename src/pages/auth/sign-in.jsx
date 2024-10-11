import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Button,
  Typography,
} from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/context/authContext";
import { debounce } from 'lodash';

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const navigate = useNavigate();
  const { login, updatePermissions } = useAuth();

  // Validar email en tiempo real
  const validateEmail = debounce((value) => {
    if (!value) {
      setEmailError("El campo de correo electrónico es obligatorio.");
    } else if (value.length < 4 || !value.includes("@")) {
      setEmailError("Ingrese un correo electrónico válido.");
    } else {
      setEmailError(""); // Limpiar errores si es válido
    }
  }, 300);

  // Validar contraseña en tiempo real
  const validatePassword = debounce((value) => {
    if (!value) {
      setPasswordError("El campo de contraseña es obligatorio.");
    } else if (value.length < 4) {
      setPasswordError("La contraseña debe tener al menos 4 caracteres.");
    } else {
      setPasswordError(""); // Limpiar errores si es válida
    }
  }, 300);

  // Función para manejar el envío del formulario
  const handleSignIn = async (e) => {
    e.preventDefault();

    // Limpiar errores anteriores
    setEmailError("");
    setPasswordError("");

    // Realizar la validación antes del envío
    validateEmail(email);
    validatePassword(password);

    if (emailError || passwordError) {
      return; // Evitar envío si hay errores
    }

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

    try {
      const response = await axios.post("http://localhost:3000/api/usuarios/login", {
        email,
        password,
      });

      if (response.status === 200) {
        const { token } = response.data;
        localStorage.setItem("token", token);

        const userResponse = await axios.get("http://localhost:3000/api/usuarios", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const user = userResponse.data.find(user => user.email === email);

        if (!user.estado) {
          Swal.fire({
            icon: "error",
            title: "Usuario inactivo",
            text: "El usuario está inactivo. Por favor, comuníquese con el administrador para recuperar el acceso.",
          });
          return;
        }

        const roleResponse = await axios.get(`http://localhost:3000/api/roles/${user.id_rol}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const permisosRol = roleResponse.data.permisosRol;
        login(user, permisosRol.map(permiso => permiso.nombre_permiso));
        updatePermissions(permisosRol.map(permiso => permiso.nombre_permiso));

        Toast.fire({
          icon: "success",
          title: "Acceso concedido."
        });

        navigate("/dashboard/home");
      } else {
        throw new Error("Credenciales inválidas");
      }
    } catch (err) {
      Toast.fire({
        icon: "error",
        title: "Credenciales inválidas. Por favor, inténtelo de nuevo."
      });
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white py-12 px-4">
      <div className="flex flex-col lg:flex-row w-full max-w-4xl mx-auto">
        <div className="lg:w-1/2 p-6 bg-white rounded-lg shadow-lg">
          <div className="text-center mb-4 mt-16">
            <Typography variant="h3" className=" text-blue-gray-900 font-semibold mb-6">Iniciar Sesión</Typography>
            <Typography variant="h6" className="text-gray-600 mt-4">
              Ingrese su correo electrónico y contraseña para iniciar sesión.
            </Typography>
          </div>
          <Card className="shadow-none p-4">
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div>
                <Typography variant="small" color="black" className="block font-medium mb-1">
                  Email
                </Typography>
                <Input
                  size="md"
                  placeholder="usuario@gmail.com"
                  className={`w-full border-gray-300 rounded-lg focus:border-pink-200 focus:ring-1 transition duration-300 ${emailError ? 'border-red-500 animate-pulse' : ''}`}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                  }}
                />
                <Typography className={`text-red-500 text-sm transition-opacity duration-300 ease-in-out ${emailError ? 'opacity-100' : 'opacity-0'}`}>
                  {emailError}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="black" className="block font-medium mb-1">
                  Contraseña
                </Typography>
                <Input
                  type="password"
                  size="md"
                  placeholder="********"
                  className={`w-full border-gray-300 rounded-lg focus:border-pink-200 focus:ring-1 transition duration-300 ${passwordError ? 'border-red-500 animate-pulse' : ''}`}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    validatePassword(e.target.value);
                  }}
                />
                <Typography className={`text-red-500 text-sm transition-opacity duration-300 ease-in-out ${passwordError ? 'opacity-100' : 'opacity-0'}`}>
                  {passwordError}
                </Typography>
              </div>
              <Button type="submit" className="w-full bg-black hover:bg-pink-700 text-white py-2 px-4 rounded-lg transition duration-300 transform hover:scale-105">
                Iniciar Sesión
              </Button>
            </form>
            <div className="text-center mt-4">
              <Button variant="text" color="blue-gray" onClick={() => navigate("/auth/reset-password")}>
                ¿Olvidaste tu contraseña?
              </Button>
            </div>
          </Card>
        </div>
        <div className="lg:w-2/4 hidden lg:block bg-gradient-to-br from-blue-100 to-blue-300 rounded-lg overflow-hidden">
          <img
            src="/img/delicrem4.jpg"
            className="h-full w-full object-cover rounded-lg"
            alt="Background"
          />
        </div>
      </div>
    </section>
  );
}

export default SignIn;
