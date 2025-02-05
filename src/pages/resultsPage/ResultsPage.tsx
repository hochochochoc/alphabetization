import { ArrowLeft, Trophy, Star, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ResultsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-white p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center rounded-full bg-white p-2 shadow-md hover:bg-gray-50"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Resultados</h1>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white p-4 shadow-md">
            <div className="mb-2 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-600">Puntos</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">1,250</p>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-md">
            <div className="mb-2 flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-600">Nivel</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">5</p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Progreso</h2>

          <div className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Escuchar
                </span>
                <span className="text-sm font-medium text-gray-800">75%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full w-3/4 rounded-full bg-blue-500" />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Escribir
                </span>
                <span className="text-sm font-medium text-gray-800">45%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full w-[45%] rounded-full bg-green-500" />
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between">
                <span className="text-sm font-medium text-gray-600">
                  Pronunciación
                </span>
                <span className="text-sm font-medium text-gray-800">60%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full w-[60%] rounded-full bg-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            Actividad Reciente
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Bookmark className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  Completaste Alfabeto
                </p>
                <p className="text-sm text-gray-500">Hace 2 horas</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-2">
                <Star className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  Nuevo Nivel Alcanzado
                </p>
                <p className="text-sm text-gray-500">Hace 1 día</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
