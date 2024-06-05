const { ObjectId } = require("mongodb");
const { connectToMongoDB } = require("../../database/db");

// create group
const createGroup = async (coll, accountId, groupName, members) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);
  const accountCollection = database.collection("account");
  const idsArray = members.map((item) => new ObjectId(item.accountId));

  try {
    const userAccount = await accountCollection.findOne({
      $or: [{ _id: new ObjectId(accountId) }],
    });

    if (userAccount) {
      const result = await collection.insertOne({
        groupName: groupName,
        createdBy: userAccount.fullName,
        createdById: new ObjectId(userAccount._id),
        members: members,
        expenses: [],
        summary: {},
        allSettled: true,
      });

      await accountCollection.updateMany(
        { _id: { $in: idsArray } },
        {
          $push: {
            groups: {
              groupName: groupName,
              groupId: new ObjectId(result.insertedId),
            },
          },
        }
      );

      return {
        status: 200,
        info: result,
        success: true,
        message: "Group created",
      };
    } else {
      return {
        status: 204,
        info: {},
        message: "User Exist Error",
        success: false,
      };
    }
  } catch (error) {
    return {
      status: 500,
      info: error,
      success: false,
      message: "Group Creation Error",
    };
  }
};

// delete group
const deleteGroup = async (coll, accountId, groupId) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);
  const accountCollection = database.collection("account");

  try {
    const userAccount = await accountCollection.findOne({
      $or: [{ _id: new ObjectId(accountId) }],
    });

    const groupInfo = await collection.findOne({
      $or: [{ _id: new ObjectId(groupId) }],
    });

    if (!userAccount) {
      return {
        status: 204,
        info: {},
        message: "User Exist Error",
        success: false,
      };
    }

    if (!groupInfo) {
      return {
        status: 204,
        info: {},
        message: "Group Exist Error",
        success: false,
      };
    }

    const members = groupInfo.members;
    const idsArray = members.map((item) => new ObjectId(item.accountId));

    if (groupInfo.allSettled === true) {
      const deleteGroupFunc = await collection.deleteOne({
        _id: new ObjectId(groupId),
      });

      await accountCollection.updateMany(
        { _id: { $in: idsArray } },
        { $pull: { groups: { groupId: new ObjectId(groupId) } } }
      );

      return {
        status: 200,
        info: deleteGroupFunc,
        groupId: groupId,
        success: true,
        message: "Group Deleted",
      };
    } else {
      return {
        status: 200,
        info: groupInfo.summary,
        success: true,
        message: "Group can not be deleted due to unsettled expenses",
      };
    }
  } catch (error) {
    return {
      status: 500,
      info: error,
      success: false,
      message: "Group Deletion Error",
    };
  }
};

// add to group
const addToGroup = async (coll, adderId, addIdlist, groupId) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);
  const accountCollection = database.collection("account");

  try {
    const adderAccount = await accountCollection.findOne({
      $or: [{ _id: new ObjectId(adderId) }],
    });

    if (!adderAccount) {
      return {
        status: 204,
        info: {},
        message: "User adder exist error",
        success: false,
      };
    }

    const groupInfo = await collection.findOne({
      $or: [{ _id: new ObjectId(groupId) }],
    });

    if (!groupInfo) {
      return {
        status: 204,
        info: {},
        message: "Group Exist Error",
        success: false,
      };
    }

    let idsArray = [];

    addIdlist.forEach(async (item) => {
      const addAccount = await accountCollection.findOne({
        $or: [{ _id: new ObjectId(item) }],
      });

      if (!addAccount) {
        return {
          status: 204,
          info: { accountId: new ObjectId(item) },
          message: `Account ${addAccount.fullName} does not Exist`,
          success: false,
        };
      }

      idsArray.push(new ObjectId(item));

      await collection.updateMany(
        { _id: new ObjectId(groupId) },
        {
          $push: {
            members: {
              accountId: new ObjectId(addAccount._id),
              fullName: addAccount.fullName,
            },
          },
        }
      );
    });

    await accountCollection.updateMany(
      { _id: { $in: idsArray } },
      {
        $push: {
          groups: {
            groupName: groupInfo.groupName,
            groupId: new ObjectId(groupId),
          },
        },
      }
    );

    return {
      status: 200,
      info: { adderId: adderId, addId: idsArray, groupId: groupId },
      success: true,
      message: `Users added to group ${groupInfo.groupName} by user ${adderAccount.fullName}`,
    };
  } catch (error) {
    return {
      status: 500,
      info: error,
      success: false,
      message: "Add account to group error",
    };
  }
};

