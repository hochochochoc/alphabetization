import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { useAuth } from "../../contexts/AuthContext";

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout, loginAnonymously } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Failed to log out", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleAnonymousLogin = async () => {
    try {
      setIsLoggingIn(true);
      await loginAnonymously();
      // No need to navigate - we'll stay on this page
    } catch (error) {
      console.error("Failed to log in anonymously", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // If user is logged in, show user profile
  if (currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-blue-100 to-white p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-center text-2xl font-bold">Mi Perfil</h2>

          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-200">
              <span className="text-3xl font-bold text-blue-600">
                {currentUser.displayName
                  ? currentUser.displayName.charAt(0).toUpperCase()
                  : currentUser.isAnonymous
                    ? "A"
                    : "U"}
              </span>
            </div>
            <h3 className="text-xl font-semibold">
              {currentUser.displayName ||
                (currentUser.isAnonymous ? "Usuario Anónimo" : "Usuario")}
            </h3>
            {currentUser.email && (
              <p className="text-gray-600">{currentUser.email}</p>
            )}
            {currentUser.isAnonymous && (
              <p className="mt-2 text-sm text-amber-600">
                Has iniciado sesión de forma anónima. Tu progreso se guardará en
                este dispositivo.
              </p>
            )}
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate("/history")}
              className="w-full rounded-md bg-blue-100 px-4 py-2 font-medium text-blue-700 transition-colors hover:bg-blue-200"
            >
              Ver mi progreso
            </button>

            {currentUser.isAnonymous && (
              <button
                onClick={() => navigate("/signup")}
                className="w-full rounded-md bg-green-100 px-4 py-2 font-medium text-green-700 transition-colors hover:bg-green-200"
              >
                Crear cuenta permanente
              </button>
            )}

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full rounded-md bg-red-100 px-4 py-2 font-medium text-red-700 transition-colors hover:bg-red-200"
            >
              {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  // If user is not logged in, show login/signup options
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-white p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold">Mi Perfil</h2>

        <p className="mb-8 text-center text-gray-600">
          Crea tu perfil para guardar tu progreso y competir con amigos
        </p>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/signup")}
            className="w-full rounded-md bg-blue-500 px-4 py-3 font-medium text-white uppercase transition-colors hover:bg-blue-600"
          >
            Crear perfil
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full rounded-md bg-gray-200 px-4 py-3 font-medium text-gray-700 uppercase transition-colors hover:bg-gray-300"
          >
            Iniciar sesión
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">O</span>
            </div>
          </div>

          <button
            onClick={handleAnonymousLogin}
            disabled={isLoggingIn}
            className="w-full rounded-md bg-amber-100 px-4 py-3 font-medium text-amber-800 transition-colors hover:bg-amber-200"
          >
            {isLoggingIn ? "Iniciando..." : "Continuar como invitado"}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
