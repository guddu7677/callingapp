const express = require("express");
const { getMessages } = require("../controllers/messageController");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUsers,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/users", protect, getUsers);
router.get("/messages", protect, getMessages);

module.exports = router;