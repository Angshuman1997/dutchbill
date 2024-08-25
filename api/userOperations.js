const express = require("express");
const { ObjectId } = require("mongodb");
const { connectToMongo, getDb } = require("./db");

const router = express.Router();

async function usersCollection() {
  await connectToMongo();
  return getDb().collection("users");
}

async function createUser(req, res) {
  try {
    const { firebaseName, appUserName, username, emailId } = req.body;
    const createddate = new Date();
    const updateddate = createddate;
    const expenseData = [];
    const user = {
      appUserName,
      firebaseName,
      username,
      emailId,
      createddate,
      updateddate,
      expenseData,
    };

    const users = await usersCollection();
    const result = await users.insertOne(user);

    if (result && result.insertedId) {
      return res.status(201).json({
        data: {
          _id: result.insertedId,
          username: username,
          name: appUserName,
          emailId: emailId,
        },
        success: true,
        status: 201,
        message: "New Account Created",
      });
    } else {
      return res
        .status(404)
        .json({
          data: {},
          success: false,
          status: 404,
          message: "Failed to create new account",
        });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      status: 500,
      data: {},
      message: "Something went wrong !",
      error: error,
    });
  }
}

async function searchUsers(req, res) {
  try {
    const users = await usersCollection();
    const { search, userId, fetchType, alreadySelectedIds } = req.body;

    let refineUserList;

    if (fetchType === "search" && search) {
      let filter = {};
      filter.appUserName = { $regex: search, $options: "i" };

      const tempAlreadySelectedIds =
        alreadySelectedIds.map((i) => new ObjectId(i)) || [];

      const allIds = [...[new ObjectId(userId)], ...tempAlreadySelectedIds];

      filter._id = { $nin: allIds };

      refineUserList = await users
        .find(filter, { projection: { username: 1, appUserName: 1, _id: 1 } })
        .toArray();
    } else if (fetchType === "search" && !search) {
      refineUserList = [];
    } else {
      const userList = await users
        .find({}, { projection: { username: 1, appUserName: 1, _id: 1 } })
        .toArray();

      refineUserList = userList.filter(
        (i) => !new ObjectId(i._id).equals(new ObjectId(userId))
      );
    }

    return res.status(200).json(refineUserList);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching users." });
  }
}

async function fetchUserCreds(req, res) {
  try {
    const users = await usersCollection();
    const { userEmail } = req.body;

    const user = await users.findOne(
      { emailId: userEmail },
      { projection: { username: 1, appUserName: 1, _id: 1, emailId: 1 } }
    );

    if (user) {
      const tempuser = { ...user };
      tempuser.name = tempuser.appUserName;
      delete tempuser.appUserName;

      return res.status(200).json({
        success: true,
        status: 200,
        data: tempuser,
        message: `Welcome ${tempuser.name}`,
      });
    } else {
      return res
        .status(201)
        .json({
          success: true,
          status: 201,
          message: "New user, please add creds",
        });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Something went wrong !",
      error: error,
    });
  }
}

async function updateUser(req, res) {
  try {
    const { name, userId } = req.body;
    const updateddate = new Date();
    const updateFields = { updateddate };

    updateFields.appUserName = name;

    const users = await usersCollection();

    const result = await users.updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateFields }
    );

    if (result.matchedCount > 0) {
      return res
        .status(200)
        .json({ success: true, status: 200, message: "Information updated" });
    } else {
      return res
        .status(404)
        .json({ success: false, status: 404, message: "Failed to update" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Something went wrong !",
      error: error,
    });
  }
}

async function deleteUser(req, res) {
  try {
    const users = await usersCollection();
    const result = await users.deleteOne({ _id: new ObjectId(req.body.userId) });
    if (result.deletedCount > 0) {
      return res
        .status(200)
        .json({ success: true, status: 201, message: "Account deleted" });
    } else {
      return res
        .status(404)
        .json({
          success: true,
          status: 404,
          message: "Account failed to delete",
        });
    }
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        status: 500,
        message: "Something went wrong",
        error: error,
      });
  }
}

router.post("/createuser", createUser);
router.post("/searchuser", searchUsers);
router.post("/fetchuser", fetchUserCreds);
router.post("/updateuser", updateUser);
router.post("/deleteuser", deleteUser);

module.exports = router;
