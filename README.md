# Dambar

A chatbot I built from scratch using vanilla JavaScript. No frameworks, no APIs, no external models. Just pure code.

## What it does

- Responds to messages using a local knowledge base
- Learns word patterns from paragraph data
- Has a neural network that trains in the browser
- Generates new sentences from learned words
- Works completely offline after loading

## How it works

Dambar uses three layers to respond:

1. **Pattern matching** - checks the knowledge base for a direct match
2. **Neural network** - a small LSTM model trained on the data
3. **Word generation** - builds new sentences from learned word relationships

## Files

- `index.html` - the chat interface
- `style.css` - black and white minimal styling
- `script.js` - the engine (matching, neural network, word generation)
- `training-data.js` - knowledge base and paragraph data

## Running it

Just open `index.html` in a browser. No server needed.

## Training data

Right now the knowledge base has 100+ Q&A pairs and 10 paragraphs for word learning. I'll be adding more data over time to make it smarter.

## What's next

- Add more training pairs
- Add more paragraph data for better generation
- Improve the neural network architecture
- Maybe add conversation memory across sessions

## Why I built this

Wanted to understand how chatbots actually work under the hood. Not just calling an API, but building the matching, training, and generation from scratch.

---

Made by [@rxt1k](https://github.com/rxt1k)
