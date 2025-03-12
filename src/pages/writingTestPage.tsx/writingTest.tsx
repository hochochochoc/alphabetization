import React, { useState, useEffect, useRef } from "react";
import { Volume2, ArrowLeft, Eraser, Download } from "lucide-react";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import {
  playCorrectSound,
  playIncorrectSound,
  playEndSound,
} from "../../store/features/audioSlice";

// ML5 type declarations
declare global {
  interface Window {
    ml5: any;
  }
}

interface KNNClassifierResult {
  label: string;
  confidence: number;
  confidences?: { [key: string]: number };
  confidencesByLabel?: { [key: string]: number };
  classIndex?: number;
}

interface KNNClassifier {
  addExample: (features: any, label: string) => void;
  classify: (
    features: any,
    options: any | null,
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
  // { letter: "I", voice: "i" },
  // { letter: "J", voice: "jota" },
  { letter: "K", voice: "ka" },
  { letter: "L", voice: "ele" },
  // { letter: "LL", voice: "eyye" },
  { letter: "M", voice: "eme" },
  // { letter: "N", voice: "ene" },
  // { letter: "Ñ", voice: "eñe" },
  { letter: "O", voice: "o" },
  // { letter: "P", voice: "Ppee" },
  // { letter: "Q", voice: "cu" },
  // { letter: "R", voice: "erre" },
  { letter: "S", voice: "ese" },
  { letter: "T", voice: "te" },
  { letter: "U", voice: "uhhh" },
  { letter: "V", voice: "uve" },
  { letter: "W", voice: "uve doble" },
  { letter: "X", voice: "equis" },
  { letter: "Y", voice: "i griega" },
  { letter: "Z", voice: "zeta" },
];

const WritingTestPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
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
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [examplesLoaded, setExamplesLoaded] = useState<boolean>(false);
  const [showSaveButton, setShowSaveButton] = useState<boolean>(false);
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
        setModelLoading(true);
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
        setModelLoading(false);
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
    setIsLoading(true);

    try {
      // Define all letters we want to load examples for
      const letters = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "K",
        "L",
        "LL",
        "M",
        "N",
        "Ñ",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
      ];

      let totalProcessed = 0;

      // Process each letter
      for (const letter of letters) {
        let index = 1;
        let consecutiveErrors = 0;

        // Keep trying until we get consecutive failures
        while (consecutiveErrors < 1) {
          try {
            const imagePath = `/${letter}${index}.jpg`;
            await loadImageForClassifier(
              imagePath,
              letter,
              featureExtractor,
              knnClassifier,
            );
            totalProcessed++;
            consecutiveErrors = 0; // Reset error counter on success
            index++;
          } catch (error) {
            consecutiveErrors++;
            console.log(`Could not find ${letter}${index}.jpg, skipping`);
            index++;

            // If we've already successfully loaded at least one image and hit 3 errors,
            // assume we're done with this letter
            if (index > 3 && consecutiveErrors >= 3) {
              console.log(`Finished loading examples for ${letter}`);
              break;
            }
          }
        }
      }

