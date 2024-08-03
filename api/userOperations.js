const express = require('express');
const { ObjectId } = require('mongodb');
const { connectToMongo, getDb } = require('./db');

const router = express.Router();

const usersCollection = () => connectToMongo().collection('users');

async function createUser(req, res, next) {
  try {
    const { name, username, password, emailId } = req.body;
    if (!name || !username || !password || !emailId) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const createddate = new Date();
    const updateddate = createddate;
    const user = { name, username, password, emailId, createddate, updateddate };

    const result = await usersCollection().insertOne(user);
    res.status(201).json(result.ops[0]);
  } catch (error) {
    next(error);
  }
}

async function readUsers(req, res, next) {
  try {
    const users = await usersCollection().find().toArray();
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
}

async function readUserById(req, res, next) {
  try {
    const user = await usersCollection().findOne({ _id: new ObjectId(req.params.id) });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
}

async function updateUserById(req, res, next) {
  try {
    const { name } = req.body;
    const updateddate = new Date();
    const updateFields = { name, updateddate };

    const result = await usersCollection().updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    );
    if (result.matchedCount > 0) {
      res.status(200).json({ message: 'User updated' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
}

async function deleteUserById(req, res, next) {
  try {
    const result = await usersCollection().deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount > 0) {
      res.status(200).json({ message: 'User deleted' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
}

async function checkUserExists(req, res, next) {
  try {
    const user = await usersCollection().findOne({ emailId: req.params.emailId });
    if (user) {
      res.status(200).json({ message: 'User exists' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    next(error);
  }
}

router.post('/', createUser);
router.get('/', readUsers);
router.get('/:id', readUserById);
router.put('/:id', updateUserById);
router.delete('/:id', deleteUserById);
router.get('/check/:emailId', checkUserExists);

module.exports = router;
