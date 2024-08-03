// userOperations.js
const express = require('express');
const { ObjectId } = require('mongodb');
const { getDb } = require('./db');

const router = express.Router();

const usersCollection = () => getDb().collection('users');

// Create a user
router.post('/', async (req, res, next) => {
  try {
    const result = await usersCollection().insertOne(req.body);
    res.status(201).json(result.ops[0]);
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
});

// Read users
router.get('/', async (req, res, next) => {
  try {
    const users = await usersCollection().find().toArray();
    res.status(200).json(users);
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
});

// Read a specific user by ID
router.get('/:id', async (req, res, next) => {
  try {
    const user = await usersCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
});

// Update a user by ID
router.put('/:id', async (req, res, next) => {
  try {
    const result = await usersCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    if (result.matchedCount > 0) {
      res.status(200).json({ message: 'User updated' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
});

// Delete a user by ID
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await usersCollection().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount > 0) {
      res.status(200).json({ message: 'User deleted' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
});

module.exports = router;
