const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectToMongo, getDb } = require('./db');
const userRoutes = require('./userOperations');
const expenseRoutes = require('./expenseOperations');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(bodyParser.json());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors()); // Enable CORS for all routes
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
app.use('/api/user', userRoutes);
app.use('/api/expense', expenseRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server after connecting to MongoDB
connectToMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to start server due to MongoDB connection error', error);
  process.exit(1);
});

module.exports = app;
