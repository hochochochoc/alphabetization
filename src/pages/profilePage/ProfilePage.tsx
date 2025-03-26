import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";
import { useAuth } from "../../contexts/AuthContext";
import { fetchUserAttributes } from "aws-amplify/auth";

interface UserAttributes {
  email?: string;
  name?: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userAttributes, setUserAttributes] = useState<UserAttributes>({});

  useEffect(() => {
    const loadUserAttributes = async () => {
      if (currentUser) {
        try {
          const attributes = await fetchUserAttributes();
          console.log("User attributes:", attributes);
          setUserAttributes({
            email: attributes.email,
            name: attributes.name,
          });
        } catch (error) {
          console.error("Error fetching user attributes:", error);
        }
      }
    };

    loadUserAttributes();
  }, [currentUser]);

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

  // If user is logged in, show user profile
  if (currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-blue-100 to-white p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-center text-2xl font-bold">Mi Perfil</h2>

          <div className="mb-6 flex flex-col items-center">
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-blue-200">
              <span className="text-3xl font-bold text-blue-600">
                {userAttributes.name
                  ? userAttributes.name.charAt(0).toUpperCase()
                  : "U"}
              </span>
            </div>
            <h3 className="text-xl font-semibold">
              {userAttributes.name || "Usuario"}
            </h3>
            {userAttributes.email && (
              <p className="text-gray-600">{userAttributes.email}</p>
            )}
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate("/history")}
              className="w-full rounded-md bg-blue-100 px-4 py-2 font-medium text-blue-700 transition-colors hover:bg-blue-200"
            >
              Ver mi progreso
            </button>

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
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
