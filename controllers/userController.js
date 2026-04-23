const User = require("../models/User");

exports.registerUser = async (req, res) => {
  try {
    let { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    name = name.trim().toLowerCase();

    const existingUser = await User.findOne({ name });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const user = await User.create({ name });

    res.status(201).json({
      message: "User registered successfully",
      user,
    });

  } catch (err) {

    if (err.code === 11000) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { userId } = req.query;

    const users = await User.find({
      _id: { $ne: userId },
    }).select("name");

    res.json({
      success: true,
      users,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};