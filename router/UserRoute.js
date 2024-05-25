const express = require("express");
const router = express.Router();
const session = require("express-session");
const NodeCache = require("node-cache");
const {
  signupAccount,
  loginAccount,
  updateAccount,
  deleteAccount,
  searchAccount,
  forgotAccount,
  otpVerify,
} = require("../functions/Account/UserAccount");

// Create a new cache instance
const cache = new NodeCache();
const collectionName = process.env.COLLECTION;

// Session setup
router.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true in production with HTTPS
  })
);

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Signup route - done
router.post("/signup", async (req, res) => {
  const { fullName, username, email, password } = req.body;
  const result = await signupAccount(
    collectionName,
    fullName,
    username,
    email,
    password
  );
  res.status(result.status).json(result.data);
});

// Login route - done
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await loginAccount(collectionName, username, password);
  if (result.status === 200 && result.data.account === "valid") {
    req.session.userId = result.data.info._id;
  }
  res.status(result.status).json(result.data);
});

// Logout route - done
router.post("/logout", isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Failed to logout" });
    }
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// Update account route - done
router.put("/update", isAuthenticated, async (req, res) => {
  const { accountId, updateInfo } = req.body;
  const result = await updateAccount(collectionName, accountId, updateInfo);
  res.status(result.status).json(result.data);
});

// Delete account route
router.delete("/delete", isAuthenticated, async (req, res) => {
  const { accountId } = req.body;
  const result = await deleteAccount(collectionName, accountId);
  res.status(result.status).json(result.data);
});

// Search account route - done
router.post("/search", isAuthenticated, async (req, res) => {
  const { search } = req.body;
  const cacheKey = `search_${search}`;
  if (cache.has(cacheKey)) {
    return res.status(200).json(cache.get(cacheKey));
  }
  const result = await searchAccount(collectionName, search);
  if (result.status === 200) {
    cache.set(cacheKey, result.data, 60); // Cache for 60 seconds
  }
  res.status(result.status).json(result.data);
});

// OTP verification route - done
router.post("/otp-verify", async (req, res) => {
  const { username, otp } = req.body;
  const result = await otpVerify(collectionName, username, otp);
  res.status(result.success ? 200 : 404).json(result.success ? "Verified" : "Error/ Not Verified");
});

// Forgot account route - done
router.post("/forgot", async (req, res) => {
  const { username, password } = req.body;
  const result = await forgotAccount(collectionName, username, password);
  res.status(result.status).json(result.data);
});

module.exports = router;
