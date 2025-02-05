import React from "react";
import { Headphones, Pencil, BookOpen, Shuffle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";

interface GameModeButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

const GameModeButton: React.FC<GameModeButtonProps> = ({
  icon,
  title,
  description,
  onClick,
}) => (
  <button
    onClick={onClick}
    className="group flex w-full items-center space-x-4 rounded-lg border-2 border-transparent bg-white p-6 shadow-md transition-colors hover:border-blue-500 hover:bg-gray-50"
  >
    <div className="rounded-full bg-blue-100 p-3 transition-colors group-hover:bg-blue-200">
      {icon}
    </div>
    <div className="text-left">
      <h3 className="text-lg font-semibold text-gray-800 uppercase">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  </button>
);

const MenuPage: React.FC = () => {
  const navigate = useNavigate();

  const handleModeSelect = (mode: string) => {
    if (mode === "listening") {
      navigate("/test");
    }
    if (mode === "writing") {
      navigate("/writing");
    }
    // Other modes can be handled here when needed
  };

  const modes = [
    {
      id: "listening",
      icon: <Headphones className="h-6 w-6 text-blue-500" />,
      title: "Escuchar",
      description: "Mejora tu comprensión auditiva",
    },
    {
      id: "writing",
      icon: <Pencil className="h-6 w-6 text-blue-500" />,
      title: "Escribir",
      description: "Practica tu escritura",
    },
    {
      id: "reading",
      icon: <BookOpen className="h-6 w-6 text-blue-500" />,
      title: "Leer",
      description: "Mejora tu pronunciación y lectura",
    },
    {
      id: "mixed",
      icon: <Shuffle className="h-6 w-6 text-blue-500" />,
      title: "Tareas Mixtas",
      description: "Combina diferentes tipos de ejercicios",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-800">Modos</h1>
          <p className="text-gray-600">Selecciona un modo para comenzar</p>
        </div>

        <div className="space-y-4">
          {modes.map((mode) => (
            <GameModeButton
              key={mode.id}
              icon={mode.icon}
              title={mode.title}
              description={mode.description}
              onClick={() => handleModeSelect(mode.id)}
            />
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default MenuPage;
