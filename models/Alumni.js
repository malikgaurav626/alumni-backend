const mongoose = require("mongoose");

const alumniSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  sex: { type: String, required: true },
  degree: { type: String, required: true },
  major: { type: String, required: true }, // Add major field
  image: { type: String, required: true }, // Store the image path or URL
  role: { type: String, default: "1" }, // Add role field with default value "1"
  graduation: { type: String, required: true }, // Add graduation field
});

const Alumni = mongoose.model("Alumni", alumniSchema);

module.exports = Alumni;
