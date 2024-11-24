const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "0" },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
