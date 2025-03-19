import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "../../components/BottomNav";

type ColorType = "blue" | "green" | "yellow";

interface LetterProgress {
  letter: string;
  progress: number;
}

interface Activity {
  name: string;
  color: ColorType;
  completedCount: number;
  letters: LetterProgress[];
}

interface ProgressData {
  progress_percentage: number;
  total_attempts: number;
}

interface ProgressMap {
  [key: string]: ProgressData;
}

interface ProgressItem {
  target_letter: string;
  progress_percentage: number;
  total_attempts: number;
}

const ResultsPage = () => {
  const navigate = useNavigate();

  const [listeningProgress, setListeningProgress] = useState<ProgressMap>({});

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const response = await fetch(
          "http://localhost:3001/api/listening_progress",
        );
        const data = await response.json();
        const progressMap = data.reduce(
          (acc: ProgressMap, item: ProgressItem) => {
            acc[item.target_letter] = {
              progress_percentage: item.progress_percentage,
              total_attempts: item.total_attempts,
            };
            return acc;
          },
          {},
        );
        setListeningProgress(progressMap);
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 60000);
    return () => clearInterval(interval);
  }, []);

  const activities: Activity[] = [
    {
      name: "Escuchar",
      color: "blue",
      completedCount: Object.values(listeningProgress).filter(
        (p) => p.progress_percentage >= 100,
      ).length,
      letters: Object.entries(listeningProgress)
        .map(([letter, data]) => ({
          letter,
          progress: data.progress_percentage || 0,
        }))
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 5),
    },

    {
      name: "Escribir",
      color: "green",
      completedCount: 12,
      letters: [
        { letter: "D", progress: 60 },
        { letter: "LL", progress: 45 },
        { letter: "Q", progress: 25 },
        { letter: "V", progress: 15 },
        { letter: "W", progress: 8 },
      ],
    },
    {
      name: "Leer",
      color: "yellow",
      completedCount: 18,
      letters: [
        { letter: "F", progress: 80 },
        { letter: "G", progress: 55 },
        { letter: "J", progress: 30 },
        { letter: "Z", progress: 20 },
        { letter: "K", progress: 5 },
      ],
    },
  ];

  const getColorClass = (
    color: ColorType,
    opacity: boolean = false,
  ): string => {
    const colorMap = {
      blue: opacity ? "bg-blue-100" : "bg-blue-500",
      green: opacity ? "bg-green-100" : "bg-green-500",
      yellow: opacity ? "bg-yellow-100" : "bg-yellow-500",
    };
    return colorMap[color];
  };

  const getBorderColorClass = (color: ColorType): string => {
    const colorMap = {
      blue: "border-blue-500",
      green: "border-green-500",
      yellow: "border-yellow-500",
    };
    return colorMap[color];
  };

  const getDarkBorderClass = (color: ColorType): string => {
    const colorMap = {
      blue: "border-blue-700",
      green: "border-green-700",
      yellow: "border-yellow-700",
    };
    return colorMap[color];
  };

  const getBackgroundColorClass = (color: ColorType): string => {
    const colorMap = {
      blue: "bg-blue-50",
      green: "bg-green-50",
      yellow: "bg-yellow-50",
    };
    return colorMap[color];
  };

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

        {/* Activities Progress */}
        <div className="space-y-6">
          {activities.map((activity, index) => (
            <div
              key={index}
              className={`${getBackgroundColorClass(activity.color)} rounded-xl p-4 shadow-md`}
            >
              <h2 className="mb-4 text-center text-lg font-semibold text-gray-800">
                {activity.name}
              </h2>

              <div className="grid grid-cols-4 gap-2">
                <div
                  className={`rounded-lg border-b-4 ${getDarkBorderClass(activity.color)}`}
                >
                  <div
                    className={`aspect-square rounded-md ${getColorClass(activity.color)} flex flex-col items-center justify-center p-2 text-center`}
                  >
                    <p className="text-3xl font-bold text-white">
                      {activity.completedCount}
                    </p>
                    <span className="text-[9px] font-medium text-white">
                      Completadas
                    </span>
                  </div>
                </div>

                {/* Letter progress squares with 3D effect */}
                {activity.letters.map((letterProgress, letterIndex) => (
                  <div
                    key={letterIndex}
                    className={`rounded-lg border-b-4 ${getDarkBorderClass(activity.color)}`}
                  >
                    <div
                      className={`aspect-square rounded-md ${getColorClass(activity.color, true)} overflow-hidden border-t border-r border-l ${getBorderColorClass(activity.color)} relative`}
                    >
                      {/* Progress fill */}
                      <div
                        className={`absolute bottom-0 left-0 w-full rounded-b-md ${getColorClass(activity.color)}`}
                        style={{
                          height: `${letterProgress.progress}%`,
                          transition: "height 0.3s ease-in-out",
                        }}
                      />
                      {/* Letter */}
                      <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-gray-800">
                        {letterProgress.letter}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-20"></div>
      <BottomNav />
    </div>
  );
};

export default ResultsPage;
