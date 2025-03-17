import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "../../store/hooks";
import {
  playCorrectSound,
  playIncorrectSound,
} from "../../store/features/audioSlice";

// Spanish alphabet letters with their pronunciation
const spanishLetters = [
  // { letter: "A", voice: "a" },
  // { letter: "B", voice: "be" },
  // { letter: "C", voice: "ce" },
  // { letter: "D", voice: "de" },
  // { letter: "E", voice: "e" },
  // { letter: "F", voice: "efe" },
  // { letter: "G", voice: "ge" },
  { letter: "H", voice: "hache" },
  // { letter: "I", voice: "i" },
  // { letter: "J", voice: "jota" },
  // { letter: "K", voice: "ka" },
  // { letter: "L", voice: "ele" },
  { letter: "LL", voice: "elle" },
  // { letter: "M", voice: "eme" },
  // { letter: "N", voice: "ene" },
  // { letter: "Ñ", voice: "eñe" },
  // { letter: "O", voice: "o" },
  // { letter: "P", voice: "pe" },
  // { letter: "Q", voice: "cu" },
  { letter: "R", voice: "erre" },
  // { letter: "S", voice: "ese" },
  // { letter: "T", voice: "te" },
  // { letter: "U", voice: "u" },
  // { letter: "V", voice: "uve" },
  { letter: "W", voice: "uve doble" },
  { letter: "X", voice: "equis" },
  // { letter: "Y", voice: "i griega" },
  // { letter: "Z", voice: "zeta" },
];

const MIN_RECORDING_TIME = 500;
const MAX_RECORDING_TIME = 5000;

const ReadingTestPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isRecording, setIsRecording] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState<string>("");

  const [speechRecognitionSupported, setSpeechRecognitionSupported] =
    useState<boolean>(true);

  const recognitionRef = useRef<any>(null);
  const recordingStartTimeRef = useRef<number | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate a fixed set of rounds rather than regenerating every render
  const generateRounds = () => {
    return Array(8)
      .fill(null)
      .map(
        () => spanishLetters[Math.floor(Math.random() * spanishLetters.length)],
      );
  };

  const [rounds, setRounds] = useState(generateRounds());

  // Check for speech recognition support
  useEffect(() => {
    const hasSpeechRecognition =
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

    setSpeechRecognitionSupported(hasSpeechRecognition);

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
            // Clear transcript when moving to next round
            setTranscript("");
            setCurrentRound((prevRound) => {
              console.log(
                `Advancing from round ${prevRound} to ${prevRound + 1}`,
              );
              return prevRound + 1;
            });
            // Add a short delay before allowing recording again
            setTimeout(() => {
              setIsLoading(false);
            }, 500);
          }
        } else {
          setIsLoading(false);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [result, currentRound, rounds.length]);

  const initializeRecognition = () => {
    if (recognitionRef.current) return;

    // Create a standard speech recognition
    const SpeechRecognition =
      (window as any).webkitSpeechRecognition ||
      (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = async (event: any) => {
      try {
        const transcript = event.results[0][0].transcript.toLowerCase();
        console.log("Detected speech:", transcript);
        setTranscript(transcript);

        // Use direct checking for flexibility instead of ChatGPT
        checkPronunciation(transcript);
      } catch (error) {
        console.error("Error processing speech result:", error);

        setResult("incorrect");
        setIsLoading(false);
      }
    };

    recognition.onend = () => {
      const recordingDuration = recordingStartTimeRef.current
        ? Date.now() - recordingStartTimeRef.current
        : 0;

      if (recordingDuration < MIN_RECORDING_TIME) {
        // If recording was too short, don't count it as an attempt
        console.log("Recording too short, not counting as attempt");
        setIsRecording(false);
        setIsLoading(false);
        return;
      }

      // If no result was detected, show a message
      if (transcript === "") {
      }

      console.log("Recognition ended");
      setIsRecording(false);
      recordingStartTimeRef.current = null;
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);

      if (event.error === "no-speech") {
        // Handle no speech detected differently
        console.log("No speech detected");
        setIsRecording(false);
        setIsLoading(false);
        return;
      }

      setResult("incorrect");
      setIsLoading(false);
    };

    recognitionRef.current = recognition;
  };

  // This function directly checks if the transcription matches the expected letter or pronunciation
  const checkPronunciation = (transcript: string) => {
    try {
      setIsLoading(true);

      // Use the currentRound from state to get the current letter
      // This will always get the current value at the time of execution
      const current = currentRound;
      const currentLetter = rounds[current].letter;
      const currentPronunciation = rounds[current].voice;

      // Clean and normalize the transcript
      const cleanTranscript = transcript.trim().toLowerCase();

      // Log to check what current round and letter we're on
      console.log(
        `Current round: ${current}, Checking letter: ${currentLetter}, Pronunciation: ${currentPronunciation}`,
      );

      // Check if the transcription is either:
      // 1. The letter itself (e.g. "w")
      // 2. The official pronunciation (e.g. "uve doble")
      // 3. A close approximation of the pronunciation

      const isLetterMatch = cleanTranscript === currentLetter.toLowerCase();
      const isPronunciationMatch = cleanTranscript.includes(
        currentPronunciation.toLowerCase(),
      );

      // Special case handling
      let isSpecialMatch = false;

      // Special cases for specific letters
      if (currentLetter === "W") {
        isSpecialMatch =
          cleanTranscript.includes("doble") ||
          cleanTranscript.includes("dobl") ||
          cleanTranscript.includes("w");
      } else if (currentLetter === "LL") {
        isSpecialMatch =
          cleanTranscript.includes("elle") ||
          cleanTranscript.includes("eye") ||
          cleanTranscript.includes("ll");
      } else if (currentLetter === "Y") {
        isSpecialMatch =
          cleanTranscript.includes("griega") ||
          cleanTranscript.includes("grieg") ||
          cleanTranscript.includes("y");
      } else if (currentLetter === "Ñ") {
        isSpecialMatch =
          cleanTranscript.includes("eñe") ||
          cleanTranscript.includes("eñ") ||
          cleanTranscript.includes("ñ");
      }

      const isCorrect = isLetterMatch || isPronunciationMatch || isSpecialMatch;
      console.log(
        `Checking: Letter: ${currentLetter}, Pronunciation: ${currentPronunciation}, Said: "${cleanTranscript}", Correct: ${isCorrect}`,
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
    } catch (error) {
      console.error("Error checking pronunciation:", error);

      setResult("incorrect");
      dispatch(playIncorrectSound());
    } finally {
      setIsLoading(false);
    }
  };

  // This function handles starting a recording session
  const startRecording = async (): Promise<void> => {
    if (isRecording || isLoading) return;

    setIsLoading(true);

    if (!speechRecognitionSupported) {
      setIsLoading(false);
      return;
    }

    // Reset recognition ref to ensure we get a fresh instance for each recording
    recognitionRef.current = null;
    initializeRecognition();

    if (!recognitionRef.current) {
      setIsLoading(false);
      return;
    }

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
    setTranscript("");

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
          <span className="text-[120px] font-bold text-blue-600">
            {rounds[currentRound].letter}
          </span>
        </div>

        <div className="relative mb-10 flex h-64 w-full items-center justify-center">
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            disabled={isLoading || !speechRecognitionSupported}
            className={`flex h-32 w-32 items-center justify-center rounded-full transition-all duration-200 ${isRecording ? "bg-red-500 text-white" : "bg-blue-500 text-white hover:bg-blue-600"} ${isLoading || !speechRecognitionSupported ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <Mic size={48} />
          </button>
        </div>

        <div className="text-center text-sm text-gray-600">
          {isRecording
            ? "Suelta para terminar de grabar"
            : isLoading
              ? "Analizando pronunciación..."
              : !speechRecognitionSupported
                ? "Reconocimiento de voz no soportado en este navegador"
                : "Mantén presionado para grabar"}
        </div>
      </div>
    </div>
  );
};

export default ReadingTestPage;
