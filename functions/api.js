const express = require("express");
const bodyParser = require("body-parser");
const userRoutes = require("../router/UserRoute");
const adminRoutes = require("../router/AdminRoute");
const serverless = require("serverless-http");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/.netlify/functions/user/api", userRoutes);
app.use("/.netlify/functions/admin/api", adminRoutes);

// Test endpoint
app.get("/.netlify/functions/test", (req, res) => {
  res.send("Test endpoint is working!");
});

module.exports.handler = serverless(app);
