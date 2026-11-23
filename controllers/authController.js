const jwt = require("jsonwebtoken");
const User = require("../models/User");
const eventBus = require("../events/eventBus");

function makeToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    {
      expiresIn: Number(process.env.JWT_EXPIRES_IN) || 86400,
    }
  );
}

function publicUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

async function signup(req, res, next) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    const user = await User.create({ username, email, password });

    eventBus.emit("user:registered", {
      userId: user._id.toString(),
    });

    return res.status(201).json({
      message: "User registered",
      token: makeToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    return res.json({
      message: "Login successful",
      token: makeToken(user),
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { signup, login };