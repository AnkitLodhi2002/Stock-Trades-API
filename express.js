const express = require('express');
const fs = require('fs');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 3000;
const tradesFile = 'trades.json';

// Middleware for logging requests with Morgan in development mode
app.use(morgan('dev'));

// Function to read trades from the JSON file
const readTrades = () => {
  try {
    const data = fs.readFileSync(tradesFile, 'utf8');
    return JSON.parse(data) || [];
  } catch (err) {
    console.error('Error reading trades file:', err);
    return [];
  }
};

// Function to write trades to the JSON file
const writeTrades = (trades) => {
  try {
    fs.writeFileSync(tradesFile, JSON.stringify(trades, null, 2));
  } catch (err) {
    console.error('Error writing trades file:', err);
  }
};

// Function to generate a unique ID for a new trade
const getNextId = (trades) => {
  return trades.length === 0 ? 1 : Math.max(...trades.map(trade => trade.id)) + 1;
};

// Function to validate a trade object
const validateTrade = (trade) => {
  const requiredFields = ['type', 'user_id', 'symbol', 'shares', 'price'];
  return requiredFields.every(field => trade.hasOwnProperty(field));
};

// Function to validate share count
const validateShares = (shares) => {
  return shares >= 10 && shares <= 30;
};

// Route for GET all trades
app.get('/trades', (req, res) => {
  const trades = readTrades();
  res.json({ trades });
});

// Route for GET a trade by ID
app.get('/trades/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const trades = readTrades();
  const trade = trades.find(t => t.id === id);
  if (!trade) {
    return res.status(404).json({ message: 'Trade not found' });
  }
  res.json(trade);
});

// Route for POST a new trade
app.post('/trades', (req, res) => {
  const trade = req.body;
  if (!validateTrade(trade) || !validateShares(trade.shares)) {
    return res.status(400).json({ message: 'Invalid trade data' });
  }
  const trades = readTrades();
  trade.id = getNextId(trades);
  trades.push(trade);
  writeTrades(trades);
  res.status(201).json(trade); // Created status code
});

// Route for PATCH update trade price
app.patch('/trades/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const price = req.body.price;
  if (typeof price !== 'number') {
    return res.status(400).json({ message: 'Invalid price data' });
  }
  const trades = readTrades();
  const tradeIndex = trades.findIndex(t => t.id === id);
  if (tradeIndex === -1) {
    return res.status(404).json({ message: 'Trade not found' });
  }
  trades[tradeIndex].price = price;
  writeTrades(trades);
  res.json(trades[tradeIndex]);
});

// Route for DELETE a trade
app.delete('/trades/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const trades = readTrades().filter(trade => trade.id !== id);
  writeTrades(trades);
  res.sendStatus(204); // No Content status code
});

app.listen(port, () => console.log(`Server listening on port ${port}`));


