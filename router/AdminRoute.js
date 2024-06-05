// Add later
const express = require("express");
const router = express.Router();
const session = require("express-session");
const NodeCache = require("node-cache");
const {
  allAccounts,
  updateAccounts,
  searchAccounts,
  deleteAccounts,
  addAccount,
} = require("../operations/Account/AdminAccount");

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

// Get all accounts
router.get("/all-account", isAuthenticated, async (req, res) => {
  const result = await allAccounts(collectionName);
  res.status(result.status).json(result.data);
});

// Search accounts
router.post("/search-account", isAuthenticated, async (req, res) => {
  const { username, email } = req.body;
  const cacheKey = `search_${username}_${email}`;
  if (cache.has(cacheKey)) {
    return res.status(200).json(cache.get(cacheKey));
  }
  const result = await searchAccounts(collectionName, username, email);
  if (result.status === 200) {
    cache.set(cacheKey, result.data, 60); // Cache for 60 seconds
  }
  res.status(result.status).json(result.data);
});

// Update account
router.put("/update-account", isAuthenticated, async (req, res) => {
  const { accountId, updateInfo } = req.body;
  const result = await updateAccounts(collectionName, accountId, updateInfo);
  res.status(result.status).json(result.data);
});

// Delete accounts
router.delete("/delete-account", isAuthenticated, async (req, res) => {
  const { accountIds } = req.body;
  const result = await deleteAccounts(collectionName, accountIds);
  res.status(result.status).json(result.data);
});

// Add account
router.post("/add-account", isAuthenticated, async (req, res) => {
  const { username, email, password, bypass, accountType } = req.body;
  const result = await addAccount(
    collectionName,
    username,
    email,
    password,
    bypass,
    accountType
  );
  res.status(result.status).json(result.data);
});

module.exports = router;
