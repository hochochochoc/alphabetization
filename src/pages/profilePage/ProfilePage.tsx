import React from "react";
import { UserPlus } from "lucide-react";
import BottomNav from "../../components/BottomNav";

interface ProfilePageProps {
  onCreateProfile?: () => void;
  onLogin?: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  onCreateProfile = () => {},
  onLogin = () => {},
}) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <p className="mb-8 text-center text-gray-600">
        Debes tener un perfil para agregar amigos
      </p>

      <div className="space-y-4">
        <button
          onClick={onCreateProfile}
          className="w-full rounded-md bg-blue-500 px-4 py-2 font-medium text-white uppercase transition-colors hover:bg-blue-600"
        >
          Crea tu perfil
        </button>

        <button
          onClick={onLogin}
          className="w-full rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-700 uppercase transition-colors hover:bg-gray-300"
        >
          Ingresar
        </button>
      </div>
      <BottomNav />
    </div>
  );
};

export default ProfilePage;