      console.log(
        `All example images loaded successfully (${totalProcessed} total)`,
      );
      console.log("Example counts:", knnClassifier.getCount());
      setExamplesLoaded(true);
      setIsClassifierReady(true);
      setIsLoading(false);
      setModelLoading(false);
    } catch (error) {
      console.error("Error loading example images:", error);
      setIsLoading(false);
      setModelLoading(false);
    }
  };

  // Function to load an image and add it to the classifier
  const loadImageForClassifier = (
    imagePath: string,
    letterLabel: string,
    featureExtractor: FeatureExtractor,
    knnClassifier: KNNClassifier,
  ): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          // Extract features from the image
          const features = featureExtractor.infer(img);
          // Add the features to the classifier with the letter as the label
          knnClassifier.addExample(features, letterLabel);
          console.log(`Loaded: ${imagePath} as ${letterLabel}`);
          resolve();
        } catch (err) {
          console.error(`Error processing image ${imagePath}:`, err);
          reject(err);
        }
      };
      img.onerror = () => {
        reject(new Error(`Failed to load image ${imagePath}`));
      };
      img.src = imagePath;
    });
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
            dispatch(playEndSound());
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
    setShowSaveButton(false);

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

  const saveDrawing = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas with white background
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Match dimensions of original canvas
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    // Fill with white background
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the original canvas content on top
    tempCtx.drawImage(canvas, 0, 0);

    // Create a link element to trigger download
    const link = document.createElement("a");
    link.download = `${rounds[currentRound].letter}.jpg`;
    link.href = tempCanvas.toDataURL("image/jpeg", 0.9);
    link.click();
  };

  // Helper function to process the classification result
  const processClassificationResult = (result: KNNClassifierResult): void => {
    const targetLetter = rounds[currentRound].letter;
    const confidences = result.confidencesByLabel || {};
    const targetConfidence = confidences[targetLetter] || 0;

    // Get best match
    let bestMatch = { letter: "", confidence: 0 };
    Object.entries(confidences).forEach(([letter, confidence]) => {
      if (confidence > bestMatch.confidence) {
        bestMatch = { letter, confidence: confidence };
      }
    });

    console.log(
      `Target: ${targetLetter}, Best match: ${bestMatch.letter} (${bestMatch.confidence.toFixed(2)})`,
    );

    const isCorrect = targetConfidence > 0.4;

    setResult(isCorrect ? "correct" : "incorrect");
    if (isCorrect) {
      dispatch(playCorrectSound());
      setScore((prev) => prev + 1);
      setTotalCorrect((prev) => prev + 1);
      setShowSaveButton(false);
    } else {
      dispatch(playIncorrectSound());
      setScore(0);
      setShowSaveButton(true);
    }
    setIsLoading(false);
  };

  const checkDrawing = async (): Promise<void> => {
    if (!classifier || !isClassifierReady || !examplesLoaded) return;
    setIsLoading(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      // Preprocess the image
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 224;
      tempCanvas.height = 224;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) throw new Error("Could not create temp canvas context");

      // Fill white background
      tempCtx.fillStyle = "white";
      tempCtx.fillRect(0, 0, 224, 224);

      // Process image boundaries and center it
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

      // Add padding and center the drawing
      const padding = 20;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = Math.min(canvas.width, maxX + padding);
      maxY = Math.min(canvas.height, maxY + padding);

      const drawingWidth = maxX - minX;
      const drawingHeight = maxY - minY;
      const size = Math.max(drawingWidth, drawingHeight);
      const scale = Math.min(180 / size, 1);
      const centerX = 112 - (drawingWidth / 2) * scale;
      const centerY = 112 - (drawingHeight / 2) * scale;

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

      // Classify with original k value (default is 3)
      const dataURL = tempCanvas.toDataURL("image/jpeg", 1.0);
      const img = new Image();
      img.onload = () => {
        const features = classifier.featureExtractor.infer(img);

        // First try with k=3 (default)
        classifier.knn.classify(
          features,
          { k: 5 }, // Explicitly set k=3
          (error: Error | null, result?: KNNClassifierResult) => {
            if (error || !result) {
              setResult("incorrect");
              setIsLoading(false);
              return;
            }

            console.log("Result with k=3:", result);
            const confidences = result.confidencesByLabel || {};
            const targetLetter = rounds[currentRound].letter;

            // Check if there's a tie (multiple letters with same confidence)
            const confidenceValues = Object.values(confidences);
            const uniqueConfidences = new Set(confidenceValues).size;
            const targetConfidence = confidences[targetLetter] || 0;

            // If there's a tie and the target letter has some confidence, try with k=1
            if (
              uniqueConfidences < Object.keys(confidences).length &&
              confidenceValues.some(
                (v) => Math.abs(v - targetConfidence) < 0.001,
              ) &&
              targetConfidence > 0
            ) {
              console.log(
                "Possible tie detected. Trying with k=1 for tie-breaking",
              );

              // Try again with k=1 to break the tie
              classifier.knn.classify(
                features,
                { k: 1 }, // Use k=1 for tie-breaking
                (error2: Error | null, result2?: KNNClassifierResult) => {
                  if (error2 || !result2) {
                    // Fall back to original result
                    processClassificationResult(result);
                    return;
                  }

                  console.log("Result with k=1:", result2);
                  processClassificationResult(result2);
                },
              );
            } else {
              // No tie, or target letter not in tie, use the initial result
              processClassificationResult(result);
            }
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

  // CSS class for shimmer effect
  const skeletonClass = "animate-pulse bg-gray-300";

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
              setShowSaveButton(false);
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
      {/* Top navigation bar */}
      <div className="mb-2 flex w-full max-w-md items-center justify-between gap-4">
        {modelLoading ? (
          // Shimmer effect for back button
          <div
            className={`h-10 w-10 rounded-full bg-gray-200 ${skeletonClass}`}
          ></div>
        ) : (
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center rounded-full bg-white p-2 shadow-md hover:bg-gray-50"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
        )}

        <div className="mt-3 w-[90%] pr-4">
          {modelLoading ? (
            <>
              {/* Shimmer effect for score indicator */}
              <div
                className={`mb-2 h-4 w-24 bg-gray-200 ${skeletonClass}`}
              ></div>
              {/* Shimmer effect for progress bar */}
              <div
                className={`mb-4 h-3 w-full rounded-full bg-gray-200 ${skeletonClass}`}
              ></div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="h-full w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {modelLoading ? (
          <>
            {/* Shimmer effect for sound button */}
            <div
              className={`mb-6 h-14 w-full rounded-xl bg-gray-200 ${skeletonClass}`}
            ></div>

            {/* Shimmer effect for canvas */}
            <div
              className={`relative mb-6 h-92 w-full rounded-xl bg-gray-200 ${skeletonClass}`}
            ></div>

            {/* Shimmer effect for check button */}
            <div
              className={`h-14 w-full rounded-full bg-gray-200 ${skeletonClass}`}
            ></div>
          </>
        ) : (
          <>
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

              {/* Download button */}
              {showSaveButton && (
                <div className="absolute right-4 bottom-4 animate-[fadeIn_0.3s_ease-in-out]">
                  <button
                    onClick={saveDrawing}
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2 font-medium text-white shadow-lg hover:bg-blue-600"
                  >
                    <Download size={18} />
                    <span>Guardar</span>
                  </button>
                </div>
              )}
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
                {isLoading
                  ? "Procesando..."
                  : !isClassifierReady
                    ? "Cargando modelo..."
                    : "Comprobar"}
              </span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default WritingTestPage;
