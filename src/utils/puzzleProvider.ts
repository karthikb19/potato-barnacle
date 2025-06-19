export interface Puzzle {
  id: string;
  numbers: number[];
  target: number;
}

interface PuzzleSet {
  easy: Puzzle[];
  medium: Puzzle[];
  hard: Puzzle[];
}

let puzzleData: PuzzleSet | null = null;

export const loadPuzzles = async () => {
  if (puzzleData) return;

  const response = await fetch('/puzzles.json');
  const data: PuzzleSet = await response.json();
  puzzleData = data;
};

export const getPuzzle = (difficulty: 'easy' | 'medium' | 'hard'): Puzzle => {
  if (!puzzleData) {
    throw new Error("Puzzles not loaded yet!");
  }

  const puzzleList = puzzleData[difficulty];
  if (!puzzleList || puzzleList.length === 0) {
    throw new Error(`No puzzles available for difficulty: ${difficulty}`);
  }

  const randomIndex = Math.floor(Math.random() * puzzleList.length);
  return puzzleList[randomIndex];
}; 