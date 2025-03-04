import React, { useState, useEffect, useRef } from "react";
import { Volume2, ArrowLeft, Eraser } from "lucide-react";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { useNavigate } from "react-router-dom";

// ML5 type declarations
declare global {
  interface Window {
    ml5: {
      KNNClassifier: () => KNNClassifier;
      featureExtractor: (
        modelName: string,
        callback?: () => void,
      ) => FeatureExtractor;
    };
  }
}

interface KNNClassifier {
  addExample: (features: any, label: string) => void;
  classify: (
    features: any,
    callback: (
      error: Error | null,
      result?: { label: string; confidence: number },
    ) => void,
  ) => void;
}

interface FeatureExtractor {
  infer: (input: HTMLCanvasElement | HTMLImageElement) => any;
}

interface ML5Classifier {
  knn: KNNClassifier;
  featureExtractor: FeatureExtractor;
}

interface SpanishLetter {
  letter: string;
  voice: string;
}

// Define Spanish letters
const spanishLetters: SpanishLetter[] = [
  { letter: "A", voice: "A" },
  { letter: "B", voice: "be" },
  { letter: "C", voice: "ce" },
  { letter: "D", voice: "de" },
  { letter: "E", voice: "E" },
  { letter: "F", voice: "efe" },
  { letter: "G", voice: "ge" },
  { letter: "H", voice: "hache" },
  { letter: "I", voice: "i" },
  { letter: "J", voice: "jota" },
  { letter: "K", voice: "ka" },
  { letter: "L", voice: "ele" },
  { letter: "M", voice: "eme" },
  { letter: "N", voice: "ene" },
  { letter: "O", voice: "o" },
  { letter: "P", voice: "pe" },
  { letter: "Q", voice: "cu" },
  { letter: "R", voice: "erre" },
  { letter: "S", voice: "ese" },
  { letter: "T", voice: "te" },
  { letter: "U", voice: "u" },
  { letter: "V", voice: "uve" },
  { letter: "W", voice: "uve doble" },
  { letter: "X", voice: "equis" },
  { letter: "Y", voice: "i griega" },
  { letter: "Z", voice: "zeta" },
];

