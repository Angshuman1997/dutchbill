const express = require('express');
const router = express.Router();
const session = require('express-session');
const NodeCache = require('node-cache');
const {
  signupAccount,
  loginAccount,
  updateAccount,
  deleteAccount,
  searchAccount,
  forgotAccount,
  otpVerify,
} = require('../operations/Account/UserAccount');
const {
  createGroup,
  deleteGroup,
  addToGroup,
  removeFromGroup,
  allGroups,
  searchGroup,
  readGroup,
} = require('../operations/Group/Group'); 

const userCollectionName = process.env.COLLECTION;
const groupCollectionName = process.env.GROUPCOLLECTION;

// Create a new cache instance
const cache = new NodeCache();

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
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// User Routes
router.post("/user/signup", async (req, res) => {
  const { fullName, username, email, password } = req.body;
  const result = await signupAccount(userCollectionName, fullName, username, email, password);
  res.status(result.status).json(result.data);
});

router.post("/user/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await loginAccount(userCollectionName, username, password);
  if (result.status === 200 && result.data.account === 'valid') {
    req.session.userId = result.data.info._id;
  }
  res.status(result.status).json(result.data);
});

router.post("/user/logout", isAuthenticated, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Failed to logout' });
    }
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

router.put("/user/update", isAuthenticated, async (req, res) => {
  const { accountId, updateInfo } = req.body;
  const result = await updateAccount(userCollectionName, accountId, updateInfo);
  res.status(result.status).json(result.data);
});

router.delete("/user/delete", isAuthenticated, async (req, res) => {
  const { accountId } = req.body;
  const result = await deleteAccount(userCollectionName, accountId);
  res.status(result.status).json(result.data);
});

router.post("/user/search", isAuthenticated, async (req, res) => {
  const { search } = req.body;
  const cacheKey = `search_user_${search}`;
  if (cache.has(cacheKey)) {
    return res.status(200).json(cache.get(cacheKey));
  }
  const result = await searchAccount(userCollectionName, search);
  if (result.status === 200) {
    cache.set(cacheKey, result.data, 60); // Cache for 60 seconds
  }
  res.status(result.status).json(result.data);
});

router.post("/user/otp-verify", async (req, res) => {
  const { username, otp } = req.body;
  const result = await otpVerify(userCollectionName, username, otp);
  res.status(result.success ? 200 : 404).json(result.success ? 'Verified' : 'Error/Not Verified');
});

router.post("/user/forgot", async (req, res) => {
  const { username, password } = req.body;
  const result = await forgotAccount(userCollectionName, username, password);
  res.status(result.status).json(result.data);
});

// Group Routes
router.post('/group/create', isAuthenticated, async (req, res) => {
  const { accountId, groupName, members } = req.body;
  const result = await createGroup(groupCollectionName, accountId, groupName, members);
  res.status(result.status).send(result);
});

router.delete('/group/delete', isAuthenticated, async (req, res) => {
  const { accountId, groupId } = req.body;
  const result = await deleteGroup(groupCollectionName, accountId, groupId);
  res.status(result.status).send(result);
});

router.post('/group/add', isAuthenticated, async (req, res) => {
  const { adderId, addIdlist, groupId } = req.body;
  const result = await addToGroup(groupCollectionName, adderId, addIdlist, groupId);
  res.status(result.status).send(result);
});

router.post('/group/remove', isAuthenticated, async (req, res) => {
  const { removerId, removeList, groupId } = req.body;
  const result = await removeFromGroup(groupCollectionName, removerId, removeList, groupId);
  res.status(result.status).send(result);
});

router.get('/group/all', isAuthenticated, async (req, res) => {
  const result = await allGroups(groupCollectionName);
  res.status(result.status).send(result);
});

router.get('/group/search', isAuthenticated, async (req, res) => {
  const { search } = req.query;
  const cacheKey = `search_group_${search}`;
  if (cache.has(cacheKey)) {
    return res.status(200).json(cache.get(cacheKey));
  }
  const result = await searchGroup(groupCollectionName, search);
  if (result.status === 200) {
    cache.set(cacheKey, result.data, 60); // Cache for 60 seconds
  }
  res.status(result.status).send(result);
});

router.get('/group/details', isAuthenticated, async (req, res) => {
  const { groupId } = req.query;
  const result = await readGroup(groupCollectionName, groupId);
  res.status(result.status).send(result);
});

module.exports = router;
