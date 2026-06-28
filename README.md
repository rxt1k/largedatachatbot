![Dambar Chatbot](damba.webp)

# 🧠 Dambar - 

A chatbot built from scratch using vanilla JavaScript. No frameworks, no APIs, no external models. Just pure code and vibes fr.

## What it do 

- Responds to messages using a local knowledge base (200+ Q&A pairs)
- Learns word patterns from paragraph data
- Has a neural network that trains in your browser (TensorFlow.js)
- Generates new sentences from learned words
- **Advanced Math Engine** - solves complex expressions, quadratic equations, derivatives, integrals, and more
- Works completely offline after loading


## How it works 🧠

Dambar uses three layers to respond:

1. **Math Engine** - handles everything from `2+2` to `d/dx(3x²)` to quadratic equations
2. **Pattern matching** - checks the knowledge base for direct matches
3. **Neural Network** - a small LSTM model trained on the data (30 epochs)
4. **Word generation** - builds new sentences from learned word relationships

## Math Engine Features 🔢

- Basic arithmetic: `2 + 2`, `10 * 5`, `100 / 4`
- Complex expressions: `(2+3)*4`, `10-(2+3)`
- Quadratic equations: `2x² + 3x - 5 = 0`
- Derivatives: `d/dx(3x²)` → `6x`
- Integrals: `∫ 2x dx` → `x² + C`
- Systems of equations: `2x + 3y = 5 and 4x - y = 3`
- Matrix determinants: `det[1 2; 3 4]`
- Combinations & Permutations: `5C2`, `4P2`
- Trig functions: `sin(30)`, `cos(60)`, `tan(45)`
- Logarithms: `log(100)`, `ln(e)`
- Factorials: `5!`, `10!`
- And more!

## Files 📁

- `index.html` - the chat interface with profile pic
- `style.css` - dark mode minimal styling
- `script.js` - the engine (matching, neural network, word generation)
- `maths.js` - standalone advanced math engine
- `training-data.js` - knowledge base (200+ entries) and paragraph data

## Running it 🚀

Just open `index.html` in a browser. No server needed. 

Make sure you have `damba.webp` in the same directory for the profile picture!

## Training Data 📚

- **200+ Q&A pairs** with full Gen Z slang (dw, fr, no cap, deadass, bet, etc.)
- **15 paragraphs** for word learning
- Constantly improving with more data over time

## Tech Stack 🛠️

- Vanilla JavaScript (no frameworks)
- TensorFlow.js for neural network (LSTM)
- HTML5 + CSS3 (dark mode)
- Math engine built from scratch

## What's Next 🔮

- [ ] Add more training pairs
- [ ] More paragraph data for better generation
- [ ] Improve neural network architecture
- [ ] Conversation memory across sessions
- [ ] Voice input support
- [ ] Export/import conversation history

## Why I built this 💯

Wanted to understand how chatbots actually work under the hood. Not just calling an API, but building the matching, training, and generation from scratch. Also wanted to make something that actually feels like talking to a real person (with Gen Z vibes fr).

## Preview 🖼️

<img width="1037" height="923" alt="image" src="https://github.com/user-attachments/assets/e0de5ca5-9337-4753-9354-d3e4957aef62" />


---

**Made with 💀 by [@rxt1k](https://github.com/rxt1k)**

*"Keep it real, keep it vibin', keep it Dambar"* 🥀
