const User = require('../models/User');
const bcrypt = require('bcrypt');
const generateToken = require('../utils/generateToken');


async function signup(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next){
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if(!user){
      return res.status(401).json({success: false, message: "Invalid Credentials"});
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      return res.status(401).json({success: false, message: "Invalid Credentials"});
    }

    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email },
      token,
    });

  } catch (err) {
    next(err);
  }
}

module.exports = { signup, login };