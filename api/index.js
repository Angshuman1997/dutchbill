const express = require("express");
const bodyParser = require("body-parser");
const userRoutes = require("../router/UserRoute");
const adminRoutes = require("../router/AdminRoute");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use("/user/api", userRoutes);
app.use("/admin/api", adminRoutes);

// Test endpoint
app.get("/test", (req, res) => {
  res.send("Test endpoint is working!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
