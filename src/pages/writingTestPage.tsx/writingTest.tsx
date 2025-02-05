import React, { useState, useEffect, useRef } from "react";
import { Volume2, ArrowLeft, Eraser } from "lucide-react";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import {
  TextractClient,
  DetectDocumentTextCommand,
} from "@aws-sdk/client-textract";
import { useNavigate } from "react-router-dom";

const LETTER_PATTERNS = {
  A: /^[AaÁáÀà@4]+$/,
  B: /^[Bb8ß]+$/,
  C: /^[Cc¢€]+$/,
  D: /^[Dd]+$/,
  E: /^[EeÉéÈè3€]+$/,
  F: /^[Ff]+$/,
  G: /^[Gg6]+$/,
  H: /^[Hh]+$/,
  I: /^[IiÍíÌì1|l]+$/,
  J: /^[Jj]+$/,
  K: /^[Kk]+$/,
  L: /^[Ll1|I]+$/,
  LL: /^(LL|ll|Ll|lL)+$/,
  M: /^[Mm]+$/,
  N: /^[Nn]+$/,
  Ñ: /^[Ññ]+$/,
  O: /^[OoÓóÒò0Q]+$/,
  P: /^[Pp]+$/,
  Q: /^[Qq]+$/,
  R: /^[Rr]+$/,
  S: /^[Ss5\$]+$/,
  T: /^[Tt7]+$/,
  U: /^[UuÚúÙù]+$/,
  V: /^[Vv]+$/,
  W: /^[Ww]+$/,
  X: /^[Xx×]+$/,
  Y: /^[Yy]+$/,
  Z: /^[Zz2]+$/,
};

const spanishLetters = [
  { letter: "A", voice: "A" },
  { letter: "B", voice: "be" },
  { letter: "C", voice: "ce" },
  { letter: "D", voice: "de" },
  { letter: "E", voice: "E" },
  { letter: "F", voice: "efe" },
  { letter: "G", voice: "ge" },
  { letter: "H", voice: "hache" },
  { letter: "I", voice: "I" },
  { letter: "J", voice: "jota" },
  { letter: "K", voice: "ka" },
  { letter: "L", voice: "ele" },
  { letter: "LL", voice: "eyye" },
  { letter: "M", voice: "eme" },
  { letter: "N", voice: "ene" },
  { letter: "Ñ", voice: "eñe" },
  { letter: "O", voice: "O" },
  { letter: "P", voice: "pe" },
  { letter: "Q", voice: "cu" },
  { letter: "R", voice: "erre" },
  { letter: "S", voice: "ese" },
  { letter: "T", voice: "te" },
  { letter: "U", voice: "U" },
  { letter: "V", voice: "uve" },
  { letter: "W", voice: "uve doble" },
  { letter: "X", voice: "equis" },
  { letter: "Y", voice: "i griega" },
  { letter: "Z", voice: "zeta" },
];

const WritingTestPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rounds, setRounds] = useState(
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

  const textract = new TextractClient({
    region: import.meta.env.VITE_AWS_REGION || "eu-west-3",
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
    },
  });

  const playSound = async () => {
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

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();

    const size = Math.min(rect.width, rect.height);

    canvas.width = size;
    canvas.height = size;

    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  useEffect(() => {
    initCanvas();
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("touchstart", (e) => e.preventDefault(), {
        passive: false,
      });
      canvas.addEventListener("touchmove", (e) => e.preventDefault(), {
        passive: false,
      });
    }
    window.addEventListener("resize", initCanvas);
    return () => {
      if (canvas) {
        canvas.removeEventListener("touchstart", (e) => e.preventDefault());
        canvas.removeEventListener("touchmove", (e) => e.preventDefault());
      }
      window.removeEventListener("resize", initCanvas);
    };
  }, []);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
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

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
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

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const checkDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsLoading(true);

    try {
      const dataUrl = canvas.toDataURL("image/jpeg");
      const binaryData = atob(dataUrl.split(",")[1]);
      const array = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        array[i] = binaryData.charCodeAt(i);
      }

      const command = new DetectDocumentTextCommand({
        Document: { Bytes: array },
      });

      const response = await textract.send(command);
      const detectedText =
        response.Blocks?.find((block) => block.BlockType === "LINE")?.Text ||
        "";

      const pattern =
        LETTER_PATTERNS[
          rounds[currentRound].letter as keyof typeof LETTER_PATTERNS
        ];
      const isCorrect = pattern ? pattern.test(detectedText.trim()) : false;

      setResult(isCorrect ? "correct" : "incorrect");
      if (isCorrect) {
        setScore(score + 1);
      } else {
        setScore(0);
        clearCanvas();
      }
    } catch (error) {
      console.error(error);
      setResult("incorrect");
    } finally {
      setIsLoading(false);
    }
  };

  const getBgColor = () => {
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
            Has completado el ejercicio con {score} respuestas correctas.
          </p>
          <button
            onClick={() => {
              setCurrentRound(0);
              setScore(0);
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
          onClick={() => navigate("/menu")}
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

        <div className="relative mb-6 aspect-square w-full">
          <canvas
            ref={canvasRef}
            className="w-full touch-none rounded-xl border-2 border-gray-200 bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={(e) => {
              e.preventDefault();
              startDrawing(e);
            }}
            onTouchMove={(e) => {
              e.preventDefault();
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
          disabled={isLoading}
          className={`w-full rounded-xl p-4 font-semibold text-white transition-colors duration-200 ${
            isLoading
              ? "cursor-not-allowed bg-gray-300"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isLoading ? "Analizando..." : "Comprobar"}
        </button>
      </div>
    </div>
  );
};

export default WritingTestPage;
