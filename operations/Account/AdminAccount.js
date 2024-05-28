const { ObjectId } = require("mongodb");
const { connectToMongoDB, resetTimer } = require("../../database/db");

// All  Account
const allAccounts = async (coll) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

  // accounts - yes , no

  try {
    const result = await collection
      .find({ projection: { password: 0 } })
      .toArray();
    // console.log("All items in collection:", result);

    resetTimer(); // Reset the timer on successful operation

    return {
      data: {
        message: `Found ${result.length} accounts`,
        info: result,
        accounts: "yes",
      },
      status: 200,
    };
  } catch (error) {
    // console.error("Error reading items:", error);
    return {
      data: { message: "Error", info: error, accounts: "no" },
      status: 500,
    };
  }
};

// Search Account
const searchAccounts = async (coll, username, email) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

  // accounts - yes, no, alert

  try {
    const result = await collection
      .find(
        {
          $or: [{ username: username }, { email: email }],
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

// Update Account
const updateAccounts = async (coll, accountId, updateInfo) => {
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

// Delete Accounts
const deleteAccounts = async (coll, accountIds) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

  try {
    const result = await collection.deleteMany({
      _id: { $in: accountIds.map((id) => new ObjectId(id)) },
    });

    resetTimer(); // Reset the timer on successful operation

    if (result.deletedCount > 0) {
      return {
        data: {
          message: `${result.deletedCount} account(s) deleted`,
          account: "deleted",
          info: { accountIds: accountIds },
        },
        status: 200,
      };
    } else {
      return {
        data: {
          message: `No accounts found for deletion`,
          account: "invalid",
          info: null,
        },
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

// Add Account
const addAccount = async (
  coll,
  username,
  email,
  password,
  bypass,
  accountType
) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

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

    const result = await collection.insertOne({
      fullName: fullName,
      username: username,
      email: email,
      password: hashedPassword,
      createdBy: "admin",
      otp: null,
      accountInfo: bypass ? "verified" : "not-verified",
      accountType: accountType,
      passwordReset: bypass ? false : true,
    });

    resetTimer(); // Reset the timer on successful operation

    delete result.password;

    return {
      data: {
        message: "Account Created",
        info: result,
        account: "new",
      },
      status: 200,
    };
  } catch (error) {
    return {
      data: { message: "Error", info: error, account: "alert" },
      status: 500,
    };
  }
};


module.exports = {
  allAccounts,
  updateAccounts,
  searchAccounts,
  deleteAccounts,
  addAccount,
};
