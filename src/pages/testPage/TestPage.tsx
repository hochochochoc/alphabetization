import { useState, useEffect } from 'react';
import { Heart, Volume2 } from 'lucide-react';

const TestPage = () => {
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  
  const rounds = [
    { target: 'A', options: ['A', 'E', 'I', 'O'] },
    { target: 'E', options: ['A', 'E', 'U', 'O'] },
    { target: 'I', options: ['I', 'E', 'A', 'U'] },
  ];

  const playSound = () => {
    const utterance = new SpeechSynthesisUtterance(rounds[currentRound].target);
    utterance.lang = 'es-ES';
    utterance.rate = 0.2;
    utterance.text = rounds[currentRound].target + '... ' + rounds[currentRound].target;
    speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        setResult(null);
        if (result === 'correct') {
          setCurrentRound(prev => Math.min(prev + 1, rounds.length - 1));
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [result]);

  useEffect(() => {
    // Play sound when new round starts
    playSound();
  }, [currentRound]);

  const checkAnswer = (letter: string) => {
    const isCorrect = letter === rounds[currentRound].target;
    setResult(isCorrect ? 'correct' : 'incorrect');
    
    if (isCorrect) {
      setScore(score + 1);
    } else {
      setLives(prev => {
        if (prev <= 1) {
          setTimeout(() => {
            setLives(3);
            setScore(0);
            setCurrentRound(0);
          }, 1000);
        }
        return prev - 1;
      });
    }
  };

  const getBgColor = () => {
    if (result === 'correct') return 'bg-green-100';
    if (result === 'incorrect') return 'bg-red-100';
    return 'bg-gradient-to-br from-blue-100 to-white';
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 transition-colors duration-300 ${getBgColor()}`}>
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <div className="flex gap-2">
          {[...Array(lives)].map((_, i) => (
            <Heart key={i} className="text-red-500 fill-red-500" size={24} />
          ))}
        </div>
        <div className="text-xl font-bold text-blue-800">
          Score: {score}
        </div>
      </div>

      <div className="w-full max-w-md h-3 bg-blue-200 rounded-full mb-8 overflow-hidden">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${(currentRound / rounds.length) * 100}%` }}
        />
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <button 
          onClick={playSound}
          className="w-full mb-8 bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-6 
                     flex items-center justify-center gap-3 transition-colors duration-200"
        >
          <Volume2 size={32} />
          <span className="text-xl font-semibold">Listen Again</span>
        </button>
        
        <div className="grid grid-cols-2 gap-4">
          {rounds[currentRound].options.map((letter) => (
            <button
              key={letter}
              onClick={() => !result && checkAnswer(letter)}
              className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 
                       hover:to-blue-200 rounded-xl p-8 text-4xl font-bold text-blue-900
                       shadow-md transition-all duration-200 hover:shadow-lg hover:-translate-y-1
                       active:translate-y-0 active:shadow-md"
              disabled={result !== null}
            >
              {letter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestPage;