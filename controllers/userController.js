const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || "default_jwt_secret_key_for_calling_app",
    { expiresIn: "30d" }
  );
};

exports.registerUser = async (req, res) => {
  try {
    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please enter all fields (name, email, password)" });
    }

    email = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email,
      password: hashedPassword,
    });

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please enter email and password" });
    }

    email = email.trim().toLowerCase();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
    };

    res.status(200).json({
      message: "Login successful",
      user: userResponse,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: { $ne: req.user._id },
    }).select("name email");

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};