// remove from group
const removeFromGroup = async (coll, removerId, removeList, groupId) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);
  const accountCollection = database.collection("account");

  try {
    const removerAccount = await accountCollection.findOne({
      $or: [{ _id: new ObjectId(removerId) }],
    });

    if (!removerAccount) {
      return {
        status: 204,
        info: {},
        message: "User remover exist error",
        success: false,
      };
    }

    const groupInfo = await collection.findOne({
      $or: [{ _id: new ObjectId(groupId) }],
    });

    if (!groupInfo) {
      return {
        status: 204,
        info: {},
        message: "Group Exist Error",
        success: false,
      };
    }

    let idsArray = [];

    removeList.forEach(async (item) => {
      const removeAccount = await accountCollection.findOne({
        $or: [{ _id: new ObjectId(item) }],
      });

      if (!removeAccount) {
        return {
          status: 204,
          info: { accountId: new ObjectId(item) },
          message: `Account ${removeAccount.fullName} does not Exist`,
          success: false,
        };
      }

      idsArray.push(new ObjectId(item));

      await collection.updateMany(
        { _id: new ObjectId(groupId) },
        {
          $pull: {
            members: {
              accountId: new ObjectId(removeAccount._id),
            },
          },
        }
      );
    });

    await accountCollection.updateMany(
      { _id: { $in: idsArray } },
      {
        $pull: { groups: { groupId: new ObjectId(groupId) } },
      }
    );

    return {
      status: 200,
      info: { removerId: removerId, removeId: idsArray, groupId: groupId },
      success: true,
      message: `Users removed from group ${groupInfo.groupName} by user ${removerAccount.fullName}`,
    };
  } catch (error) {
    return {
      status: 500,
      info: error,
      success: false,
      message: "Account removal error",
    };
  }
};

// all group
const allGroups = async (coll) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

  try {
    const allGroupsData = await collection
      .find(
        {},
        { projection: { _id: 1, groupName: 1, members: 1, allSettled: 1 } }
      )
      .toArray();
    return {
      status: 200,
      info: allGroupsData,
      success: true,
      message: "All groups fetched",
    };
  } catch (error) {
    return {
      status: 500,
      info: error,
      success: false,
      message: "Unable to fetch all the groups",
    };
  }
};

// search group
const searchGroup = async (coll, search) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

  try {
    // Build the query based on the search parameter
    const query = {};
    if (search) {
      query.groupName = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // Perform the search with the specified projection
    const groupData = await collection
      .find(query, {
        projection: { _id: 1, groupName: 1, members: 1, allSettled: 1 },
      })
      .toArray();

    return {
      status: 200,
      info: groupData,
      success: true,
      message:
        groupData.length === 0
          ? "No Data found"
          : "Search Groups fetched successfully",
    };
  } catch (error) {
    return {
      status: 500,
      info: error,
      success: false,
      message: "Unable to search the groups",
    };
  }
};

// read group details
const readGroup = async (coll, groupId) => {
  let connect = await connectToMongoDB();
  const database = connect.db();
  const collection = database.collection(coll);

  try {
    const groupInfo = await collection.findOne({
      $or: [{ _id: new ObjectId(groupId) }],
    });

    if (!groupInfo) {
      return {
        status: 204,
        info: {},
        message: "Group Exist Error",
        success: false,
      };
    }

    return {
      status: 200,
      info: groupInfo,
      success: true,
      message: "Group Details",
    };
  } catch (error) {
    return {
      status: 500,
      info: error,
      success: false,
      message: "Unable to fetch group details",
    };
  }
};

// const members = [
//   { accountId: "664f492698d2f2bb5e1a4347", fullName: "AB1" },
//   { accountId: "66586d38e01c83f4b4bce499", fullName: "AB2" },
//   { accountId: "66586d6fe01c83f4b4bce49b", fullName: "AB3" },
// ];

// createGroup("group", "664f492698d2f2bb5e1a4347", "BTM 4", members)
//   .then((res) => console.log(res))
//   .catch((err) => console.error(err));

// deleteGroup("group", "664f492698d2f2bb5e1a4347", "6658e1b64715cbff29bd58f1")
//   .then((res) => console.log(res))
//   .catch((err) => console.error(err));

// addToGroup(
//   "group",
//   "664f492698d2f2bb5e1a4347",
//   ["66586dd4e01c83f4b4bce49c"],
//   "6658dcebabaa4d246be2f59b"
// )
//   .then((res) => console.log(res))
//   .catch((err) => console.error(err));

// removeFromGroup(
//   "group",
//   "664f492698d2f2bb5e1a4347",
//   ["66586dd4e01c83f4b4bce49c"],
//   "6658dcebabaa4d246be2f59b"
// )
//   .then((res) => console.log(res))
//   .catch((err) => console.error(err));

// allGroups("group")
//   .then((res) => console.log(res))
//   .catch((err) => console.error(err));

// searchGroup("group", "T 2")
//   .then((res) => console.log(res))
//   .catch((err) => console.error(err));

// readGroup("group", "6658dcebabaa4d246be2f59b")
//   .then((res) => console.log(res))
//   .catch((err) => console.error(err));

module.exports = {
  createGroup,
  deleteGroup,
  addToGroup,
  removeFromGroup,
  allGroups,
  searchGroup,
  readGroup,
};
