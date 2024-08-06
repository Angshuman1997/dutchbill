const express = require('express');
const { ObjectId } = require('mongodb');
const { connectToMongo, getDb } = require('./db');
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
      res.status(201).json({...result, success: true, message: "OTP sent to the given email ID"});
    }
    
  } catch (error) {
    console.error(error);
    res.status(500).json({success: false, message: "Something went wrong !", error: error});
  }
}

async function readUsers(req, res) {
  try {
    const users = await usersCollection();
    const userList = await users.find().toArray();
    res.status(200).json(userList);
  } catch (error) {
    console.error(error);
  }
}

async function readSingleUser(req, res) {
  try {
    const users = await usersCollection();
    const { userId, username, userEmail } = req.body;
    let user;
    if(userId){
      user = await users.findOne({ _id: new ObjectId(userId) });
    } else if(username){
      user = await users.findOne({ username: username });
    } else if(userEmail) {
      user = await users.findOne({ emailId: userEmail });
    } else {
      res.status(404).json({success: false, status: 404, message: "Atleast any one id, email or username is required"});
    }

    if (user) {
      res.status(200).json({success: true, status: 200, data: user, message: "User found"});
    } else {
      res.status(404).json({ success: false, status: 404, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, status: 500, message: 'Something went wrong !', error: error });
  }
}

async function updateUser(req, res) {
  try {
    const { name, formType, password, username, userEmail, userId } = req.body;
    const updateddate = new Date();
    const updateFields = { updateddate };

    if(formType === 'forgetpass') {
      updateFields.password = password;
    } else {
      updateFields.name = name;
    }

    const users = await usersCollection();

    let result;

    if(userId){
      result = await users.updateOne({ _id: new ObjectId(req.params.id)},{ $set: updateFields });
    } else if(username){
      result = await users.updateOne({ username: username}, { $set: updateFields });
    } else if(userEmail){
      result = await users.updateOne({ emailId: userEmail}, { $set: updateFields });
    } else {
      res.status(404).json({success: false, status: 404, message: "Atleast any one user id, email ID or username is required"});
    }
    
    if (result.matchedCount > 0) {
      res.status(200).json({ success: true, status: 200, message: 'Information updated' });
    } else {
      res.status(404).json({ success: false, status: 404, message: 'Failed to update' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, status: 500, message: 'Something went wrong !', error: error });
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
        { $set: {otp: '', updateddate: updateddate} });
        res.status(200).json({ otpVerification: true,  message: "OTP Verified !!!"});
      } else{
        res.status(404).json({ otpVerification: false, message: "Please check the otp sent on the email ID"});
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
    res.status(500).json({ otpVerification: false, message: "Something went wrong !", error: error});
  }
}

async function checkUserExists(req, res) {
  try {
    const { username, userEmail, formType } = req.body;
    const users = await usersCollection();
    let user;

    if(formType === "signup") {
      if(!username && !userEmail){
        res.status(404).json({success: false, status: 404, message: "Both username and email ID are required"});
      }
      user = await users.findOne({ username: username, emailId: userEmail });
    } else{
      if(username){
        user = await users.findOne({ username: username });
      } else if(userEmail) {
        user = await users.findOne({ emailId: userEmail });
      } else{
        res.status(404).json({success: false, status: 404, message: "Atleast any one email ID or username is required"});
      }
    }
    
    if (user) {
      res.status(200).json({ userExists: true, status: 200, message: "User Already exists, go forget password to change password!" });
    } else {
      res.status(201).json({ userExists: false, status: 201, message: "User does not exists" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ userExists: false, status: 500, message: "Something went wrong !", error: error });
  }
}

router.post('/create', createUser);
router.get('/allUsers', readUsers);
router.get('/singleUser', readSingleUser);
router.put('/update', updateUser);
router.delete('/delete/:id', deleteUserById);
router.get('/check', checkUserExists);
router.post('/otp', otpAction);

module.exports = router;
