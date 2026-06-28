// ==========================================
// DAMBAR MATH ENGINE - FIXED VERSION
// ==========================================

function solveMath(input) {
    const text = input.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Check if it's a math question
    const mathKeywords = ['what is', 'calculate', 'solve', 'compute', 'evaluate', 'math', 
                          'plus', 'minus', 'times', 'divided by', 'multiplied by', 'power',
                          'sqrt', 'square root', 'percent', 'factorial', 'abs', 'mod', 'modulo',
                          'round', 'ceil', 'floor', 'log', 'ln', 'sin', 'cos', 'tan'];
    
    let isMath = false;
    for (const keyword of mathKeywords) {
        if (text.includes(keyword)) {
            isMath = true;
            break;
        }
    }
    
    // If no math keywords and no numbers/operators, return null
    if (!isMath && !/\d/.test(text)) return null;
    
    // Try to solve various math expressions
    
    // 1. BASIC ARITHMETIC with operators
    // Match: number operator number (with proper operator precedence)
    const arithmeticMatch = text.match(/([-+]?\d+\.?\d*)\s*([+\-*/^])\s*([-+]?\d+\.?\d*)/);
    if (arithmeticMatch && !text.includes('sqrt') && !text.includes('root') && !text.includes('percent')) {
        let num1 = parseFloat(arithmeticMatch[1]);
        let operator = arithmeticMatch[2];
        let num2 = parseFloat(arithmeticMatch[3]);
        
        let result;
        switch (operator) {
            case '+': result = num1 + num2; break;
            case '-': result = num1 - num2; break;
            case '*': result = num1 * num2; break;
            case '/': 
                if (num2 === 0) return "Division by zero is undefined.";
                result = num1 / num2; 
                break;
            case '^': result = Math.pow(num1, num2); break;
            default: return null;
        }
        
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
        const symbol = { '+': '+', '-': '-', '*': '×', '/': '÷', '^': '^' }[operator];
        return `${num1} ${symbol} ${num2} = ${formatted}`;
    }
    
    // 2. WORD OPERATORS (plus, minus, times, divided by)
    const wordOpMatch = text.match(/([-+]?\d+\.?\d*)\s*(plus|minus|times|multiplied by|divided by|over)\s*([-+]?\d+\.?\d*)/);
    if (wordOpMatch) {
        let num1 = parseFloat(wordOpMatch[1]);
        let operator = wordOpMatch[2];
        let num2 = parseFloat(wordOpMatch[3]);
        
        let result;
        let symbol;
        switch (operator) {
            case 'plus': 
                result = num1 + num2; 
                symbol = '+';
                break;
            case 'minus': 
                result = num1 - num2; 
                symbol = '-';
                break;
            case 'times':
            case 'multiplied by': 
                result = num1 * num2; 
                symbol = '×';
                break;
            case 'divided by':
            case 'over': 
                if (num2 === 0) return "Division by zero is undefined.";
                result = num1 / num2; 
                symbol = '÷';
                break;
            default: return null;
        }
        
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
        return `${num1} ${symbol} ${num2} = ${formatted}`;
    }
    
    // 3. PERCENTAGE
    const pctMatch = text.match(/([-+]?\d+\.?\d*)\s*(?:%|percent)\s*(?:of)?\s*([-+]?\d+\.?\d*)/);
    if (pctMatch) {
        const pct = parseFloat(pctMatch[1]);
        const num = parseFloat(pctMatch[2]);
        const result = (pct / 100) * num;
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(2));
        return `${pct}% of ${num} = ${formatted}`;
    }
    
    // 4. SQUARE ROOT
    const sqrtMatch = text.match(/(?:sqrt|square root|root)\s*(?:of)?\s*([-+]?\d+\.?\d*)/);
    if (sqrtMatch) {
        const num = parseFloat(sqrtMatch[1]);
        if (num < 0) return "Square root of a negative number is not a real number.";
        const result = Math.sqrt(num);
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
        return `√${num} = ${formatted}`;
    }
    
    // 5. POWER
    const powMatch = text.match(/([-+]?\d+\.?\d*)\s*(?:to the power of|raised to|power)\s*([-+]?\d+\.?\d*)/);
    if (powMatch) {
        const base = parseFloat(powMatch[1]);
        const exp = parseFloat(powMatch[2]);
        const result = Math.pow(base, exp);
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
        return `${base}^${exp} = ${formatted}`;
    }
    
    // 6. FACTORIAL
    const factMatch = text.match(/(\d+)\s*!/);
    if (factMatch) {
        const n = parseInt(factMatch[1]);
        if (n > 170) return "Number too large for factorial.";
        if (n < 0) return "Factorial not defined for negative numbers.";
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return `${n}! = ${result}`;
    }
    
    // 7. ABSOLUTE VALUE
    const absMatch = text.match(/abs\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (absMatch) {
        const num = parseFloat(absMatch[1]);
        return `|${num}| = ${Math.abs(num)}`;
    }
    
    // 8. MODULO
    const modMatch = text.match(/([-+]?\d+)\s*(?:mod|modulo)\s*([-+]?\d+)/);
    if (modMatch) {
        const a = parseInt(modMatch[1]);
        const b = parseInt(modMatch[2]);
        if (b === 0) return "Modulo by zero is undefined.";
        return `${a} mod ${b} = ${a % b}`;
    }
    
    // 9. ROUND
    const roundMatch = text.match(/round\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (roundMatch) {
        const num = parseFloat(roundMatch[1]);
        return `round(${num}) = ${Math.round(num)}`;
    }
    
    // 10. CEIL
    const ceilMatch = text.match(/ceil\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (ceilMatch) {
        const num = parseFloat(ceilMatch[1]);
        return `ceil(${num}) = ${Math.ceil(num)}`;
    }
    
    // 11. FLOOR
    const floorMatch = text.match(/floor\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (floorMatch) {
        const num = parseFloat(floorMatch[1]);
        return `floor(${num}) = ${Math.floor(num)}`;
    }
    
    // 12. LOGARITHM
    const logMatch = text.match(/log\s*(?:base)?\s*([-+]?\d+\.?\d*)?\s*(?:of)?\s*([-+]?\d+\.?\d*)/);
    if (logMatch && text.includes('log') && !text.includes('ln')) {
        let base = logMatch[1] ? parseFloat(logMatch[1]) : 10;
        let num = parseFloat(logMatch[2] || logMatch[1]);
        
        // If log has only one number, it's log10
        if (!logMatch[2]) {
            num = parseFloat(logMatch[1]);
            base = 10;
        }
        
        if (num <= 0) return "Logarithm undefined for zero or negative numbers.";
        if (base <= 0 || base === 1) return "Invalid logarithm base.";
        const result = Math.log(num) / Math.log(base);
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
        return `log${base === 10 ? '' : '_' + base}(${num}) = ${formatted}`;
    }
    
    // 13. NATURAL LOG
    const lnMatch = text.match(/ln\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (lnMatch) {
        const num = parseFloat(lnMatch[1]);
        if (num <= 0) return "Natural log undefined for zero or negative numbers.";
        const result = Math.log(num);
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
        return `ln(${num}) = ${formatted}`;
    }
    
    // 14. SINE (with degree conversion)
    const sinMatch = text.match(/sin\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (sinMatch) {
        const num = parseFloat(sinMatch[1]);
        const result = Math.sin(num * Math.PI / 180);
        return `sin(${num}°) = ${parseFloat(result.toFixed(6))}`;
    }
    
    // 15. COSINE
    const cosMatch = text.match(/cos\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (cosMatch) {
        const num = parseFloat(cosMatch[1]);
        const result = Math.cos(num * Math.PI / 180);
        return `cos(${num}°) = ${parseFloat(result.toFixed(6))}`;
    }
    
    // 16. TANGENT
    const tanMatch = text.match(/tan\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (tanMatch) {
        const num = parseFloat(tanMatch[1]);
        if (num % 180 === 90 || num % 180 === -90) return `tan(${num}°) is undefined.`;
        const result = Math.tan(num * Math.PI / 180);
        return `tan(${num}°) = ${parseFloat(result.toFixed(6))}`;
    }
    
    // 17. PI
    if (text.includes('pi') || text.includes('π')) {
        const piMatch = text.match(/([-+]?\d+\.?\d*)?\s*(?:pi|π)/);
        if (piMatch) {
            const multiplier = piMatch[1] ? parseFloat(piMatch[1]) : 1;
            const result = multiplier * Math.PI;
            const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
            return `${multiplier === 1 ? '' : multiplier}π = ${formatted}`;
        }
    }
    
    // 18. SIMPLE EXPRESSIONS WITH MULTIPLE OPERATIONS
    // Check if it's a simple arithmetic expression
    try {
        // Only evaluate if it contains only numbers and basic operators
        const cleanExpr = text.replace(/[^0-9+\-*/().]/g, '');
        if (cleanExpr.length > 0) {
            // Evaluate safely using Function constructor
            const result = new Function(`return (${cleanExpr})`)();
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
                return `${cleanExpr} = ${formatted}`;
            }
        }
    } catch (e) {
        // Ignore evaluation errors
    }
    
    // If nothing matched, return null
    return null;
}

// Helper function to check if a string is a math question
function isMathQuestion(text) {
    const mathIndicators = [
        /\d/, // Contains numbers
        /[+\-*/^]/, // Contains operators
        /what is/, /calculate/, /solve/, /compute/, /evaluate/, /math/,
        /plus/, /minus/, /times/, /divided by/, /multiplied by/,
        /sqrt/, /square root/, /percent/, /factorial/, /abs/, /mod/,
        /round/, /ceil/, /floor/, /log/, /ln/, /sin/, /cos/, /tan/,
        /pi/, /π/
    ];
    
    let score = 0;
    for (const indicator of mathIndicators) {
        if (typeof indicator === 'string') {
            if (text.includes(indicator)) score++;
        } else if (indicator.test(text)) {
            score++;
        }
    }
    
    // If it has numbers and at least one math indicator, it's likely a math question
    return score >= 2;
}