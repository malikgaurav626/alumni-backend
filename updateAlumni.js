require("dotenv").config();
const mongoose = require("mongoose");
const Alumni = require("./models/Alumni"); // Adjust the path as necessary

// MongoDB connection
mongoose.connect(process.env.MONGO_DB);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async () => {
  console.log("Connected to MongoDB");
  await updateAlumni();
  mongoose.connection.close();
});

const updateAlumni = async () => {
  try {
    const alumni = await Alumni.find({
      $or: [{ major: { $exists: false } }, { graduation: { $exists: false } }],
    });

    for (let alumnus of alumni) {
      alumnus.major = "CSE";
      alumnus.graduation = "2020";
      await alumnus.save();
    }

    console.log(`Updated ${alumni.length} alumni documents`);
  } catch (err) {
    console.error(err);
  }
};
