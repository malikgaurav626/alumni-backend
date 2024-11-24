require("dotenv").config();
const mongoose = require("mongoose");
const Alumni = require("./models/Alumni");

// MongoDB connection
mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async () => {
  console.log("Connected to MongoDB");
  await updateAlumniJobs();
  mongoose.connection.close();
});

const updateAlumniJobs = async () => {
  try {
    const alumni = await Alumni.find();
    for (let alumnus of alumni) {
      alumnus.jobs = alumnus.jobs || [];
      await alumnus.save();
      console.log(`Updated alumni ${alumnus.id} to ensure jobs array exists`);
    }
    console.log("All alumni updated successfully");
  } catch (err) {
    console.error("Error updating alumni:", err);
  }
};
