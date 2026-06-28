// ==========================================
// Dambar - Neural Network + Paragraph Engine
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

// ============ MATH ENGINE ============

function solveMath(input) {
    const text = input.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Check if it's a math question
    const mathKeywords = ['what is', 'calculate', 'solve', 'compute', 'evaluate', 'math', 
                          'plus', 'minus', 'times', 'divided by', 'multiplied by', 'power',
                          'sqrt', 'square root', 'percent', 'factorial', 'abs', 'mod', 'modulo',
                          'round', 'ceil', 'floor', 'log', 'ln', 'sin', 'cos', 'tan', 'pi'];
    
    let isMath = false;
    for (const keyword of mathKeywords) {
        if (text.includes(keyword)) {
            isMath = true;
            break;
        }
    }
    
    // If no math keywords and no numbers with operators, return null
    if (!isMath && !/\d/.test(text)) return null;
    if (!isMath && !/[+\-*/^]/.test(text)) return null;
    
    // Try to solve various math expressions
    
    // 1. BASIC ARITHMETIC with operators
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
    
    // 14. SINE
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
    try {
        // Check if it's a simple arithmetic expression with numbers and operators
        const cleanExpr = text.replace(/[^0-9+\-*/().]/g, '');
        if (cleanExpr.length > 1 && /[+\-*/]/.test(cleanExpr)) {
            const result = new Function(`return (${cleanExpr})`)();
            if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
                const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
                return `${cleanExpr} = ${formatted}`;
            }
        }
    } catch (e) {
        // Ignore evaluation errors
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
    const cls = sender === 'user' ? 'user-avatar' : 'bot-avatar';
    const letter = sender === 'user' ? 'U' : 'D';
    div.innerHTML = `<div class="avatar ${cls}">${letter}</div><div class="message-text">${text}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function showTyping() {
    const container = document.getElementById('chatContainer');
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.id = 'typingIndicator';
    div.innerHTML = `<div class="avatar bot-avatar">D</div><div class="typing-dots"><span></span><span></span><span></span></div>`;
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
    addMessage('Training neural network...', 'bot');
    await trainNN(30);
    addMessage('Hello! I am Dambar. Ask me anything or give me math problems!', 'bot');
    document.getElementById('userInput').focus();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement === document.getElementById('userInput')) {
        e.preventDefault();
        sendMessage();
    }
});