const express = require("express");
const { ObjectId } = require("mongodb");
const { connectToMongo, getDb } = require("./db");
const { mergeAndSummarize } = require("./utils");

const router = express.Router();

async function usersCollection() {
  await connectToMongo();
  return getDb().collection("users");
}

async function expenseCollection() {
  await connectToMongo();
  return getDb().collection("expense");
}

// async function groupCollection() {
//   await connectToMongo();
//   return getDb().collection("group");
// }

async function addExpense(req, res) {
  try {
    const {
      expenseType,
      persons,
      amount,
      shareType,
      group,
      ifOthersComment,
      paidBy,
      amountDistribution,
    } = req.body;
    const createddate = new Date();

    const expense = {
      expenseType,
      persons,
      amount,
      shareType,
      group,
      ifOthersComment,
      paidBy,
      amountDistribution,
      createddate,
    };

    const expenses = await expenseCollection();
    const result = await expenses.insertOne(expense);
    let resultSuccess = true;

    if (result) {
      const users = await usersCollection();
      const expenseId = result.insertedId; // Corrected to use `result.insertedId`

      for (const [key, value] of Object.entries(amountDistribution)) {
        if (!new ObjectId(key).equals(new ObjectId(paidBy._id))) {
          const personData = persons.find((person) => person._id === key);

          // Receiver
          const receiverUpdateResult = await users.updateOne(
            { _id: new ObjectId(paidBy._id) },
            {
              $push: {
                expenseData: {
                  expenseId: new ObjectId(expenseId),
                  createdById: new ObjectId(paidBy._id),
                  type: "receive",
                  payTo: null,
                  payToId: null,
                  receiveFrom: personData.name,
                  receiveFromId: new ObjectId(personData._id),
                  amount: value,
                  status: "pending",
                  trnscDate: createddate,
                  trnscCompleteDate: null,
                  group,
                  expenseType,
                  ifOthersComment,
                },
              },
            }
          );

          if (receiverUpdateResult.matchedCount > 0) {
            const payerUpdateResult = await users.updateOne(
              { _id: new ObjectId(key) },
              {
                $push: {
                  expenseData: {
                    expenseId: new ObjectId(expenseId),
                    createdById: new ObjectId(paidBy._id),
                    type: "pay",
                    payTo: paidBy.name,
                    payToId: new ObjectId(paidBy._id),
                    receiveFrom: null,
                    receiveFromId: null,
                    amount: value,
                    status: "pending",
                    trnscDate: createddate,
                    trnscCompleteDate: null,
                    group,
                    expenseType,
                    ifOthersComment,
                  },
                },
              }
            );

            if (payerUpdateResult.matchedCount === 0) {
              resultSuccess = false;
            }
          } else {
            resultSuccess = false;
          }
        }
      }
    }

    if (resultSuccess) {
      return res.status(200).json({
        success: true,
        message: "Expense Added",
        status: 200,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Failed to Add Expense",
        status: 404,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: error,
    });
  }
}

async function removeExpense(req, res) {
  try {
    const { userId, expenseId } = req.body;
    const expenseData = await expenseCollection().findOne({
      _id: new ObjectId(expenseId),
    });

    const amountDistributionKeys = Object.keys(expenseData.amountDistribution);

    const objectIds = amountDistributionKeys.map((i) => new ObjectId(i));

    const result = await expenseCollection().deleteOne({
      _id: new ObjectId(expenseId),
    });

    if (result) {
      const resData = db.users.updateMany(
        {
          _id: { $in: objectIds },
          createdById: new ObjectId(userId),
          "expenseData.expenseId": new ObjectId(expenseId),
        },
        {
          $pull: {
            expenseData: {
              expenseId: new ObjectId(expenseId),
            },
          },
        }
      );

      if (resData) {
        return res
          .status(200)
          .json({ message: "Expense Deleted", status: 200, success: true });
      } else {
        return res.status(404).json({
          message: "Expense Deletion Failed",
          status: 404,
          success: false,
        });
      }
    } else {
      return res.status(404).json({
        message: "Expense Deletion Failed",
        status: 404,
        success: false,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong !",
      error: error,
    });
  }
}

async function fetchExpenses(req, res) {
  try {
    const users = await usersCollection();
    const user = await users.findOne({
      _id: new ObjectId(req.body.userId),
    });
    if (user) {
      return res.status(200).json({
        data: user.expenseData,
        success: true,
        status: 200,
        message: "Expenses found",
      });
    } else {
      return res
        .status(404)
        .json({ success: false, status: 404, message: "Expenses not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong !",
      error: error,
    });
  }
}

// Overview expense
async function totalExpenseOverview(req, res) {
  try {
    const users = await usersCollection();
    const user = await users.findOne({
      _id: new ObjectId(req.body.userId),
    });

    if (!user || !user.expenseData || !user.expenseData.length) {
      return res.status(404).json({
        success: false,
        message: "User or expense data not found",
      });
    }

    const transactions = [...user.expenseData];

    const summaryPay = {};
    const summaryReceive = {};

    transactions.forEach((i) => {
      if (i.type === "pay" && i.status === "pending") {
        if (summaryPay.hasOwnProperty(i.payToId)) {
          summaryPay[i.payToId] = summaryPay[i.payToId] + i.amount;
        } else {
          summaryPay[i.payToId] = 0 + i.amount;
        }
      } else if (i.type === "receive" && i.status === "pending") {
        if (summaryReceive.hasOwnProperty(i.receiveFromId)) {
          summaryReceive[i.receiveFromId] =
            summaryReceive[i.receiveFromId] + i.amount;
        } else {
          summaryReceive[i.receiveFromId] = 0 + i.amount;
        }
      }
    });

    const newSummaryPay = Object.fromEntries(
      Object.entries(summaryPay).map(([key, value]) => [key, -Math.abs(value)])
    );

    const summary = await mergeAndSummarize(newSummaryPay, summaryReceive);

    const objectIds = summary.map((i) => new ObjectId(i._id));

    // Fetch the documents with the given ids
    const userDoc = await users.find({ _id: { $in: objectIds } }).toArray();

    // Create a map from userDoc
    const nameMap = userDoc.reduce((map, { _id, name }) => {
      map[_id] = name;
      return map;
    }, {});

    // Update summary with names from userDoc
    const updatedSummary = summary.map((item) => ({
      ...item,
      name: nameMap[item._id] || "Unknown", // Default to 'Unknown' if name is not found
    }));

    return res
      .status(200)
      .json({
        summary: updatedSummary,
        success: true,
        status: 200,
        message: "Total summary overview",
      });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong!",
      error: error.message,
    });
  }
}

router.post("/addexpense", addExpense);
router.delete("/removeexpense", removeExpense);
router.post("/fetchexpense", fetchExpenses);
router.post("/totalsummary", totalExpenseOverview);

module.exports = router;
