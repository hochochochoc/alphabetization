import React, { useState, useEffect, useRef } from "react";
import { Volume2, ArrowLeft, Eraser } from "lucide-react";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { createWorker, PSM } from "tesseract.js";
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
  // { letter: "I", voice: "I" },
  // { letter: "J", voice: "jota" },
  { letter: "K", voice: "ka" },
  // { letter: "L", voice: "ele" },
  { letter: "LL", voice: "eyye" },
  { letter: "M", voice: "eme" },
  { letter: "N", voice: "ene" },
  // { letter: "Ñ", voice: "eñe" },
  // { letter: "O", voice: "O" },
  { letter: "P", voice: "pe" },
  // { letter: "Q", voice: "cu" },
  { letter: "R", voice: "erre" },
  { letter: "S", voice: "ese" },
  { letter: "T", voice: "te" },
  // { letter: "U", voice: "U" },
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
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tesseractWorker, setTesseractWorker] = useState<any>(null);
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

  // Initialize Tesseract worker
  useEffect(() => {
    const initTesseract = async () => {
      try {
        const worker = await createWorker();

        // Use the correct initialization method for current API
        await worker.load();
        await worker.reinitialize("spa");

        // Use the PSM enum for proper typing
        await worker.setParameters({
          tessedit_char_whitelist:
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁáÀàÉéÈèÍíÌìÓóÒòÚúÙùÑñ0123456789",
          tessjs_create_hocr: "0",
          tessjs_create_tsv: "0",
          tessedit_pageseg_mode: PSM.SINGLE_CHAR,
          tessedit_ocr_engine_mode: 1, // Neural net LSTM engine
          preserve_interword_spaces: "0",
          textord_heavy_noise: "1",
          tessedit_write_images: "1",
        });

        setTesseractWorker(worker);
      } catch (err) {
        console.error("Tesseract init error:", err);
      }
    };

    initTesseract();

    return () => {
      if (tesseractWorker) tesseractWorker.terminate();
    };
  }, []);

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

  const preprocessImage = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return canvas;

    // White background
    tempCtx.fillStyle = "white";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    // Much more dramatic thickening and contrast
    tempCtx.globalAlpha = 1.0;
    tempCtx.drawImage(tempCanvas, 0, 0);
    tempCtx.drawImage(tempCanvas, 1, 0);
    tempCtx.drawImage(tempCanvas, 0, 1);
    tempCtx.drawImage(tempCanvas, -1, 0);
    tempCtx.drawImage(tempCanvas, 0, -1);

    // Max contrast
    const imageData = tempCtx.getImageData(
      0,
      0,
      tempCanvas.width,
      tempCanvas.height,
    );
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      // Very aggressive threshold
      if (data[i] < 230 || data[i + 1] < 230 || data[i + 2] < 230) {
        data[i] = 0;
        data[i + 1] = 0;
        data[i + 2] = 0;
        data[i + 3] = 255;
      } else {
        data[i] = 255;
        data[i + 1] = 255;
        data[i + 2] = 255;
        data[i + 3] = 255;
      }
    }
    tempCtx.putImageData(imageData, 0, 0);

    return tempCanvas;
  };

  const checkDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !tesseractWorker) return;

    setIsLoading(true);

    try {
      // Preprocess the canvas for better recognition
      const processedCanvas = preprocessImage(canvas);
      const dataUrl = processedCanvas.toDataURL("image/jpeg", 1.0);

      // Try different recognition strategies
      const result = await tesseractWorker.recognize(dataUrl);
      let detectedText = result.data.text.trim();

      // If no text detected, try more aggressive processing
      if (!detectedText && processedCanvas !== canvas) {
        // Create a thicker version
        const ctx = processedCanvas.getContext("2d");
        if (ctx) {
          ctx.globalCompositeOperation = "source-over";
          ctx.drawImage(processedCanvas, 1, 1);
          ctx.drawImage(processedCanvas, -1, -1);
          const secondAttempt = await tesseractWorker.recognize(
            processedCanvas.toDataURL("image/jpeg", 1.0),
          );
          detectedText = secondAttempt.data.text.trim();
        }
      }

      // More lenient matching - remove non-alphanumeric characters
      detectedText = detectedText.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "");

      // Check if the detected text matches the expected pattern
      const pattern =
        LETTER_PATTERNS[
          rounds[currentRound].letter as keyof typeof LETTER_PATTERNS
        ];
      const isCorrect = pattern ? pattern.test(detectedText) : false;

      setResult(isCorrect ? "correct" : "incorrect");
      if (isCorrect) {
        setScore(score + 1);
        setTotalCorrect((prev) => prev + 1);
      } else {
        setScore(0);
        clearCanvas();
      }
    } catch (error) {
      console.error("Error recognizing text:", error);
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
                const canvas = canvasRef.current;
                if (!canvas) return;
                const ctx = canvas.getContext("2d");
                if (!ctx) return;
                ctx.strokeStyle = "#2563eb";
                ctx.lineWidth = 6;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
              }, 0);
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
              startDrawing(e as unknown as React.TouchEvent | React.MouseEvent);
            }}
            onTouchMove={(e: React.TouchEvent) => {
              draw(e as unknown as React.TouchEvent | React.MouseEvent);
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
          className={`relative w-full rounded-full border-b-6 p-4 font-semibold text-white transition-colors duration-200 ${
            isLoading
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
          <span>Comprobar</span>
        </button>
      </div>
    </div>
  );
};

export default WritingTestPage;
