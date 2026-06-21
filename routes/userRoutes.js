const express = require("express");
const { getMessages } = require("../controllers/messageController");
const router = express.Router();
const {
  registerUser,
  getUsers,
} = require("../controllers/userController");

router.post("/register", registerUser);

router.get("/users", getUsers);
router.get("/messages", getMessages);
module.exports = router;