require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

// MongoDB connection
mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async () => {
  console.log("Connected to MongoDB");
  await addAdmin();
  mongoose.connection.close();
});

const addAdmin = async () => {
  const id = "00000"; // Replace with the desired admin ID
  const password = "@ChromeTraveller"; // Replace with the desired admin password

  try {
    const existingAdmin = await Admin.findOne({ id });
    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({
      id,
      password: hashedPassword,
      role: "0", // Explicitly set the role to "0"
    });
    await newAdmin.save();

    console.log("Admin registered successfully");
  } catch (err) {
    console.error("Error adding admin:", err);
  }
};
