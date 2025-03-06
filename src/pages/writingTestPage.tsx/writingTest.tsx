import React, { useState, useEffect, useRef } from "react";
import { Volume2, ArrowLeft, Eraser } from "lucide-react";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { useNavigate } from "react-router-dom";

// ML5 type declarations
declare global {
  interface Window {
    ml5: any;
  }
}

interface KNNClassifierResult {
  label: string;
  confidence: number;
  // Optional fields that may exist in newer ml5 versions
  confidences?: { [key: string]: number };
  confidencesByLabel?: { [key: string]: number };
  classIndex?: number;
}

interface KNNClassifier {
  addExample: (features: any, label: string) => void;
  classify: (
    features: any,
    callback: (error: Error | null, result?: KNNClassifierResult) => void,
  ) => void;
  getCount: () => { [key: string]: number };
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
  // { letter: "D", voice: "de" },
  { letter: "E", voice: "E" },
  { letter: "F", voice: "efe" },
  // { letter: "G", voice: "ge" },
  // { letter: "H", voice: "hache" },
  { letter: "I", voice: "i" },
  // { letter: "J", voice: "jota" },
  { letter: "K", voice: "ka" },
  { letter: "L", voice: "ele" },
  { letter: "M", voice: "eme" },
  // { letter: "N", voice: "ene" },
  { letter: "O", voice: "o" },
  // { letter: "P", voice: "pe" },
  { letter: "Q", voice: "cu" },
  // { letter: "R", voice: "erre" },
  { letter: "S", voice: "ese" },
  { letter: "T", voice: "te" },
  // { letter: "U", voice: "u" },
  // { letter: "V", voice: "uve" },
  // { letter: "W", voice: "uve doble" },
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
  const [examplesLoaded, setExamplesLoaded] = useState<boolean>(false);
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
      // Define the sample images we want to load
      const sampleImages = [
        // A
        { path: "/A1.jpg", letter: "A" },
        { path: "/A2.jpg", letter: "A" },
        { path: "/A3.jpg", letter: "A" },
        // B
        { path: "/B1.jpg", letter: "B" },
        { path: "/B2.jpg", letter: "B" },
        { path: "/B3.jpg", letter: "B" },
        { path: "/B4.jpg", letter: "B" },
        { path: "/B5.jpg", letter: "B" },
        { path: "/B6.jpg", letter: "B" },
        { path: "/B7.jpg", letter: "B" },
        { path: "/B8.jpg", letter: "B" },
        // C
        { path: "/C1.jpg", letter: "C" },
        { path: "/C2.jpg", letter: "C" },
        { path: "/C3.jpg", letter: "C" },
        { path: "/C4.jpg", letter: "C" },
        { path: "/C5.jpg", letter: "C" },
        // D
        // E
        { path: "/E1.jpg", letter: "E" },
        { path: "/E2.jpg", letter: "E" },
        { path: "/E3.jpg", letter: "E" },
        { path: "/E4.jpg", letter: "E" },
        { path: "/E5.jpg", letter: "E" },
        { path: "/E6.jpg", letter: "E" },
        // F
        { path: "/F1.jpg", letter: "F" },
        { path: "/F2.jpg", letter: "F" },
        { path: "/F3.jpg", letter: "F" },
        { path: "/F4.jpg", letter: "F" },
        { path: "/F5.jpg", letter: "F" },
        { path: "/F6.jpg", letter: "F" },
        // G
        // H
        // I
        { path: "/I1.jpg", letter: "I" },
        { path: "/I2.jpg", letter: "I" },
        { path: "/I3.jpg", letter: "I" },
        // J
        // { path: "/J1.jpg", letter: "J" },
        // { path: "/J2.jpg", letter: "J" },
        // { path: "/J3.jpg", letter: "J" },
        // { path: "/J4.jpg", letter: "J" },
        // { path: "/J5.jpg", letter: "J" },
        // { path: "/J6.jpg", letter: "J" },
        // K
        { path: "/K1.jpg", letter: "K" },
        { path: "/K2.jpg", letter: "K" },
        { path: "/K3.jpg", letter: "K" },
        { path: "/K4.jpg", letter: "K" },
        { path: "/K5.jpg", letter: "K" },
        // L
        { path: "/L1.jpg", letter: "L" },
        { path: "/L2.jpg", letter: "L" },
        { path: "/L3.jpg", letter: "L" },
        { path: "/L4.jpg", letter: "L" },
        // M
        { path: "/M1.jpg", letter: "M" },
        { path: "/M2.jpg", letter: "M" },
        { path: "/M3.jpg", letter: "M" },
        { path: "/M4.jpg", letter: "M" },
        // N
        // Ñ
        // O
        { path: "/O1.jpg", letter: "O" },
        { path: "/O2.jpg", letter: "O" },
        { path: "/O3.jpg", letter: "O" },
        { path: "/O4.jpg", letter: "O" },
        { path: "/O5.jpg", letter: "O" },
        // P
        // Q
        { path: "/Q1.jpg", letter: "Q" },
        { path: "/Q2.jpg", letter: "Q" },
        { path: "/Q3.jpg", letter: "Q" },
        { path: "/Q4.jpg", letter: "Q" },
        { path: "/Q5.jpg", letter: "Q" },
        { path: "/Q6.jpg", letter: "Q" },
        { path: "/Q7.jpg", letter: "Q" },
        { path: "/Q8.jpg", letter: "Q" },
        { path: "/Q9.jpg", letter: "Q" },
        // R
        // S
        { path: "/S1.jpg", letter: "S" },
        { path: "/S2.jpg", letter: "S" },
        { path: "/S3.jpg", letter: "S" },
        { path: "/S4.jpg", letter: "S" },
        { path: "/S5.jpg", letter: "S" },
        // T
        { path: "/T1.jpg", letter: "T" },
        { path: "/T2.jpg", letter: "T" },
        { path: "/T3.jpg", letter: "T" },
        { path: "/T4.jpg", letter: "T" },
        // U
        // V
        // W
        // X
        { path: "/X1.jpg", letter: "X" },
        { path: "/X2.jpg", letter: "X" },
        { path: "/X3.jpg", letter: "X" },
        { path: "/X4.jpg", letter: "X" },
        { path: "/X5.jpg", letter: "X" },
        // Y
        { path: "/Y1.jpg", letter: "Y" },
        { path: "/Y2.jpg", letter: "Y" },
        { path: "/Y3.jpg", letter: "Y" },
        { path: "/Y4.jpg", letter: "Y" },
        { path: "/Y5.jpg", letter: "Y" },
        // Z
        { path: "/Z1.jpg", letter: "Z" },
        { path: "/Z2.jpg", letter: "Z" },
        { path: "/Z3.jpg", letter: "Z" },
        { path: "/Z4.jpg", letter: "Z" },
        { path: "/Z5.jpg", letter: "Z" },
      ];

