const express = require('express');
const { ObjectId } = require('mongodb');
const { connectToMongo, getDb, closeConnection } = require('./db');
const { sendEmail } = require('../Email/EmailFunc');
const {generateMessageBody} = require('../Email/Template');

const router = express.Router();

const generateOTP = async () => {
  const { default: cryptoRandomString } = await import("crypto-random-string");
  return cryptoRandomString({ length: 6, type: "numeric" }); // Generates a 6-digit numeric OTP
};

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
    const otp = await generateOTP();
    const user = { name, username, password, emailId, createddate, updateddate, otp };

    const mesBody = generateMessageBody(name, otp);

    

    const users = await usersCollection();
    const result = await users.insertOne(user);

    const sendResult = await sendEmail(
      process.env.EMAIL_USERNAME,
      emailId,
      "OTP Verification for DutchBill",
      mesBody,
      mesBody
    );

    if (!sendResult.success) {
      await users.deleteOne({ _id: new ObjectId(result.insertedId) });
      res.status(404).json({success: false, message: "Failed to create new user"});
    } else{
      res.status(201).json({...result, success: true, message: "Success on create new user at database"});
    }
    
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
    const user = await users.findOne({ username: req.params.username });
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
    const { name, formType, password } = req.body;
    const updateddate = new Date();
    const updateFields = { updateddate };

    if(formType === 'forgetpass') {
      updateFields.password = password;
    } else{
      updateFields.name = name;
    }

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

async function otpAction(req, res) {
  try {
    const users = await usersCollection();
    const { id, onTime, otpValue, resend, name, emailId, formType } = req.body;
    const updateddate = new Date();
    if(resend){
      const otp = await generateOTP();
      const mesBody = generateMessageBody(name, otp);
      
      if(formType==="forgetpass"){
        await users.updateOne({ emailId: emailId },
        { $set: {otp: otp, updateddate: updateddate} });
      } else{
        await users.updateOne({ _id: new ObjectId(id) },
        { $set: {otp: otp, updateddate: updateddate} });
      }

      const sendResult = await sendEmail(
        process.env.EMAIL_USERNAME,
        emailId,
        "OTP Verification for DutchBill",
        mesBody,
        mesBody
      );

      if (!sendResult.success) {
        await users.updateOne({ _id: new ObjectId(id) },
        { $set: {otp: ''} })
        res.status(404).json({success: false, message: "Failed to generate otp"});
      } else{
        res.status(201).json({...sendResult, success: true, message: "OTP generate success"});
      }
    } else if(onTime && !resend){
      const userDataFetch = await users.findOne({ _id: new ObjectId(id) });
      if(userDataFetch.otp === otpValue) {
        await users.updateOne({ _id: new ObjectId(id) },
        { $set: {otp: '', updateddate: updateddate} })
        res.status(200).json({ otpVerification: true });
      } else{
        res.status(200).json({ otpVerification: false });
      }
    } else{
      if(formType === 'signup'){
        await users.deleteOne({ _id: new ObjectId(id) });
      } else{
        await users.updateOne({ emailId: emailId },
        { $set: {otp: ''} });
      }
      
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
router.post('/otp', otpAction);

module.exports = router;
