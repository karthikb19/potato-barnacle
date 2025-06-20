import { useState, useEffect } from 'react';
import { loadPuzzles, getPuzzle, type Puzzle } from '../utils/puzzleProvider';
import { FaHome, FaBars, FaSyncAlt, FaArrowRight } from 'react-icons/fa';
import { toFraction } from '../utils/fraction';
import './Game.css';

interface GridNumber {
  value: number;
  used: boolean;
}

interface SolvedEntry {
  id: string;
  numbers: number[];
  time: number;
}

interface GameState {
  puzzle: Puzzle;
  numbers: GridNumber[];
  puzzleTimer: number;
  wins: number;
  skips: number;
}

type Difficulty = 'easy' | 'medium' | 'hard';

const DisplayNumber = ({ value }: { value: number }) => {
  if (value === Math.floor(value)) {
    return <>{value}</>;
  }
  const frac = toFraction(value);
  return (
    <span className="fraction">
      <sup>{frac.n}</sup>&frasl;<sub>{frac.d}</sub>
    </span>
  );
};

export const Game = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [firstOperand, setFirstOperand] = useState<{ index: number } | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [sessionTimer, setSessionTimer] = useState(0);
  const [solvedLog, setSolvedLog] = useState<SolvedEntry[]>([]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}'${remainingSeconds.toString().padStart(2, '0')}"`;
  };

  const getNewPuzzle = (newDifficulty: Difficulty, statChange: { win?: { puzzle: Puzzle; time: number }; skip?: boolean } = {}) => {
    const puzzle = getPuzzle(newDifficulty);
    if (statChange.win) {
      setSolvedLog(prev => [
        { id: statChange.win!.puzzle.id, numbers: statChange.win!.puzzle.numbers, time: statChange.win!.time },
        ...prev
      ].slice(0, 5));
    }
    setGameState(prev => ({
      puzzle: puzzle,
      numbers: puzzle.numbers.map(n => ({ value: n, used: false })),
      puzzleTimer: 0,
      wins: statChange.win ? (prev?.wins ?? 0) + 1 : (prev?.wins ?? 0),
      skips: statChange.skip ? (prev?.skips ?? 0) + 1 : (prev?.skips ?? 0),
    }));
    setFirstOperand(null);
    setOperation(null);
  };

  useEffect(() => {
    const initPuzzles = async () => {
      setLoading(true);
      await loadPuzzles();
      const puzzle = getPuzzle(difficulty);
      setGameState({
        puzzle: puzzle,
        numbers: puzzle.numbers.map(n => ({ value: n, used: false })),
        puzzleTimer: 0,
        wins: 0,
        skips: 0
      });
      setLoading(false);
    };
    initPuzzles();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setSessionTimer(prev => prev + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!gameState || loading) return;
    const interval = setInterval(() => {
      setGameState(prev => (prev ? { ...prev, puzzleTimer: prev.puzzleTimer + 1 } : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState?.puzzle.id, loading]);

  const handleWin = () => {
    const winTime = gameState!.puzzleTimer;
    setTimeout(() => getNewPuzzle(difficulty, { win: { puzzle: gameState!.puzzle, time: winTime } }), 500);
  };

  const handleSkip = () => getNewPuzzle(difficulty, { skip: true });

  const handleReset = () => {
    if (!gameState) return;
    setGameState({
      ...gameState,
      numbers: gameState.puzzle.numbers.map(n => ({ value: n, used: false })),
      puzzleTimer: 0,
    });
    setFirstOperand(null);
    setOperation(null);
  };

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    if (difficulty === newDifficulty) return;
    setDifficulty(newDifficulty);
    getNewPuzzle(newDifficulty);
  };

  const handleOperationClick = (op: string) => {
    if (firstOperand) setOperation(op);
  };

  const handleNumberClick = (index: number) => {
    if (operation && firstOperand && firstOperand.index !== index) {
      const num1 = gameState!.numbers[firstOperand.index].value;
      const num2 = gameState!.numbers[index].value;
      let result: number | null = null;
      switch (operation) {
        case '+': result = num1 + num2; break;
        case '-': result = num1 - num2; break;
        case '×': result = num1 * num2; break;
        case '÷':
          if (num2 === 0) return;
          result = num1 / num2;
          break;
      }
      if (result !== null) {
        const newNumbers = [...gameState!.numbers];
        newNumbers[firstOperand.index] = { value: result, used: false };
        newNumbers[index] = { value: 0, used: true };
        setGameState(prev => (prev ? { ...prev, numbers: newNumbers } : null));
        const remainingNumbers = newNumbers.filter(n => !n.used);
        if (remainingNumbers.length === 1 && Math.abs(remainingNumbers[0].value - gameState!.puzzle.target) < 0.001) {
          handleWin();
        } else {
          setFirstOperand(null);
          setOperation(null);
        }
      }
    } else {
      if (firstOperand?.index === index) {
        setFirstOperand(null);
        setOperation(null);
      } else {
        setFirstOperand({ index });
        setOperation(null);
      }
    }
  };

  if (loading || !gameState) {
    return <div className="loading-spinner">Loading Puzzles...</div>;
  }

  return (
    <div className="app-layout">
      <div>
        <div className="difficulty-selector">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
            <button
              key={d}
              className={`difficulty-button ${difficulty === d ? 'active' : ''}`}
              onClick={() => handleDifficultyChange(d)}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>

        <div className="game-container">
          <div className="target-box">
            {gameState.puzzle.target}
          </div>
          {gameState.numbers.map((num, idx) => (
            <div
              key={idx}
              className={`number-box ${num.used ? 'used' : ''} ${firstOperand?.index === idx ? 'selected' : ''}`}
              onClick={() => !num.used && handleNumberClick(idx)}
            >
              {!num.used && <DisplayNumber value={num.value} />}
            </div>
          ))}
          <div className="op-buttons">
            {['+', '-', '×', '÷'].map(op => (
              <button
                key={op}
                onClick={() => handleOperationClick(op)}
                className={`game-button op-button ${operation === op ? 'active' : ''} ${firstOperand && !operation ? 'selectable' : ''}`}
              >
                {op}
              </button>
            ))}
          </div>
          <div className="action-buttons">
            <button className="game-button" onClick={handleReset}>
              <FaSyncAlt />
              <span>Reset</span>
            </button>
            <button className="game-button" onClick={handleSkip}>
              <FaArrowRight />
              <span>Next Set</span>
            </button>
          </div>
        </div>
      </div>
      <div className="side-panel">
        <div className="panel-header">
          <FaHome />
          <FaBars />
        </div>
        <div className="panel-score">
          {gameState.wins}-{gameState.skips}
        </div>
        <div className="panel-timer">{formatTime(sessionTimer)}</div>
        <div className="solved-log-container">
          {solvedLog.map(entry => (
            <div key={entry.id} className="solved-log-entry">
              Solved [{entry.numbers.join(',')}] in {entry.time}s
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};