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
  const formatUptime = (uptime) => {
    const days = Math.floor(uptime / (24 * 60 * 60));
    uptime %= 24 * 60 * 60;
    const hours = Math.floor(uptime / (60 * 60));
    uptime %= 60 * 60;
    const minutes = Math.floor(uptime / 60);
    const seconds = uptime % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  };

  const healthCheck = {
    uptime: formatUptime(process.uptime()),
    message: "Server is UP",
    timestamp: new Date().toLocaleString(),
  };
  res.status(200).send(healthCheck);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
