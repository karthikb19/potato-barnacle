const fs = require('fs');
const path = require('path');

// This is a direct copy of the evaluateExpressions function from the frontend code.
// In a real-world monorepo, you might share this code.
const evaluateExpressions = (numbers) => {
    if (numbers.length === 1) {
        return new Set([numbers[0]]);
    }
    const results = new Set();
    for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
            const a = numbers[i];
            const b = numbers[j];
            const remainingNumbers = numbers.filter((_, idx) => idx !== i && idx !== j);
            const intermediateResults = [
                a + b,
                a - b,
                b - a,
                a * b,
                ...(b !== 0 ? [a / b] : []),
                ...(a !== 0 ? [b / a] : []),
            ];
            for (const result of intermediateResults) {
                const newNumbers = [...remainingNumbers, result];
                const subResults = evaluateExpressions(newNumbers);
                subResults.forEach(r => results.add(r));
            }
        }
    }
    return results;
};

// Helper to get all combinations of 4 from 25
function getCombinations(array, size) {
    const result = [];
    function combinationUtil(start, chosen) {
        if (chosen.length === size) {
            result.push([...chosen]);
            return;
        }
        for (let i = start; i < array.length; i++) {
            chosen.push(array[i]);
            combinationUtil(i + 1, chosen);
            chosen.pop();
        }
    }
    combinationUtil(0, []);
    return result;
}

function generateAllPuzzles() {
    const allPuzzles = {
        easy: [],
        medium: [],
        hard: [],
    };
    
    const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
    const numberCombinations = getCombinations(numbers, 4);

    console.log(`Found ${numberCombinations.length} combinations. Evaluating puzzles...`);

    let puzzleId = 0;
    numberCombinations.forEach((combination, index) => {
        const possibleResults = Array.from(evaluateExpressions(combination))
            .filter(n => n > 0 && Number.isInteger(n) && n <= 150); // Keep targets reasonable

        if (possibleResults.length > 0) {
            let difficulty;
            if (possibleResults.length > 50) {
                difficulty = 'easy';
            } else if (possibleResults.length >= 25) {
                difficulty = 'medium';
            } else {
                difficulty = 'hard';
            }

            for (const target of possibleResults) {
                allPuzzles[difficulty].push({
                    id: `puzzle-${puzzleId++}`,
                    numbers: combination,
                    target,
                });
            }
        }
        if ((index + 1) % 1000 === 0) {
            console.log(`Processed ${index + 1} / ${numberCombinations.length} combinations...`);
        }
    });

    const outputPath = path.join(__dirname, '..', 'public', 'puzzles.json');
    fs.writeFileSync(outputPath, JSON.stringify(allPuzzles, null, 2));
    
    console.log('Finished generating puzzles!');
    console.log(`Easy: ${allPuzzles.easy.length}`);
    console.log(`Medium: ${allPuzzles.medium.length}`);
    console.log(`Hard: ${allPuzzles.hard.length}`);
    console.log(`Puzzles saved to ${outputPath}`);
}

generateAllPuzzles(); 