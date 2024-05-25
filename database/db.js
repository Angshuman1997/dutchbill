const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGODB_URI;
let client = null;
let timer = null;

async function connectToMongoDB() {
  if (!client) {
    client = new MongoClient(uri);
    try {
      await client.connect();
      //   console.log("Connected to MongoDB");
      resetTimer(); // Reset the timer on successful connection
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      throw error;
    }
  } else {
    resetTimer(); // Reset the timer if the client is already connected
  }
  return client;
}

function resetTimer(timeoutDuration=60000) {
  if (timer) {
    clearTimeout(timer); // Clear existing timer
  }
  timer = setTimeout(disconnectFromMongoDB, timeoutDuration); // Set new timer for disconnection
}

async function disconnectFromMongoDB() {
  if (client) {
    await client.close();
    console.log("Disconnected from MongoDB");
    client = null;
    timer = null; // Clear timer when disconnected
  }
}

module.exports = {
  connectToMongoDB,
  disconnectFromMongoDB,
  resetTimer,
};
