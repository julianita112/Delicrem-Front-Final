import {
  Card,
  Input,
  Button,
  Typography,
  IconButton,
} from "@material-tailwind/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";

export function ResetPassword() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1); // 1: Enviar email, 2: Ingresar token y nueva contraseña
  const navigate = useNavigate();

  const handleSendEmail = async (e) => {
    e.preventDefault();
    console.log("Sending email to:", email);

    try {
      const response = await axios.post("https://finalbackenddelicrem2.onrender.com/api/usuarios/recuperar_contrasena", { email });
      console.log("Email sent response:", response);

      if (response.status === 200) {
        Swal.fire("Email enviado", "Revisa tu correo para obtener el código de recuperación.", "success");
        setStep(2);
      }
    } catch (error) {
      console.error("Error during email sending:", error);
      Swal.fire("Error", "Hubo un problema al enviar el email. Verifica que el correo sea correcto.", "error");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const payload = {
      email, // El email se envía automáticamente desde el primer paso
      token,
      nuevaContrasena: newPassword,
    };
    console.log("Attempting password reset with payload:", payload);

    try {
      const response = await axios.post("https://finalbackenddelicrem2.onrender.com/api/usuarios/cambiar_contrasena", payload);

      console.log("Password reset response:", response);

      if (response.status === 200) {
        Swal.fire("Contraseña actualizada", "Tu contraseña ha sido actualizada exitosamente.", "success");
        navigate("/auth/sign-in");
      }
    } catch (error) {
      console.error("Error during password reset:", error);
      console.error("Error response data:", error.response?.data);
      Swal.fire("Error", "Hubo un problema al actualizar la contraseña. Verifica que el código sea correcto.", "error");
    }
  };

  return (
    <section className="m-7 flex gap-4 bg-gradient-to-br from-white to-white">
      <div className="w-full lg:w-1/2 mt-20">
        <Card className="p-12 shadow-xl rounded-lg bg-white">
          <div className="text-center mb-6">
           
            <Typography variant="h3" className=" text-blue-gray-900 font-bold mb-4">
              {step === 1 ? "Recuperar Contraseña" : "Restablecer Contraseña"}
            </Typography>
            <Typography variant="paragraph" color="blue-gray" className="text-lg font-normal">
              {step === 1 ? "Ingrese su correo electrónico para recibir el código de recuperación." : "Ingrese el código y su nueva contraseña."}
            </Typography>
          </div>
          <form className="mt-8" onSubmit={step === 1 ? handleSendEmail : handleResetPassword}>
            {step === 1 && (
              <div className="mb-4">
                <Typography variant="small" color="blue-gray" className="mb-2 block font-medium">
                  Email
                </Typography>
                <Input
                  size="lg"
                  placeholder="usuario@gmail.com"
                  className="w-full border-t-blue-gray-200 focus:border-t-gray-900"
                  labelProps={{
                    className: "before:content-none after:content-none",
                  }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}
            {step === 2 && (
              <>
                <div className="mb-4">
                  <Typography variant="small" color="blue-gray" className="mb-2 block font-medium">
                    Código de Recuperación
                  </Typography>
                  <Input
                    size="lg"
                    placeholder="Ingrese el código"
                    className="w-full border-t-blue-gray-200 focus:border-t-gray-900"
                    labelProps={{
                      className: "before:content-none after:content-none",
                    }}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
                <div className="mb-4 relative">
                  <Typography variant="small" color="blue-gray" className="mb-2 block font-medium">
                    Nueva Contraseña
                  </Typography>
                  <Input
                    type={showPassword ? "text" : "password"}
                    size="lg"
                    placeholder="********"
                    className="w-full border-t-blue-gray-200 focus:border-t-gray-900"
                    labelProps={{
                      className: "before:content-none after:content-none",
                    }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                 
                </div>
              </>
            )}
            <div className="flex justify-between">
              <Button variant="text" color="blue-gray" onClick={() => navigate("/auth/sign-in")}>
                Cancelar
              </Button>
              <Button type="submit" className="mt-6">
                {step === 1 ? "Enviar Código" : "Restablecer Contraseña"}
              </Button>
            </div>
          </form>
          {step === 2 && (
            <div className="text-center mt-4">
              <Button variant="text" color="blue-gray" onClick={() => setStep(1)}>
                ¿No recibiste el código? Intenta de nuevo
              </Button>
            </div>
          )}
        </Card>
      </div>
      <div className="w-1/2 h-full hidden lg:block shadow-xl">
        <img
          src="/img/delicrem6.jpg"
          className="h-full w-full object-cover rounded-lg"
          alt="Background"
        />
      </div>
    </section>
  );
}

export default ResetPassword;
