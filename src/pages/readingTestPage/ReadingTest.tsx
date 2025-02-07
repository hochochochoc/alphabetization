import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Mic } from "lucide-react";

import { useNavigate } from "react-router-dom";

const LETTER_PRONUNCIATIONS = {
  A: /^(ah?|ey?)$/i,
  B: /^(beh?)$/i,
  C: /^(seh?)$/i,
  D: /^(deh?)$/i,
  E: /^(eh?)$/i,
  F: /^(eh?feh?|f)$/i,
  G: /^(heh?)$/i,
  H: /^(ah?cheh?|h)$/i,
  K: /^(kah?)$/i,
  L: /^(eh?leh?)$/i,
  LL: /^(eh?yeh?)$/i,
  M: /^(eh?meh?)$/i,
  N: /^(eh?neh?)$/i,
  P: /^(peh?)$/i,
  R: /^(eh?reh?|r)$/i,
  S: /^(eh?seh?)$/i,
  T: /^(teh?)$/i,
  V: /^(oo?veh?)$/i,
  W: /^(oo?veh? doh?bleh?|w)$/i,
  X: /^(eh?kees|x)$/i,
  Y: /^(ee?gree?eh?gah?|y)$/i,
  Z: /^(seh?tah?|z)$/i,
};

const spanishLetters = [
  //   { letter: "A", voice: "A" },
  //   { letter: "B", voice: "be" },
  //   { letter: "C", voice: "ce" },
  //   { letter: "D", voice: "de" },
  //   { letter: "E", voice: "E" },
  { letter: "F", voice: "efe" },
  //   { letter: "G", voice: "ge" },
  { letter: "H", voice: "hache" },
  //   { letter: "K", voice: "ka" },
  //   { letter: "L", voice: "ele" },
  //   { letter: "LL", voice: "eyye" },
  //   { letter: "M", voice: "eme" },
  //   { letter: "N", voice: "ene" },
  //   { letter: "P", voice: "pe" },
  { letter: "R", voice: "erre" },
  //   { letter: "S", voice: "ese" },
  //   { letter: "T", voice: "te" },
  //   { letter: "V", voice: "uve" },
  { letter: "W", voice: "uve doble" },
  { letter: "X", voice: "equis" },
  { letter: "Y", voice: "i griega" },
  { letter: "Z", voice: "zeta" },
];

const MIN_RECORDING_TIME = 500;
const MAX_RECORDING_TIME = 5000;

const ReadingTestPage = () => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [rounds, setRounds] = useState(
    Array(8)
      .fill(null)
      .map(
        () => spanishLetters[Math.floor(Math.random() * spanishLetters.length)],
      ),
  );

  useEffect(() => {
    return () => {
      // Cleanup function to stop recording when component unmounts
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
        if (result === "correct") {
          if (currentRound === rounds.length - 1) {
            setIsGameComplete(true);
          } else {
            setCurrentRound((prev) => prev + 1);
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [result, currentRound, rounds.length]);

  const initializeRecognition = () => {
    if (recognitionRef.current) return;

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log("Detected:", transcript);

      const currentLetter = rounds[currentRound].letter;
      const pattern =
        LETTER_PRONUNCIATIONS[
          currentLetter as keyof typeof LETTER_PRONUNCIATIONS
        ];

      if (!pattern) {
        console.error("No pattern found for letter:", currentLetter);
        setResult("incorrect");
        return;
      }

      const isCorrect = pattern.test(transcript);
      console.log("Result:", isCorrect ? "correct" : "incorrect");
      setResult(isCorrect ? "correct" : "incorrect");

      if (isCorrect) {
        setScore((prev) => prev + 1);
        setTotalCorrect((prev) => prev + 1);
      } else {
        setScore(0);
      }
    };

    recognition.onend = () => {
      const recordingDuration = recordingStartTimeRef.current
        ? Date.now() - recordingStartTimeRef.current
        : 0;

      if (recordingDuration < MIN_RECORDING_TIME) {
        // If recording was too short, don't count it as an attempt
        setIsRecording(false);
        setIsLoading(false);
        return;
      }

      setIsRecording(false);
      setIsLoading(false);
      recordingStartTimeRef.current = null;
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        // Handle no speech detected differently
        console.log("No speech detected");
        setIsRecording(false);
        setIsLoading(false);
        return;
      }

      console.error("Speech recognition error:", event.error);
      setResult("incorrect");
      setIsLoading(false);
    };

    recognitionRef.current = recognition;
  };

  const startRecording = async (): Promise<void> => {
    if (isRecording || isLoading) return;

    setIsLoading(true);
    initializeRecognition();

    try {
      recordingStartTimeRef.current = Date.now();
      recognitionRef.current.start();
      setIsRecording(true);
      setIsLoading(false);

      // Set maximum recording time
      recordingTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current && isRecording) {
          recognitionRef.current.stop();
        }
      }, MAX_RECORDING_TIME);
    } catch (error) {
      console.error("Error starting recognition:", error);
      setIsLoading(false);
      setIsRecording(false);
    }
  };

  const stopRecording = (): void => {
    if (!isRecording) return;

    const recordingDuration = recordingStartTimeRef.current
      ? Date.now() - recordingStartTimeRef.current
      : 0;

    if (recordingDuration < MIN_RECORDING_TIME) {
      // If recording was too short, wait a bit before stopping
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
      }, MIN_RECORDING_TIME - recordingDuration);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
  };

  const getBgColor = () => {
    if (result === "correct") return "bg-green-100";
    if (result === "incorrect") return "bg-red-100";
    return "bg-gradient-to-br from-blue-100 to-white";
  };

  const resetGame = () => {
    setCurrentRound(0);
    setScore(0);
    setTotalCorrect(0);
    setIsGameComplete(false);
    setRounds(
      Array(8)
        .fill(null)
        .map(
          () =>
            spanishLetters[Math.floor(Math.random() * spanishLetters.length)],
        ),
    );
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
            onClick={resetGame}
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
        <div className="mt-8 mb-6 flex items-center justify-center">
          <span className="text-8xl font-bold text-blue-600">
            {rounds[currentRound].letter}
          </span>
        </div>

        <div className="relative mb-20 flex h-64 w-full items-center justify-center">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isLoading}
            className={`flex h-32 w-32 items-center justify-center rounded-full transition-all duration-200 ${isRecording ? "bg-red-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"} ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <Mic size={48} />
          </button>
        </div>

        <div className="text-center text-sm text-gray-600">
          {isRecording
            ? "Suelta para terminar de grabar"
            : "Mantén presionado para grabar"}
        </div>
      </div>
    </div>
  );
};

export default ReadingTestPage;
