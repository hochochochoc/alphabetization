import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft } from "lucide-react";

const Signup: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const { signup, confirmSignup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      return setError("Las contraseñas no coinciden");
    }

    try {
      setError("");
      setLoading(true);

      const { isSignUpComplete, nextStep } = await signup(
        email,
        password,
        name,
      );

      if (!isSignUpComplete && nextStep?.signUpStep === "CONFIRM_SIGN_UP") {
        setConfirmationStep(true);
      } else {
        navigate("/login");
      }
    } catch (err: any) {
      console.error(err);

      // Handle AWS Cognito specific errors
      if (err.name === "UsernameExistsException") {
        setError("Ya existe una cuenta con este correo electrónico.");
      } else if (err.name === "InvalidPasswordException") {
        setError("La contraseña debe tener al menos 8 caracteres.");
      } else {
        setError("Error al crear la cuenta. Por favor, intenta nuevamente.");
      }
    }

    setLoading(false);
  }

  async function handleConfirmation(e: React.FormEvent) {
    e.preventDefault();

    try {
      setError("");
      setLoading(true);

      await confirmSignup(email, verificationCode);
      navigate("/login");
    } catch (err: any) {
      console.error(err);

      if (err.name === "CodeMismatchException") {
        setError("Código de verificación incorrecto.");
      } else {
        setError(
          "Error al confirmar la cuenta. Por favor, intenta nuevamente.",
        );
      }
    }

    setLoading(false);
  }

  if (confirmationStep) {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-100 to-white p-4">
        <button
          onClick={() => navigate("/profile")}
          className="mb-4 flex items-center justify-center self-start rounded-full bg-white p-2 shadow-md hover:bg-gray-50"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>

        <div className="mx-auto mt-8 w-full max-w-md rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-6 text-center text-2xl font-bold">
            Confirmar Cuenta
          </h2>

          <p className="mb-4 text-gray-600">
            Se ha enviado un código de verificación a tu correo electrónico.
          </p>

          {error && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleConfirmation} className="space-y-4">
            <div>
              <label htmlFor="code" className="mb-2 block text-gray-700">
                Código de Verificación
              </label>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Ingresa el código"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? "Verificando..." : "Confirmar"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-100 to-white p-4">
      <button
        onClick={() => navigate("/profile")}
        className="mb-4 flex items-center justify-center self-start rounded-full bg-white p-2 shadow-md hover:bg-gray-50"
      >
        <ArrowLeft className="h-6 w-6 text-gray-600" />
      </button>

      <div className="mx-auto mt-8 w-full max-w-md rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold">Crear Cuenta</h2>

        {error && (
          <div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block text-gray-700">
              Nombre
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-gray-700">
              Correo Electrónico
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="******"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-gray-700"
            >
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirm-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="******"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? "Creando cuenta..." : "Crear Cuenta"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-600">
            ¿Ya tienes una cuenta?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-500 hover:underline"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
