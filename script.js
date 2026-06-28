// ==========================================
// Dambar - Neural Network + Paragraph Engine + Advanced Math
// ==========================================

const memory = [];
const MAX_MEMORY = 16;

// Neural network
let model = null;
let wordToIndex = {};
let indexToWord = {};
let vocabSize = 0;
let maxLen = 25;
let modelTrained = false;

// Paragraph learning
let wordPairs = {};
let starters = [];
const PARAGRAPHS = [];

// ============ ADVANCED MATH ENGINE ============

function solveMath(input) {
    const text = input.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Check if it's a math question
    const mathKeywords = ['what is', 'calculate', 'solve', 'compute', 'evaluate', 'math', 
                          'plus', 'minus', 'times', 'divided by', 'multiplied by', 'power',
                          'sqrt', 'square root', 'percent', 'factorial', 'abs', 'mod', 'modulo',
                          'round', 'ceil', 'floor', 'log', 'ln', 'sin', 'cos', 'tan', 'pi',
                          'integral', 'derivative', 'limit', 'sum', 'product', 'matrix'];
    
    let isMath = false;
    for (const keyword of mathKeywords) {
        if (text.includes(keyword)) {
            isMath = true;
            break;
        }
    }
    
    // If no math keywords and no numbers with operators, return null
    if (!isMath && !/\d/.test(text)) return null;
    if (!isMath && !/[+\-*/^()]/.test(text)) return null;
    
    // 1. COMPLEX EXPRESSIONS WITH PARENTHESES
    try {
        // Check for complex expressions with parentheses
        const exprMatch = text.match(/^([\d+\-*/^().\s]+)$/);
        if (exprMatch) {
            const expr = exprMatch[1];
            // Replace ^ with ** for JavaScript
            const jsExpr = expr.replace(/\^/g, '**');
            // Only allow safe characters
            if (/^[\d+\-*/()**.\s]+$/.test(jsExpr)) {
                const result = new Function(`return (${jsExpr})`)();
                if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                    const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
                    return `${expr} = ${formatted}`;
                }
            }
        }
    } catch (e) {
        // Ignore
    }
    
    // 2. BASIC ARITHMETIC with operators
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
    
    // 3. WORD OPERATORS (plus, minus, times, divided by)
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
    
    // 4. PERCENTAGE
    const pctMatch = text.match(/([-+]?\d+\.?\d*)\s*(?:%|percent)\s*(?:of)?\s*([-+]?\d+\.?\d*)/);
    if (pctMatch) {
        const pct = parseFloat(pctMatch[1]);
        const num = parseFloat(pctMatch[2]);
        const result = (pct / 100) * num;
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(2));
        return `${pct}% of ${num} = ${formatted}`;
    }
    
    // 5. SQUARE ROOT
    const sqrtMatch = text.match(/(?:sqrt|square root|root)\s*(?:of)?\s*([-+]?\d+\.?\d*)/);
    if (sqrtMatch) {
        const num = parseFloat(sqrtMatch[1]);
        if (num < 0) return "Square root of a negative number is not a real number.";
        const result = Math.sqrt(num);
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
        return `√${num} = ${formatted}`;
    }
    
    // 6. POWER
    const powMatch = text.match(/([-+]?\d+\.?\d*)\s*(?:to the power of|raised to|power)\s*([-+]?\d+\.?\d*)/);
    if (powMatch) {
        const base = parseFloat(powMatch[1]);
        const exp = parseFloat(powMatch[2]);
        const result = Math.pow(base, exp);
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
        return `${base}^${exp} = ${formatted}`;
    }
    
    // 7. FACTORIAL
    const factMatch = text.match(/(\d+)\s*!/);
    if (factMatch) {
        const n = parseInt(factMatch[1]);
        if (n > 170) return "Number too large for factorial.";
        if (n < 0) return "Factorial not defined for negative numbers.";
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return `${n}! = ${result}`;
    }
    
    // 8. ABSOLUTE VALUE
    const absMatch = text.match(/abs\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (absMatch) {
        const num = parseFloat(absMatch[1]);
        return `|${num}| = ${Math.abs(num)}`;
    }
    
    // 9. MODULO
    const modMatch = text.match(/([-+]?\d+)\s*(?:mod|modulo)\s*([-+]?\d+)/);
    if (modMatch) {
        const a = parseInt(modMatch[1]);
        const b = parseInt(modMatch[2]);
        if (b === 0) return "Modulo by zero is undefined.";
        return `${a} mod ${b} = ${a % b}`;
    }
    
    // 10. ROUND
    const roundMatch = text.match(/round\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (roundMatch) {
        const num = parseFloat(roundMatch[1]);
        return `round(${num}) = ${Math.round(num)}`;
    }
    
    // 11. CEIL
    const ceilMatch = text.match(/ceil\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (ceilMatch) {
        const num = parseFloat(ceilMatch[1]);
        return `ceil(${num}) = ${Math.ceil(num)}`;
    }
    
    // 12. FLOOR
    const floorMatch = text.match(/floor\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (floorMatch) {
        const num = parseFloat(floorMatch[1]);
        return `floor(${num}) = ${Math.floor(num)}`;
    }
    
    // 13. LOGARITHM
    const logMatch = text.match(/log\s*(?:base)?\s*([-+]?\d+\.?\d*)?\s*(?:of)?\s*([-+]?\d+\.?\d*)/);
    if (logMatch && text.includes('log') && !text.includes('ln')) {
        let base = logMatch[1] ? parseFloat(logMatch[1]) : 10;
        let num = parseFloat(logMatch[2] || logMatch[1]);
        
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
    
    // 14. NATURAL LOG
    const lnMatch = text.match(/ln\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (lnMatch) {
        const num = parseFloat(lnMatch[1]);
        if (num <= 0) return "Natural log undefined for zero or negative numbers.";
        const result = Math.log(num);
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
        return `ln(${num}) = ${formatted}`;
    }
    
    // 15. SINE
    const sinMatch = text.match(/sin\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (sinMatch) {
        const num = parseFloat(sinMatch[1]);
        const result = Math.sin(num * Math.PI / 180);
        return `sin(${num}°) = ${parseFloat(result.toFixed(6))}`;
    }
    
    // 16. COSINE
    const cosMatch = text.match(/cos\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (cosMatch) {
        const num = parseFloat(cosMatch[1]);
        const result = Math.cos(num * Math.PI / 180);
        return `cos(${num}°) = ${parseFloat(result.toFixed(6))}`;
    }
    
    // 17. TANGENT
    const tanMatch = text.match(/tan\s*(?:of)?\s*\(\s*([-+]?\d+\.?\d*)\s*\)/);
    if (tanMatch) {
        const num = parseFloat(tanMatch[1]);
        if (num % 180 === 90 || num % 180 === -90) return `tan(${num}°) is undefined.`;
        const result = Math.tan(num * Math.PI / 180);
        return `tan(${num}°) = ${parseFloat(result.toFixed(6))}`;
    }
    
    // 18. PI
    if (text.includes('pi') || text.includes('π')) {
        const piMatch = text.match(/([-+]?\d+\.?\d*)?\s*(?:pi|π)/);
        if (piMatch) {
            const multiplier = piMatch[1] ? parseFloat(piMatch[1]) : 1;
            const result = multiplier * Math.PI;
            const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
            return `${multiplier === 1 ? '' : multiplier}π = ${formatted}`;
        }
    }
    
    // 19. QUADRATIC EQUATION: ax² + bx + c = 0
    const quadMatch = text.match(/([-+]?\d+\.?\d*)\s*x\^2\s*([+-])\s*([-+]?\d+\.?\d*)\s*x\s*([+-])\s*([-+]?\d+\.?\d*)\s*=\s*0/);
    if (quadMatch) {
        const a = parseFloat(quadMatch[1]);
        const bSign = quadMatch[2] === '+' ? 1 : -1;
        const b = bSign * parseFloat(quadMatch[3]);
        const cSign = quadMatch[4] === '+' ? 1 : -1;
        const c = cSign * parseFloat(quadMatch[5]);
        
        const discriminant = b*b - 4*a*c;
        if (discriminant < 0) {
            return "No real solutions (discriminant < 0)";
        } else if (discriminant === 0) {
            const x = -b / (2*a);
            return `x = ${x}`;
        } else {
            const x1 = (-b + Math.sqrt(discriminant)) / (2*a);
            const x2 = (-b - Math.sqrt(discriminant)) / (2*a);
            return `x₁ = ${x1}, x₂ = ${x2}`;
        }
    }
    
    // 20. DERIVATIVE (simple power rule)
    const derivMatch = text.match(/d\/dx\s*\(\s*([-+]?\d+\.?\d*)\s*x\^?\s*([-+]?\d+\.?\d*)?\s*\)/);
    if (derivMatch) {
        const coeff = parseFloat(derivMatch[1]);
        const exp = derivMatch[2] ? parseFloat(derivMatch[2]) : 1;
        const newCoeff = coeff * exp;
        const newExp = exp - 1;
        if (newExp === 0) {
            return `d/dx(${coeff}x${exp === 1 ? '' : '^' + exp}) = ${newCoeff}`;
        } else {
            return `d/dx(${coeff}x${exp === 1 ? '' : '^' + exp}) = ${newCoeff}x${newExp === 1 ? '' : '^' + newExp}`;
        }
    }
    
    // 21. INTEGRAL (simple power rule)
    const intMatch = text.match(/∫\s*([-+]?\d+\.?\d*)\s*x\^?\s*([-+]?\d+\.?\d*)?\s*dx/);
    if (intMatch) {
        const coeff = parseFloat(intMatch[1]);
        const exp = intMatch[2] ? parseFloat(intMatch[2]) : 1;
        const newCoeff = coeff / (exp + 1);
        const newExp = exp + 1;
        if (newCoeff === 1 && newExp === 1) {
            return `∫ ${coeff}x${exp === 1 ? '' : '^' + exp} dx = x + C`;
        } else {
            return `∫ ${coeff}x${exp === 1 ? '' : '^' + exp} dx = ${newCoeff}x${newExp === 1 ? '' : '^' + newExp} + C`;
        }
    }
    
    // 22. SYSTEM OF EQUATIONS (2 variables)
    const sysMatch = text.match(/([-+]?\d+)\s*x\s*([+-])\s*([-+]?\d+)\s*y\s*=\s*([-+]?\d+)\s*and\s*([-+]?\d+)\s*x\s*([+-])\s*([-+]?\d+)\s*y\s*=\s*([-+]?\d+)/);
    if (sysMatch) {
        const a1 = parseFloat(sysMatch[1]);
        const b1Sign = sysMatch[2] === '+' ? 1 : -1;
        const b1 = b1Sign * parseFloat(sysMatch[3]);
        const c1 = parseFloat(sysMatch[4]);
        const a2 = parseFloat(sysMatch[5]);
        const b2Sign = sysMatch[6] === '+' ? 1 : -1;
        const b2 = b2Sign * parseFloat(sysMatch[7]);
        const c2 = parseFloat(sysMatch[8]);
        
        const det = a1*b2 - a2*b1;
        if (det === 0) {
            return "No unique solution (determinant = 0)";
        }
        const x = (c1*b2 - c2*b1) / det;
        const y = (a1*c2 - a2*c1) / det;
        return `x = ${x}, y = ${y}`;
    }
    
    // 23. SEQUENCE/SUM (arithmetic progression)
    const sumMatch = text.match(/sum\s*from\s*(\d+)\s*to\s*(\d+)\s*of\s*([+-]?\d+)\s*n\s*([+-])\s*([+-]?\d+)/);
    if (sumMatch) {
        const start = parseInt(sumMatch[1]);
        const end = parseInt(sumMatch[2]);
        const a = parseFloat(sumMatch[3]);
        const sign = sumMatch[4] === '+' ? 1 : -1;
        const b = sign * parseFloat(sumMatch[5]);
        let sum = 0;
        for (let n = start; n <= end; n++) {
            sum += a*n + b;
        }
        return `Σ(${a}n${b < 0 ? '' : '+'}${b}) from ${start} to ${end} = ${sum}`;
    }
    
    // 24. MATRIX DETERMINANT (2x2)
    const matrixMatch = text.match(/det\s*\[\s*([-+]?\d+\.?\d*)\s+([-+]?\d+\.?\d*)\s*;\s*([-+]?\d+\.?\d*)\s+([-+]?\d+\.?\d*)\s*\]/);
    if (matrixMatch) {
        const a = parseFloat(matrixMatch[1]);
        const b = parseFloat(matrixMatch[2]);
        const c = parseFloat(matrixMatch[3]);
        const d = parseFloat(matrixMatch[4]);
        const det = a*d - b*c;
        return `det([${a} ${b}; ${c} ${d}]) = ${det}`;
    }
    
    // 25. COMBINATION/PERMUTATION
    const combMatch = text.match(/(\d+)\s*C\s*(\d+)/);
    if (combMatch) {
        const n = parseInt(combMatch[1]);
        const r = parseInt(combMatch[2]);
        if (r > n) return "Invalid combination (r > n)";
        let result = 1;
        for (let i = 0; i < r; i++) {
            result *= (n - i);
        }
        for (let i = 1; i <= r; i++) {
            result /= i;
        }
        return `${n}C${r} = ${result}`;
    }
    
    const permMatch = text.match(/(\d+)\s*P\s*(\d+)/);
    if (permMatch) {
        const n = parseInt(permMatch[1]);
        const r = parseInt(permMatch[2]);
        if (r > n) return "Invalid permutation (r > n)";
        let result = 1;
        for (let i = 0; i < r; i++) {
            result *= (n - i);
        }
        return `${n}P${r} = ${result}`;
    }
    
    // 26. SIMPLE EXPRESSIONS WITH MULTIPLE OPERATIONS
    try {
        const cleanExpr = text.replace(/[^0-9+\-*/().]/g, '');
        if (cleanExpr.length > 1 && /[+\-*/]/.test(cleanExpr)) {
            const result = new Function(`return (${cleanExpr})`)();
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
                return `${cleanExpr} = ${formatted}`;
            }
        }
    } catch (e) {
        // Ignore
    }
    
    return null;
}

// ============ PARAGRAPH LEARNING ============

function addParagraph(text) {
    PARAGRAPHS.push(text);
    buildWordModel();
}

function buildWordModel() {
    wordPairs = {};
    starters = [];
    
    const allTexts = [];
    
    KNOWLEDGE_BASE.forEach(entry => {
        allTexts.push(entry.input);
        allTexts.push(entry.output);
    });
    
    PARAGRAPHS.forEach(para => {
        const sentences = para.split(/[.!?]+/).filter(s => s.trim().length > 0);
        sentences.forEach(s => allTexts.push(s.trim()));
    });
    
    allTexts.forEach(text => {
        const words = text.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 0);
        
        if (words.length === 0) return;
        starters.push(words[0]);
        
        for (let i = 0; i < words.length - 1; i++) {
            if (!wordPairs[words[i]]) wordPairs[words[i]] = [];
            wordPairs[words[i]].push(words[i + 1]);
        }
        
        const last = words[words.length - 1];
        if (!wordPairs[last]) wordPairs[last] = [];
        wordPairs[last].push('__END__');
    });
}

function findClosestWord(word) {
    if (wordPairs[word]) return word;
    let best = null;
    let bestScore = 0;
    
    Object.keys(wordPairs).forEach(known => {
        if (known === '__END__') return;
        if (word.includes(known) || known.includes(word)) {
            if (known.length > bestScore) { best = known; bestScore = known.length; }
        }
        const dist = levenshtein(word, known);
        const sim = 1 - (dist / Math.max(word.length, known.length));
        if (sim > 0.6 && sim > bestScore) { best = known; bestScore = sim; }
    });
    return best;
}

function generateFromWords(startWord, maxLength = 15) {
    if (!wordPairs[startWord]) return null;
    
    const words = [startWord];
    let current = startWord;
    
    for (let i = 0; i < maxLength; i++) {
        const nexts = wordPairs[current];
        if (!nexts || nexts.length === 0) break;
        const next = nexts[Math.floor(Math.random() * nexts.length)];
        if (next === '__END__') break;
        words.push(next);
        current = next;
    }
    
    let sentence = words.join(' ');
    sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
    if (!/[.!?]$/.test(sentence)) sentence += '.';
    return sentence;
}

// ============ NEURAL NETWORK ============

function buildVocabulary() {
    const wordFreq = {};
    const allTexts = [];
    
    KNOWLEDGE_BASE.forEach(entry => {
        allTexts.push(entry.input);
        allTexts.push(entry.output);
    });
    
    PARAGRAPHS.forEach(para => {
        const sentences = para.split(/[.!?]+/).filter(s => s.trim().length > 0);
        sentences.forEach(s => allTexts.push(s.trim()));
    });
    
    allTexts.forEach(text => {
        text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0).forEach(w => {
            wordFreq[w] = (wordFreq[w] || 0) + 1;
        });
    });
    
    const sorted = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    
    wordToIndex = { '<PAD>': 0, '<START>': 1, '<END>': 2, '<UNK>': 3 };
    indexToWord = { 0: '<PAD>', 1: '<START>', 2: '<END>', 3: '<UNK>' };
    
    sorted.slice(0, 3000).forEach((word, i) => {
        wordToIndex[word] = i + 4;
        indexToWord[i + 4] = word;
    });
    
    vocabSize = Object.keys(wordToIndex).length;
}

function textToSequence(text) {
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 0);
    const seq = [wordToIndex['<START>']];
    words.forEach(w => seq.push(wordToIndex[w] || wordToIndex['<UNK>']));
    seq.push(wordToIndex['<END>']);
    while (seq.length < maxLen) seq.push(wordToIndex['<PAD>']);
    return seq.slice(0, maxLen);
}

function sequenceToText(seq) {
    const words = [];
    seq.forEach(idx => {
        const word = indexToWord[idx] || '';
        if (word && word !== '<PAD>' && word !== '<START>' && word !== '<END>' && word !== '<UNK>') {
            words.push(word);
        }
    });
    let text = words.join(' ');
    if (text.length > 0) text = text.charAt(0).toUpperCase() + text.slice(1);
    if (!/[.!?]$/.test(text) && text.length > 0) text += '.';
    return text || null;
}

function buildNNModel() {
    const m = tf.sequential();
    m.add(tf.layers.embedding({ inputDim: vocabSize, outputDim: 64, inputLength: maxLen }));
    m.add(tf.layers.lstm({ units: 128, returnSequences: false }));
    m.add(tf.layers.dense({ units: 256, activation: 'relu' }));
    m.add(tf.layers.dropout({ rate: 0.3 }));
    m.add(tf.layers.dense({ units: vocabSize * maxLen, activation: 'softmax' }));
    m.compile({ optimizer: tf.train.adam(0.001), loss: 'categoricalCrossentropy', metrics: ['accuracy'] });
    return m;
}

function prepareNNData() {
    const X = [], Y = [];
    const allPairs = [...KNOWLEDGE_BASE];
    
    PARAGRAPHS.forEach(para => {
        const sentences = para.split(/[.!?]+/).filter(s => s.trim().length > 0);
        for (let i = 0; i < sentences.length - 1; i++) {
            allPairs.push({ input: sentences[i].trim(), output: sentences[i + 1].trim() });
        }
    });
    
    allPairs.forEach(entry => {
        const inSeq = textToSequence(entry.input);
        const outSeq = textToSequence(entry.output);
        X.push(inSeq);
        const oneHot = new Array(vocabSize * maxLen).fill(0);
        outSeq.forEach((idx, pos) => { if (idx > 0) oneHot[pos * vocabSize + idx] = 1; });
        Y.push(oneHot);
    });
    
    return { X: tf.tensor2d(X), Y: tf.tensor2d(Y) };
}

async function trainNN(epochs = 30) {
    buildVocabulary();
    model = buildNNModel();
    const { X, Y } = prepareNNData();
    
    for (let i = 0; i < epochs; i++) {
        await model.fit(X, Y, { epochs: 1, batchSize: Math.min(16, X.shape[0]), shuffle: true });
    }
    
    X.dispose();
    Y.dispose();
    modelTrained = true;
}

async function nnPredict(text) {
    if (!modelTrained) return null;
    const seq = textToSequence(text);
    const input = tf.tensor2d([seq]);
    const pred = model.predict(input);
    const arr = await pred.array();
    const tokens = [];
    for (let i = 0; i < maxLen; i++) {
        const slice = arr[0].slice(i * vocabSize, (i + 1) * vocabSize);
        const maxIdx = slice.indexOf(Math.max(...slice));
        if (maxIdx > 1) tokens.push(maxIdx);
    }
    input.dispose();
    pred.dispose();
    return sequenceToText(tokens);
}

// ============ MATCHING ============

function normalize(text) {
    return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function overlap(a, b) {
    const setA = new Set(a.split(' '));
    const setB = new Set(b.split(' '));
    let count = 0;
    setA.forEach(w => { if (setB.has(w)) count++; });
    return count / Math.max(setA.size, setB.size);
}

function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

function findMatch(input) {
    const ni = normalize(input);
    if (!ni) return null;
    const matches = [];
    
    KNOWLEDGE_BASE.forEach(entry => {
        const ne = normalize(entry.input);
        if (ni === ne) { matches.push({ entry, score: 1 }); return; }
        if (ni.includes(ne) || ne.includes(ni)) { matches.push({ entry, score: 0.85 }); return; }
        const ov = overlap(ni, ne);
        if (ov > 0.2) matches.push({ entry, score: ov });
    });
    
    if (matches.length === 0) return null;
    matches.sort((a, b) => b.score - a.score);
    const top = matches.filter(m => m.score >= matches[0].score - 0.1);
    return top[Math.floor(Math.random() * top.length)].entry.output;
}

// ============ RESPONSE ============

async function getResponse(input) {
    // 0. MATH - Check first and highest priority
    const mathResult = solveMath(input);
    if (mathResult) return mathResult;
    
    // 1. Exact match
    const match = findMatch(input);
    if (match) return match;
    
    // 2. Neural network
    if (modelTrained) {
        const nn = await nnPredict(input);
        if (nn && nn.length > 3) return nn;
    }
    
    // 3. Paragraph word generation
    const words = normalize(input).split(' ');
    for (const word of words) {
        const closest = findClosestWord(word);
        if (closest) {
            const gen = generateFromWords(closest);
            if (gen && gen.length > 3) return gen;
        }
    }
    
    // 4. Random
    const rand = starters[Math.floor(Math.random() * starters.length)];
    const gen = generateFromWords(rand);
    return gen || "I don't know what to say.";
}

// ============ UI ============

function addToMemory(user, bot) {
    memory.push({ user, bot });
    if (memory.length > MAX_MEMORY) memory.shift();
}

function addMessage(text, sender) {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    div.className = `message ${sender}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = `avatar ${sender === 'user' ? 'user-avatar' : 'bot-avatar'}`;
    
    if (sender === 'user') {
        avatarDiv.textContent = 'U';
    } else {
        // Bot avatar with image
        const img = document.createElement('img');
        img.src = 'damba.webp';
        img.alt = 'Dambar';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
        avatarDiv.appendChild(img);
    }
    
    const messageTextDiv = document.createElement('div');
    messageTextDiv.className = 'message-text';
    messageTextDiv.textContent = text;
    
    div.appendChild(avatarDiv);
    div.appendChild(messageTextDiv);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.id = 'typingIndicator';
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar bot-avatar';
    const img = document.createElement('img');
    img.src = 'damba.webp';
    img.alt = 'Dambar';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '50%';
    avatarDiv.appendChild(img);
    
    const dotsDiv = document.createElement('div');
    dotsDiv.className = 'typing-dots';
    dotsDiv.innerHTML = '<span></span><span></span><span></span>';
    
    div.appendChild(avatarDiv);
    div.appendChild(dotsDiv);
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
}

async function sendMessage() {
    const input = document.getElementById('userInput');
    const btn = document.getElementById('sendBtn');
    const msg = input.value.trim();
    if (!msg) return;
    input.disabled = true;
    btn.disabled = true;
    addMessage(msg, 'user');
    input.value = '';
    showTyping();
    const response = await getResponse(msg);
    hideTyping();
    addMessage(response, 'bot');
    addToMemory(msg, response);
    input.disabled = false;
    btn.disabled = false;
    input.focus();
}

window.addEventListener('load', async () => {
    buildWordModel();
    addMessage('👋 Ni Hao gng!', 'bot');
    await trainNN(30);
    addMessage('Hello! I am Dambar. Ask me anything, give me math problems, or just chat!', 'bot');
    document.getElementById('userInput').focus();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement === document.getElementById('userInput')) {
        e.preventDefault();
        sendMessage();
    }
});