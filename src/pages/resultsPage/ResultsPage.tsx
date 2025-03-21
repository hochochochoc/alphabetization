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
  const [writingProgress, setWritingProgress] = useState<ProgressMap>({});
  const [readingProgress, setReadingProgress] = useState<ProgressMap>({});

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // Fetch listening progress
        const listeningResponse = await fetch(
          "http://localhost:3001/api/listening_progress",
        );
        const listeningData = await listeningResponse.json();
        const listeningMap = listeningData.reduce(
          (acc: ProgressMap, item: ProgressItem) => {
            acc[item.target_letter] = {
              progress_percentage: calculateNormalizedProgress(item),
              total_attempts: item.total_attempts,
            };
            return acc;
          },
          {},
        );
        setListeningProgress(listeningMap);

        // Fetch writing progress
        const writingResponse = await fetch(
          "http://localhost:3001/api/writing_progress",
        );
        const writingData = await writingResponse.json();
        const writingMap = writingData.reduce(
          (acc: ProgressMap, item: ProgressItem) => {
            acc[item.target_letter] = {
              progress_percentage: calculateNormalizedProgress(item),
              total_attempts: item.total_attempts,
            };
            return acc;
          },
          {},
        );
        setWritingProgress(writingMap);

        // Fetch reading progress
        const readingResponse = await fetch(
          "http://localhost:3001/api/reading_progress",
        );
        const readingData = await readingResponse.json();
        const readingMap = readingData.reduce(
          (acc: ProgressMap, item: ProgressItem) => {
            acc[item.target_letter] = {
              progress_percentage: calculateNormalizedProgress(item),
              total_attempts: item.total_attempts,
            };
            return acc;
          },
          {},
        );
        setReadingProgress(readingMap);
      } catch (error) {
        console.error("Error fetching progress:", error);
      }
    };

    fetchProgress();
    const interval = setInterval(fetchProgress, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate normalized progress: max out at 10 attempts, percentage based on correct answers
  const calculateNormalizedProgress = (item: ProgressItem): number => {
    // If they've done more than 10 attempts, we consider only the percentage
    if (item.total_attempts >= 10) {
      return item.progress_percentage;
    }
    // If fewer than 10 attempts, calculate scaled percentage based on what they've done
    return (item.progress_percentage * item.total_attempts) / 10;
  };

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
        .filter((item) => item.progress < 100) // Filter out completed letters
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 7),
    },
    {
      name: "Escribir",
      color: "green",
      completedCount: Object.values(writingProgress).filter(
        (p) => p.progress_percentage >= 100,
      ).length,
      letters: Object.entries(writingProgress)
        .map(([letter, data]) => ({
          letter,
          progress: data.progress_percentage || 0,
        }))
        .filter((item) => item.progress < 100) // Filter out completed letters
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 7),
    },
    {
      name: "Leer",
      color: "yellow",
      completedCount: Object.values(readingProgress).filter(
        (p) => p.progress_percentage >= 100,
      ).length,
      letters: Object.entries(readingProgress)
        .map(([letter, data]) => ({
          letter,
          progress: data.progress_percentage || 0,
        }))
        .filter((item) => item.progress < 100) // Filter out completed letters
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 7),
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
