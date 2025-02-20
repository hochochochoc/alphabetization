import { useState, useEffect } from "react";
import { Howl } from "howler";
import { Volume2, ArrowLeft } from "lucide-react";
import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import { useNavigate } from "react-router-dom";

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

const generateRound = () => {
  const target =
    spanishLetters[Math.floor(Math.random() * spanishLetters.length)];
  let options = [target];

  while (options.length < 4) {
    const option =
      spanishLetters[Math.floor(Math.random() * spanishLetters.length)];
    if (!options.some((o) => o.letter === option.letter)) {
      options.push(option);
    }
  }

  return {
    target: target.letter,
    voiceTarget: target.voice,
    options: options.sort(() => Math.random() - 0.5).map((o) => o.letter),
  };
};

const TestPage = () => {
  const navigate = useNavigate();
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [isGameComplete, setIsGameComplete] = useState(false);
  const [rounds, setRounds] = useState(
    Array(8)
      .fill(null)
      .map(() => generateRound()),
  );

  const polly = new PollyClient({
    region: import.meta.env.VITE_AWS_REGION || "eu-west-3",
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || "",
      secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || "",
    },
  });

  const correctSound = new Howl({
    src: [
      "https://assets.mixkit.co/sfx/preview/mixkit-correct-answer-tone-2870.mp3",
    ],
    volume: 0.5,
    html5: true,
    preload: true,
    xhr: {
      method: "GET",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
  });

  const incorrectSound = new Howl({
    src: ["/mixkit-tech-break-fail-2947.wav"],
    volume: 0.7,
    html5: true,
    preload: true,
    xhr: {
      method: "GET",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
  });

  const playSound = async () => {
    if (isGameComplete) return;

    const command = new SynthesizeSpeechCommand({
      Text: rounds[currentRound].voiceTarget,
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
    // Initial sound play
    const timer = setTimeout(() => playSound(), 500);
    return () => clearTimeout(timer);
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
        setSelectedLetter(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [result, currentRound, rounds.length]);

  useEffect(() => {
    if (!isGameComplete && currentRound > 0) {
      playSound();
    }
  }, [currentRound]);

  const checkAnswer = async () => {
    const isCorrect = selectedLetter === rounds[currentRound].target;
    setResult(isCorrect ? "correct" : "incorrect");

    if (isCorrect) {
      correctSound.play();
      setScore(score + 1);
      setTotalCorrect((prev) => prev + 1);
    } else {
      incorrectSound.play();
      setScore(0);
      setTotalCorrect((prev) => prev - 1);
    }

    try {
      await fetch("http://localhost:3001/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          target_letter: rounds[currentRound].target,
          options: rounds[currentRound].options,
          user_answer: selectedLetter,
          correct: isCorrect,
        }),
      });
    } catch (error) {
      console.error("Error saving guess:", error);
    }
  };

  const getButtonColor = (letter: string) => {
    if (result && letter === selectedLetter) {
      return result === "correct" ? "bg-green-500" : "bg-red-500";
    }
    if (letter === selectedLetter) {
      return "bg-blue-100";
    }
    return "bg-white";
  };

  const getBgColor = () => {
    if (result === "correct") return "bg-green-100";
    if (result === "incorrect") return "bg-red-100";
    return "bg-gradient-to-br from-blue-100 to-white";
  };

  if (isGameComplete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-white p-4">
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
          <h1 className="mb-4 text-2xl font-bold">¡Felicitaciones!</h1>
          <p className="mb-8">
            Has completado el ejercicio con {totalCorrect} respuestas correctas.
          </p>
          <button
            onClick={() => {
              setCurrentRound(0);
              setScore(0);
              setIsGameComplete(false);
              setRounds(
                Array(5)
                  .fill(null)
                  .map(() => generateRound()),
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
          onClick={() => navigate("/")}
          className="flex items-center justify-center rounded-full bg-white p-2 shadow-md hover:bg-gray-50"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div className="mt-3 w-[90%] pr-4">
          <div className="mb-1 flex w-full max-w-md items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`text-xs font-bold text-blue-800 ${score < 2 ? "invisible" : "visible"}`}
              >
                {score} SEGUIDAS
              </div>
            </div>
          </div>

          <div className="mb-4 h-3 w-full max-w-md overflow-hidden rounded-full bg-blue-200">
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

      <div className="flex w-full max-w-md flex-col justify-center rounded-2xl bg-white p-8 shadow-xl">
        <button
          onClick={playSound}
          className="mt-6 mb-10 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-gray-200 bg-white px-6 py-12 text-sky-400 transition-colors duration-200 hover:bg-blue-700"
        >
          <Volume2 size={62} />
          <span className="text-lg font-semibold">Escucha otra vez</span>
        </button>

        <div className="grid grid-cols-2 gap-4">
          {rounds[currentRound].options.map((letter) => (
            <button
              key={letter}
              onClick={() => !result && setSelectedLetter(letter)}
              className={`rounded-xl border-2 border-gray-200 p-5 text-4xl font-bold text-gray-800 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:shadow-md ${getButtonColor(letter)}`}
              disabled={result !== null}
            >
              {letter}
            </button>
          ))}
        </div>

        <button
          onClick={checkAnswer}
          disabled={!selectedLetter || result !== null}
          className={`relative mt-8 w-full rounded-full border-b-6 p-4 font-semibold text-white transition-colors duration-200 ${selectedLetter && !result ? "border-blue-800 bg-blue-500 hover:bg-blue-600" : "cursor-not-allowed border-gray-400 bg-gray-300"}`}
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

export default TestPage;
