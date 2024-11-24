const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "0" }, // Default role for admin
});

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
