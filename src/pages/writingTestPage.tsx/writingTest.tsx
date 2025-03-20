import React, { useState, useEffect, useRef } from "react";
import { Volume2, ArrowLeft, Eraser } from "lucide-react";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import {
  playCorrectSound,
  playIncorrectSound,
  playEndSound,
} from "../../store/features/audioSlice";
import { chatgptHandler } from "../../utils/chatGPTHandler";

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
  { letter: "LL", voice: "eyye" },
  { letter: "M", voice: "eme" },
  { letter: "N", voice: "ene" },
  { letter: "Ñ", voice: "eñe" },
  { letter: "O", voice: "o" },
  { letter: "P", voice: "Ppee" },
  { letter: "Q", voice: "cu" },
  { letter: "R", voice: "erre" },
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
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [rounds, setRounds] = useState<SpanishLetter[]>(
    Array(8)
      .fill(null)
      .map(
        () => spanishLetters[Math.floor(Math.random() * spanishLetters.length)],
      ),
  );
  const [examplesLoaded, setExamplesLoaded] = useState<boolean>(false);

  // Constant for drawing line width
  const LINE_WIDTH = 8;

  useEffect(() => {
    const initializeHandler = async (): Promise<void> => {
      try {
        setModelLoading(true);
        console.log("Initializing ChatGPT handler");

        try {
          await chatgptHandler.initialize();
          setExamplesLoaded(true);
          setModelLoading(false);
        } catch (error) {
          console.error("Error initializing ChatGPT handler:", error);
          setModelLoading(false);
        }
      } catch (error) {
        console.error("Error initializing handler:", error);
        setModelLoading(false);
      }
    };

    initializeHandler();
  }, []);

  const polly = new PollyClient({
    region: import.meta.env.VITE_AWS_REGION || "eu-west-3",
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
    },
  });

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
  }, [result, currentRound, rounds.length, dispatch]);

  // Function to set up context properties
  const setupContext = (): CanvasRenderingContext2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Set the drawing properties
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    return ctx;
  };

  // Initialize canvas with proper dimensions and context
  const initCanvas = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    // Always set dimensions to ensure proper scaling
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Get a fresh context and set it up
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = LINE_WIDTH;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  };

  useEffect(() => {
    // Initialize canvas with a small delay to ensure proper rendering
    setTimeout(() => {
      initCanvas();
    }, 100);

    const canvas = canvasRef.current;
    if (canvas) {
      // Disable default touch behavior for the entire canvas
      canvas.style.touchAction = "none";
    }

    // Handle resize events
    const handleResize = () => {
      initCanvas();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const clearCanvas = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get a fresh context after clearing
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Explicitly reset all drawing properties
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent): void => {
    setIsDrawing(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Ensure context is properly set up
    const ctx = setupContext();
    if (!ctx) return;

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

    // Always set the lineWidth to ensure consistency
    ctx.lineWidth = LINE_WIDTH;

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
    // Check if the handler is initialized
    if (!chatgptHandler.isInitialized()) return;

    setIsLoading(true);

    try {
      const canvas = canvasRef.current;
      if (!canvas) throw new Error("Canvas not found");

      const isCorrect = await chatgptHandler.analyzeDrawing(
        canvas,
        rounds[currentRound].letter,
      );

      setResult(isCorrect ? "correct" : "incorrect");

      if (isCorrect) {
        dispatch(playCorrectSound());
        setScore((prev) => prev + 1);
        setTotalCorrect((prev) => prev + 1);
      } else {
        dispatch(playIncorrectSound());
        setScore(0);
      }

      // Send session data to the server
      try {
        await fetch("http://localhost:3001/api/session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target_letter: rounds[currentRound].letter,
            options: [rounds[currentRound].letter], // In writing test there are no options to choose from
            user_answer: rounds[currentRound].letter, // The user's attempted letter is the target letter
            correct: isCorrect,
            exercise_type: "writing",
          }),
        });
      } catch (error) {
        console.error("Error saving writing session:", error);
      }
    } catch (error) {
      console.error("Error checking drawing:", error);
      setResult("incorrect");
    } finally {
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
            </div>

            <button
              onClick={checkDrawing}
              disabled={isLoading || !examplesLoaded}
              className={`relative w-full rounded-full border-b-6 p-4 font-semibold text-white transition-colors duration-200 ${
                isLoading || !examplesLoaded
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
                  : !examplesLoaded
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
