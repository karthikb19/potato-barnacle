// Greatest Common Divisor function
function gcd(a: number, b: number): number {
    if (b < 0.0000001) return a;
    return gcd(b, Math.floor(a % b));
};

// Converts a decimal number to a fraction object
export function toFraction(decimal: number): { n: number, d: number } {
    if (decimal === parseInt(String(decimal))) {
        return { n: decimal, d: 1 };
    }
    
    // Handle floating point inaccuracies, e.g., 2.499999... should be 2.5
    const roundedDecimal = Math.round(decimal * 1e9) / 1e9;

    const len = roundedDecimal.toString().length - 2;
    let denominator = Math.pow(10, len);
    let numerator = roundedDecimal * denominator;

    const divisor = gcd(numerator, denominator);

    numerator /= divisor;
    denominator /= divisor;

    return { n: Math.floor(numerator), d: Math.floor(denominator) };
} 