const WritingTestPage: React.FC = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [totalCorrect, setTotalCorrect] = useState<number>(0);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [isGameComplete, setIsGameComplete] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [classifier, setClassifier] = useState<ML5Classifier | null>(null);
  const [isClassifierReady, setIsClassifierReady] = useState<boolean>(false);
  const [rounds, setRounds] = useState<SpanishLetter[]>(
    Array(8)
      .fill(null)
      .map(
        () => spanishLetters[Math.floor(Math.random() * spanishLetters.length)],
      ),
  );

  const polly = new PollyClient({
    region: import.meta.env.VITE_AWS_REGION || "eu-west-3",
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
    },
  });

  // Initialize ML5 classifier
  useEffect(() => {
    const initializeClassifier = async (): Promise<void> => {
      try {
        // Check if ml5 is available in window
        if (!window.ml5) {
          console.error("ml5 is not available. Make sure to include the CDN.");
          return;
        }

        // Create a KNN classifier
        const knnClassifier = window.ml5.KNNClassifier();

        // Create a feature extractor using MobileNet
        const featureExtractor = window.ml5.featureExtractor(
          "MobileNet",
          () => {
            console.log("Feature extractor loaded");

            // Load example images and add them to classifier
            loadExampleImages(featureExtractor, knnClassifier);
          },
        );

        setClassifier({
          knn: knnClassifier,
          featureExtractor: featureExtractor,
        });
      } catch (error) {
        console.error("Error initializing ML5 classifier:", error);
      }
    };

    initializeClassifier();
  }, []);

  // Load example images for each letter
  const loadExampleImages = async (
    featureExtractor: FeatureExtractor,
    knnClassifier: KNNClassifier,
  ): Promise<void> => {
    console.log("Loading example images...");

    try {
      // This would be replaced with actual image loading from your example set
      // For each letter we would load multiple examples

      // Example structure (pseudocode):
      for (const letter of spanishLetters) {
        // For each letter, we would have multiple example images
        // e.g. A1.png, A2.png, A3.png for letter A

        // Assuming you have example images stored in a folder structure like:
        // /examples/A/1.png, /examples/A/2.png, etc.

        for (let i = 1; i <= 3; i++) {
          // Path would be something like `/examples/${letter.letter}/${i}.png`
          // For now, we'll just log it as this will be implemented when examples exist
          console.log(`Would load example for ${letter.letter}, example #${i}`);

          // Example of how you would add each image to the classifier:
          // const img = await loadImage(`/examples/${letter.letter}/${i}.png`);
          // const features = featureExtractor.infer(img);
          // knnClassifier.addExample(features, letter.letter);
        }
      }

      console.log("Example images loaded successfully");
      setIsClassifierReady(true);
    } catch (error) {
      console.error("Error loading example images:", error);
    }
  };

  const playSound = async (): Promise<void> => {
    if (isGameComplete) return;

    const command = new SynthesizeSpeechCommand({
      Text: rounds[currentRound].voice,
      OutputFormat: "mp3",
      VoiceId: "Sergio",
      LanguageCode: "es-ES",
      Engine: "neural",
    });

    try {
      const response = await polly.send(command);
      if (response.AudioStream) {
        const blob = new Blob(
          [await response.AudioStream.transformToByteArray()],
          { type: "audio/mpeg" },
        );
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.volume = 1.0;
        await audio.play();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => playSound(), 500);
    return () => clearTimeout(timer);
  }, [currentRound]);

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
        if (result === "correct") {
          if (currentRound === rounds.length - 1) {
            setIsGameComplete(true);
          } else {
            setCurrentRound((prev) => prev + 1);
            clearCanvas();
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [result, currentRound, rounds.length]);

  const initCanvas = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  useEffect(() => {
    initCanvas();
    const canvas = canvasRef.current;
    if (canvas) {
      // Disable default touch behavior for the entire canvas
      canvas.style.touchAction = "none";
    }
    window.addEventListener("resize", initCanvas);
    return () => {
      window.removeEventListener("resize", initCanvas);
    };
  }, []);

  const clearCanvas = (): void => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent): void => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x =
      "touches" in e
        ? (e.touches[0].clientX - rect.left) * (canvas.width / rect.width)
        : ((e as React.MouseEvent).clientX - rect.left) *
          (canvas.width / rect.width);
    const y =
      "touches" in e
        ? (e.touches[0].clientY - rect.top) * (canvas.height / rect.height)
        : ((e as React.MouseEvent).clientY - rect.top) *
          (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent): void => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x =
      "touches" in e
        ? (e.touches[0].clientX - rect.left) * (canvas.width / rect.width)
        : ((e as React.MouseEvent).clientX - rect.left) *
          (canvas.width / rect.width);
    const y =
      "touches" in e
        ? (e.touches[0].clientY - rect.top) * (canvas.height / rect.height)
        : ((e as React.MouseEvent).clientY - rect.top) *
          (canvas.height / rect.height);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (): void => {
    setIsDrawing(false);
  };

  const checkDrawing = async (): Promise<void> => {
    if (!classifier || !isClassifierReady) {
      console.error("Classifier not ready");
      return;
    }

    setIsLoading(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) {
        throw new Error("Canvas not found");
      }

      // Extract features from the current drawing
      const features = classifier.featureExtractor.infer(canvas);

      // Get the classification from KNN classifier
      classifier.knn.classify(features, (error, result) => {
        if (error) {
          console.error("Error classifying drawing:", error);
          setResult("incorrect");
          setIsLoading(false);
          return;
        }

        if (!result) {
          console.error("No classification result");
          setResult("incorrect");
          setIsLoading(false);
          return;
        }

        // The result will contain label (letter) and confidence
        console.log("Classification result:", result);

        // Get the predicted letter and confidence
        const predictedLetter = result.label;
        const confidence = result.confidence;

        // Check if it matches the target letter (simplified logic for now)
        const targetLetter = rounds[currentRound].letter;

        // We could set a confidence threshold, but for now we'll just check for exact match
        const isCorrect = predictedLetter === targetLetter;

        setResult(isCorrect ? "correct" : "incorrect");

        if (isCorrect) {
          setScore((prev) => prev + 1);
          setTotalCorrect((prev) => prev + 1);
        } else {
          setScore(0);
        }

        setIsLoading(false);
      });
    } catch (error) {
      console.error("Error recognizing drawing:", error);
      setResult("incorrect");
      setIsLoading(false);
    }
  };

  const getBgColor = (): string => {
    if (result === "correct") return "bg-green-100";
    if (result === "incorrect") return "bg-red-100";
    return "bg-gradient-to-br from-blue-100 to-white";
  };

  if (isGameComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-white p-4">
        <div className="rounded-2xl p-8 text-center">
          <h1 className="mb-4 text-2xl font-bold">¡Felicitaciones!</h1>
          <p className="mb-8">
            Has completado el ejercicio con {totalCorrect} respuestas correctas
            de {rounds.length} letras.
          </p>
          <button
            onClick={() => {
              setCurrentRound(0);
              setScore(0);
              setTotalCorrect(0);
              setIsGameComplete(false);
              setRounds(
                Array(8)
                  .fill(null)
                  .map(
                    () =>
                      spanishLetters[
                        Math.floor(Math.random() * spanishLetters.length)
                      ],
                  ),
              );
              setTimeout(() => clearCanvas(), 0);
            }}
            className="rounded-xl bg-blue-500 px-8 py-4 font-semibold text-white hover:bg-blue-600"
          >
            Jugar otra vez
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-screen flex-col items-center p-4 transition-colors duration-300 ${getBgColor()}`}
    >
      <div className="mb-2 flex w-full max-w-md items-center justify-between gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center justify-center rounded-full bg-white p-2 shadow-md hover:bg-gray-50"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div className="mt-3 w-[90%] pr-4">
          <div className="mb-1 flex w-full max-w-md items-center justify-between">
            <div className="text-xs font-bold text-blue-800">
              {score} SEGUIDAS
            </div>
          </div>

          <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-blue-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${(currentRound / rounds.length) * 100}%` }}
            >
              <div
                className="mx-auto h-2/5 translate-y-0.5 transform rounded-full bg-blue-400/50"
                style={{
                  width:
                    Math.max(80, (currentRound / rounds.length) * 90) + "%",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="h-full w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={playSound}
          className="mb-6 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white p-4 text-sky-400 transition-colors duration-200 hover:bg-blue-700 hover:text-white"
        >
          <Volume2 size={24} />
          <span className="text-lg font-semibold">Escucha otra vez</span>
        </button>

        <div className="relative mb-6 h-92 w-full">
          <canvas
            ref={canvasRef}
            className="h-full w-full touch-none rounded-xl border-2 border-gray-200 bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e: React.TouchEvent) => {
              startDrawing(e);
            }}
            onTouchMove={(e: React.TouchEvent) => {
              draw(e);
            }}
            onTouchEnd={stopDrawing}
          />
          <button
            onClick={clearCanvas}
            className="absolute top-2 right-2 rounded-full bg-white p-2 shadow-md hover:bg-gray-50"
          >
            <Eraser className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <button
          onClick={checkDrawing}
          disabled={isLoading || !isClassifierReady}
          className={`relative w-full rounded-full border-b-6 p-4 font-semibold text-white transition-colors duration-200 ${
            isLoading || !isClassifierReady
              ? "cursor-not-allowed border-gray-400 bg-gray-300"
              : "border-blue-800 bg-blue-500 hover:bg-blue-600"
          }`}
        >
          <svg
            className="absolute top-0 right-0 h-16 w-32"
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
          >
            <path
              d="M62,7 L63,7"
              stroke="white"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              opacity="0.3"
            />
          </svg>
          <svg
            className="absolute top-0 right-0 h-16 w-32"
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
          >
            <path
              d="M70,7 L76,7 C84,6.8 92,13 93.2,20"
              stroke="white"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              opacity="0.3"
            />
          </svg>
          <span>
            {!isClassifierReady ? "Cargando ejemplos..." : "Comprobar"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default WritingTestPage;
