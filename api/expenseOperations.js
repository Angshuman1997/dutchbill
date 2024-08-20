const express = require("express");
const { ObjectId } = require("mongodb");
const { connectToMongo, getDb } = require("./db");

const router = express.Router();

async function usersCollection() {
  await connectToMongo();
  return getDb().collection("users");
}

async function expenseCollection() {
  await connectToMongo();
  return getDb().collection("expense");
}

async function groupCollection() {
  await connectToMongo();
  return getDb().collection("group");
}

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

    if (result) {
      const users = await usersCollection();
      const expenseId = expenses.insertedId;
      let resultSuccess = true;

      for (const [key, value] of Object.entries(amountDistribution)) {
        if (key !== paidBy.personId) {
          const personData = persons.find((person) => person.personId === key);
          let result;
          // Receiver
          result = await users.updateOne(
            { username: paidById.personId },
            {
              $push: {
                expenseData: {
                  $each: {
                    expenseId: expenseId,
                    type: "receive",
                    payTo: null,
                    payToId: null,
                    receiveFrom: personData.name,
                    receiveFromId: personData.personId,
                    amount: value,
                    status: "pending",
                    trnscDate: createddate,
                    trnscCompleteDate: null,
                    group,
                    expenseType,
                    ifOthersComment,
                  },
                },
              },
            }
          );

          if (result.matchedCount > 0) {
            let result1 = await users.updateOne(
              { username: key },
              {
                $push: {
                  expenseData: {
                    $each: {
                      expenseId: expenseId,
                      type: "pay",
                      payTo: paidBy.name,
                      payToId: paidBy.personId,
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
                },
              }
            );
            if (result1.matchedCount > 0) {
              resultSuccess = true;
            } else {
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
      message: "Something went wrong !",
      error: error,
    });
  }
}

async function removeExpense(req, res) {
  try {
    const expenseData = await expenseCollection().findOne({
      _id: new ObjectId(req.body.expenseId),
    });

    const amountDistributionKeys = Object.keys(expenseData.amountDistribution);

    const result = await expenseCollection().deleteOne({
      _id: new ObjectId(req.body.expenseId),
    });

    if (result) {
      const resData = db.users.updateMany(
        {
          username: { $in: amountDistributionKeys },
          "expenseData.expenseId": new ObjectId(req.body.expenseId),
        },
        {
          $pull: {
            expenseData: {
              expenseId: new ObjectId(req.body.expenseId),
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

router.post("/addexpense", addExpense);
router.delete("/removeexpense", removeExpense);
router.get("/fetchexpense", fetchExpenses);

module.exports = router;
