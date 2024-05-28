const express = require("express");
const bodyParser = require("body-parser");
const userRoutes = require("../router/UserRoute");
const adminRoutes = require("../router/AdminRoute");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/user/api", userRoutes);
app.use("/admin/api", adminRoutes);

// health endpoint

app.get("/health", (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: "Server is UP",
    timestamp: Date.now(),
  };
  res.status(200).send(healthCheck);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
