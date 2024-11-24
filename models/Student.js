const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  sex: { type: String, required: true },
  degree: { type: String, required: true },
  image: { type: String, required: true }, // Store the image path or URL
  role: { type: String, default: "2" }, // Add role field with default value "2"
});

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
