const { ObjectId } = require("mongodb");
const { connectToMongoDB, resetTimer } = require("../../database/db");
const bcrypt = require("bcrypt");
const { sendEmail } = require("../Email/EmailFunc");
const { generateMessageBody } = require("../Email/Template");
const saltRounds = 10;

const generateOTP = async () => {
  const { default: cryptoRandomString } = await import("crypto-random-string");
  return cryptoRandomString({ length: 6, type: "numeric" }); // Generates a 6-digit numeric OTP
};

// Encrypt Password
const hashPassword = async (password) => {
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

// Signup
const signupAccount = async (coll, fullName, username, email, password) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

  // account - exist , new, alert

  try {
    const existingItem = await collection.findOne({
      $or: [{ username: username }, { email: email }],
    });

    if (existingItem) {
      return {
        data: {
          message: "Item with the same username or email already exists",
          info: null,
          account: "exist",
        },
        status: 200,
      };
    }

    const hashedPassword = await hashPassword(password);

    const genOTP = await generateOTP();

    const result = await collection.insertOne({
      fullName: fullName,
      username: username,
      email: email,
      password: hashedPassword,
      createdBy: "self",
      otp: genOTP,
      accountInfo: "not-verified",
      accountType: "user",
      passwordReset: true,
    });

    const mesBody = generateMessageBody(fullName, genOTP);

    const sendResult = await sendEmail(
      process.env.EMAIL_USERNAME,
      email,
      "OTP Verification for DutchBill",
      mesBody,
      mesBody
    );

    if (sendResult.success) {
      setTimeout(async () => {
        await collection.updateOne(
          { username: username },
          { $set: { otp: 0 } }
        );
        
      }, 90000);
    }

    resetTimer(180000);

    delete result.password;

    return {
      data: {
        message: "Account Created, OTP sent to email",
        info: result,
        account: "new",
      },
      status: 200,
    };
  } catch (error) {
    return {
      data: { message: "Error SignUp", info: error, account: "alert" },
      status: 500,
    };
  }
};

// Login
const loginAccount = async (coll, username, password) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

  // account - valid, invalid, wrong, alert, reset_password

  try {
    const result = await collection.findOne({
      $or: [{ username: username }],
    });

    if (result) {
      if (result.passwordReset === true) {
        delete result.password;
        return {
          data: {
            message: "Reset account password",
            info: result,
            account: "valid",
          },
          status: 200,
        };
      }

      // Password verification
      const passwordMatch = await bcrypt.compare(password, result.password);
      if (passwordMatch) {
        // Password matches, return user data

        resetTimer(); // Reset the timer on successful operation

        delete result.password;

        return {
          data: { message: "Logged In", info: result, account: "valid" },
          status: 200,
        };
      } else {
        // Password does not match
        return {
          data: { message: "Incorrect password", info: null, account: "wrong" },
          status: 401,
        };
      }
    } else {
      // User not found
      return {
        data: {
          message: "Account does not exist",
          info: null,
          account: "invalid",
        },
        status: 404,
      };
    }
  } catch (error) {
    // Error handling
    return {
      data: { message: "Error", info: error, account: "alert" },
      status: 500,
    };
  }
};

// Update
const updateAccount = async (coll, accountId, updateInfo) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

  // info - success, fail

  const keys = Object.keys(updateInfo);
  let keysString = "";
  if (keys.length === 1) {
    keysString = keys[0];
  } else if (keys.length > 1) {
    keysString = keys.slice(0, -1).join(", ") + " and " + keys[keys.length - 1];
  }

  try {
    await collection.updateOne(
      { _id: new ObjectId(accountId) },
      { $set: updateInfo }
    );
    // console.log("Updated item:", itemId);
    resetTimer(); // Reset the timer on successful operation
    return {
      data: {
        message: `Updated Field - ${keysString}`,
        accountId: accountId,
        info: "success",
      },
      status: 200,
    };
  } catch (error) {
    // console.error("Error updating item:", error);
    return {
      data: { message: error, accountId: null, info: "fail" },
      status: 500,
    };
  }
};

