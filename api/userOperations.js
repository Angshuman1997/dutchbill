const express = require('express');
const { ObjectId } = require('mongodb');
const { connectToMongo, getDb, closeConnection } = require('./db');

const router = express.Router();

async function usersCollection() {
  await connectToMongo();
  return getDb().collection('users');
}

async function createUser(req, res) {
  try {
    const { name, username, password, emailId } = req.body;
    if (!name || !username || !password || !emailId) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const createddate = new Date();
    const updateddate = createddate;
    const user = { name, username, password, emailId, createddate, updateddate };

    const users = await usersCollection();
    const result = await users.insertOne(user);
    res.status(201).json(result);
  } catch (error) {
    console.error(error);
  } finally {
    await closeConnection();
  }
}

async function readUsers(req, res) {
  try {
    const users = await usersCollection();
    const userList = await users.find().toArray();
    res.status(200).json(userList);
  } catch (error) {
    console.error(error);
  } finally {
    await closeConnection();
  }
}

async function readUserByUserName(req, res) {
  try {
    const users = await usersCollection();
    const user = await users.findOne({ username: new ObjectId(req.params.username) });
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
  } finally {
    await closeConnection();
  }
}

async function updateUserById(req, res) {
  try {
    const { name } = req.body;
    const updateddate = new Date();
    const updateFields = { name, updateddate };

    const users = await usersCollection();
    const result = await users.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateFields }
    );
    if (result.matchedCount > 0) {
      res.status(200).json({ message: 'User updated' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
  } finally {
    await closeConnection();
  }
}

async function deleteUserById(req, res) {
  try {
    const users = await usersCollection();
    const result = await users.deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount > 0) {
      res.status(200).json({ message: 'User deleted' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
  } finally {
    await closeConnection();
  }
}

async function checkUserExists(req, res) {
  try {
    const { username, emailId } = req.body;
    const users = await usersCollection();
    const user = await users.findOne({ emailId: emailId, username: username });
    if (user) {
      res.status(200).json({ message: 'exists' });
    } else {
      res.status(200).json({ message: 'not_exists' });
    }
  } catch (error) {
    console.error(error);
  } finally {
    await closeConnection();
  }
}

router.post('/', createUser);
router.get('/', readUsers);
router.get('/username/:username', readUserByUserName);
router.put('/:id', updateUserById);
router.delete('/:id', deleteUserById);
router.get('/check', checkUserExists);

module.exports = router;
