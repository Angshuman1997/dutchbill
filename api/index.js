const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { connectToMongo, getDb } = require('./db');
const userRoutes = require('./userOperations');
const expenseRoutes = require('./expenseOperations');
const admin = require('./firebaseAdmin');
const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(bodyParser.json());

// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors()); // Enable CORS for all routes
app.use(express.json());

app.use(async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).send('Unauthorized');
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Attach the decoded token to the request
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(401).send('Unauthorized');
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