// Delete
const deleteAccount = async (coll, accountId) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

  // account - deleted, invalid, alert

  try {
    const result = await collection.deleteOne({
      _id: new ObjectId(accountId),
    });

    resetTimer(); // Reset the timer on successful operation

    if (result.deletedCount === 1) {
      return {
        data: {
          message: `Account deleted`,
          account: "deleted",
          info: { accountId: accountId },
        },
        status: 200,
      };
    } else {
      return {
        data: { message: `Account not found`, account: "invalid", info: null },
        status: 404,
      };
    }
  } catch (error) {
    return {
      data: { message: "Error", account: "alert", info: error },
      status: 500,
    };
  }
};

// Search
const searchAccount = async (coll, search) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

  // accounts - yes, no, alert

  // Ensure search is a string and not undefined or empty
  const searchRegex = search ? search.toString() : "";

  try {
    const result = await collection
      .find(
        {
          $or: [
            { username: { $regex: searchRegex, $options: "i" } }, // Case-insensitive regex for username
            { email: { $regex: searchRegex, $options: "i" } } // Case-insensitive regex for email
          ],
        },
        { projection: { password: 0 } } // Exclude the password field
      )
      .toArray();

    if (result.length > 0) {
      resetTimer(); // Reset the timer on successful operation
      return {
        data: {
          message: `Found ${result.length} accounts`,
          info: result,
          accounts: "yes",
        },
        status: 200,
      };
    } else {
      return {
        data: { message: `Found 0 accounts`, info: [], accounts: "no" },
        status: 404,
      };
    }
  } catch (error) {
    return {
      data: { message: "Error", info: error, accounts: "alert" },
      status: 500,
    };
  }
};

const otpVerify = async (coll, username, otp) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);
  try {
    const result = await collection.findOne({
      $or: [{ username: username }],
    });

    if (result) {
      if (result.otp === otp) {
        await collection.updateOne(
          { _id: new ObjectId(result._id) },
          { $set: { otp: 0, accountInfo: "verified", passwordReset: false } }
        );

        return { success: true };
      } else {
        return { success: false };
      }
    } else {
      // User not found
      return {
        data: {
          message: "Account does not exist",
          info: null,
          account: "invalid",
        },
        status: 404,
      };
    }
  } catch (error) {
    // Error handling
    return {
      data: { message: "Error", info: error, account: "alert" },
      status: 500,
    };
  }
};

// Forgot/ Update Password
const forgotAccount = async (coll, username, password) => {
  // password is new password
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

  try {
    const result = await collection.findOne({
      $or: [{ username: username }],
    });

    if (result) {
      
      const hashedPassword = await hashPassword(password);
      const genOTP = await generateOTP();
      const oldPass = result.password;
      
      await collection.updateOne(
        { _id: new ObjectId(result._id) },
        { $set: { otp: genOTP, password: hashedPassword, passwordReset: true } }
      );
      
      const mesBody = generateMessageBody(result.fullName, genOTP);

      
      const sendResult = await sendEmail(
        process.env.EMAIL_USERNAME,
        result.email,
        "OTP Verification for DutchBill",
        mesBody,
        mesBody
      );
      
      if (sendResult.success) {
        
        setTimeout(async () => {
          const result2 = await collection.findOne({
            $or: [{ username: username }],
          });
          
          if (result2.passwordReset) {
            await collection.updateOne(
              { _id: new ObjectId(result._id) },
              { $set: { otp: 0, password: oldPass } }
            );
          } else {
            await collection.updateOne(
              { _id: new ObjectId(result._id) },
              { $set: { otp: 0 } }
            );
          }
        }, 120000);
      }

      resetTimer(); // Reset the timer on successful operation

      delete result.password;

      return {
        data: { message: "Password Changed", info: result, account: "valid" },
        status: 200,
      };
    } else {
      // User not found
      return {
        data: {
          message: "Account does not exist",
          info: null,
          account: "invalid",
        },
        status: 404,
      };
    }
  } catch (error) {
    // Error handling
    return {
      data: { message: "Error Forgot", info: error, account: "alert" },
      status: 500,
    };
  }
};

module.exports = {
  signupAccount,
  loginAccount,
  updateAccount,
  deleteAccount,
  searchAccount,
  forgotAccount,
  otpVerify,
};