      let loadedCount = 0;
      const totalImages = sampleImages.length;

      // Function to load an image and add it to the classifier
      const loadImageForClassifier = (
        imagePath: string,
        letterLabel: string,
      ) => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            try {
              // Extract features from the image
              const features = featureExtractor.infer(img);
              // Add the features to the classifier with the letter as the label
              knnClassifier.addExample(features, letterLabel);
              loadedCount++;
              console.log(
                `Loaded ${loadedCount}/${totalImages}: ${imagePath} as ${letterLabel}`,
              );
              resolve();
            } catch (err) {
              console.error(`Error processing image ${imagePath}:`, err);
              reject(err);
            }
          };
          img.onerror = (err) => {
            console.error(`Failed to load image ${imagePath}:`, err);
            reject(new Error(`Failed to load image ${imagePath}`));
          };
          img.src = imagePath;
        });
      };

      // Load all sample images
      for (const sample of sampleImages) {
        await loadImageForClassifier(sample.path, sample.letter);
      }

      console.log("All example images loaded successfully");
      console.log("Example counts:", knnClassifier.getCount());
      setExamplesLoaded(true);
      setIsClassifierReady(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading example images:", error);
      setIsLoading(false);
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
        } else {
          clearCanvas();
          playSound();
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

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 5;
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
    if (!classifier || !isClassifierReady || !examplesLoaded) return;
    setIsLoading(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      // Normalize drawing to match training examples
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 224; // MobileNet input size
      tempCanvas.height = 224;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) throw new Error("Could not create temp canvas context");

      // Fill white background
      tempCtx.fillStyle = "white";
      tempCtx.fillRect(0, 0, 224, 224);

      // Center and scale the drawing
      const originalCtx = canvas.getContext("2d");
      if (!originalCtx) throw new Error("Could not get canvas context");

      const pixels = originalCtx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      );

      // Find drawing boundaries
      let minX = canvas.width,
        maxX = 0,
        minY = canvas.height,
        maxY = 0;
      let hasDrawing = false;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (pixels.data[i + 3] > 0 && pixels.data[i] < 250) {
            // Alpha > 0 and not white
            hasDrawing = true;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }

      if (!hasDrawing) {
        console.log("No drawing detected");
        setResult("incorrect");
        setIsLoading(false);
        return;
      }

      // Add padding
      const padding = 20;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width, maxX + padding);
      maxY = Math.min(canvas.height, maxY + padding);

      // Center the drawing
      const drawingWidth = maxX - minX;
      const drawingHeight = maxY - minY;
      const size = Math.max(drawingWidth, drawingHeight);
      const scale = Math.min(180 / size, 1); // Leave room for 224×224
      const centerX = 112 - (drawingWidth / 2) * scale;
      const centerY = 112 - (drawingHeight / 2) * scale;

      // Draw with thicker lines
      tempCtx.drawImage(
        canvas,
        minX,
        minY,
        drawingWidth,
        drawingHeight,
        centerX,
        centerY,
        drawingWidth * scale,
        drawingHeight * scale,
      );

      // Classify the normalized image
      const dataURL = tempCanvas.toDataURL("image/jpeg", 1.0);
      const img = new Image();
      img.onload = () => {
        const features = classifier.featureExtractor.infer(img);
        classifier.knn.classify(
          features,
          (error: Error | null, result?: KNNClassifierResult) => {
            if (error || !result) {
              setResult("incorrect");
              setIsLoading(false);
              return;
            }

            console.log("Raw result:", JSON.stringify(result));
            const targetLetter = rounds[currentRound].letter;
            const confidences = result.confidencesByLabel || {};
            const targetConfidence = confidences[targetLetter] || 0;

            const isCorrect = targetConfidence > 0.4;

            setResult(isCorrect ? "correct" : "incorrect");
            if (isCorrect) {
              setScore((prev) => prev + 1);
              setTotalCorrect((prev) => prev + 1);
            } else {
              setScore(0);
            }
            setIsLoading(false);
          },
        );
      };
      img.src = dataURL;
    } catch (error) {
      console.error("Error:", error);
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
              setTimeout(() => {
                clearCanvas();
                initCanvas();
              }, 0);
            }}
            className="rounded-xl border-b-6 border-blue-800 bg-blue-500 px-8 py-4 font-semibold text-white transition-all duration-200 active:mt-1 active:translate-y-1 active:border-b-2"
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
