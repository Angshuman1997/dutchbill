// index.js
const express = require('express');
const { connectToMongo } = require('./db');
const userRoutes = require('./userOperations');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    if (getDb()) {
      res.status(200).send('Server is healthy');
    } else {
      res.status(500).send('Server is not connected to MongoDB');
    }
  } catch (error) {
    res.status(500).send('Server is not connected to MongoDB');
  }
});

// User routes
app.use('/users', userRoutes);

// Start the server after connecting to MongoDB
connectToMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
  });
});

module.exports = app;
