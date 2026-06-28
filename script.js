// ==========================================
// Dambar - Neural Network + Paragraph Engine + Math
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
    
    const patterns = [
        /(?:what is |calculate |solve |compute |evaluate |math )?(-?\d+\.?\d*)\s*([+\-*\/^])\s*(-?\d+\.?\d*)/,
        /(?:what is |calculate |solve |compute |evaluate |math )?(-?\d+\.?\d*)\s*(plus|minus|times|divided by|multiplied by|power)\s*(-?\d+\.?\d*)/,
    ];
    
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
            let num1 = parseFloat(match[1]);
            let operator = match[2];
            let num2 = parseFloat(match[3]);
            
            const wordOps = {
                'plus': '+', 'minus': '-', 'times': '*',
                'multiplied by': '*', 'divided by': '/', 'power': '^'
            };
            
            if (wordOps[operator]) operator = wordOps[operator];
            
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
            const symbol = { '+': '+', '-': '-', '*': 'x', '/': '/', '^': '^' }[operator];
            return `${num1} ${symbol} ${num2} = ${formatted}`;
        }
    }
    
    // Square root
    const sqrtMatch = text.match(/(?:square root of |sqrt of |sqrt )(-?\d+\.?\d*)/);
    if (sqrtMatch) {
        const num = parseFloat(sqrtMatch[1]);
        if (num < 0) return "Square root of a negative number is not a real number.";
        const result = Math.sqrt(num);
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
        return `sqrt(${num}) = ${formatted}`;
    }
    
    // Percentage
    const pctMatch = text.match(/(?:what is |calculate )?(-?\d+\.?\d*)\s*(?:%|percent)\s*of\s*(-?\d+\.?\d*)/);
    if (pctMatch) {
        const pct = parseFloat(pctMatch[1]);
        const num = parseFloat(pctMatch[2]);
        const result = (pct / 100) * num;
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(2));
        return `${pct}% of ${num} = ${formatted}`;
    }
    
    // Power
    const powMatch = text.match(/(-?\d+\.?\d*)\s*(?:\^|to the power of|power)\s*(-?\d+\.?\d*)/);
    if (powMatch) {
        const base = parseFloat(powMatch[1]);
        const exp = parseFloat(powMatch[2]);
        const result = Math.pow(base, exp);
        const formatted = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
        return `${base}^${exp} = ${formatted}`;
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
    // 0. MATH - Calculate first
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
    addMessage('Hello.', 'bot');
    document.getElementById('userInput').focus();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && document.activeElement === document.getElementById('userInput')) {
        e.preventDefault();
        sendMessage();
    }
});