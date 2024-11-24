require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Advice = require("./models/Advice");

// MongoDB connection
mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async () => {
  console.log("Connected to MongoDB");
  await addRandomLikedAdvices();
  mongoose.connection.close();
});

const addRandomLikedAdvices = async () => {
  try {
    const users = await User.find();
    const advices = await Advice.find();

    for (let advice of advices) {
      // Randomly select a subset of users to like the advice
      const likedUsers = users
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * users.length));

      for (let user of likedUsers) {
        if (!advice.likedBy.includes(user._id)) {
          advice.likedBy.push(user._id);
          advice.popularity += 1;
        }
      }

      await advice.save();
    }

    console.log(`Assigned liked advices to ${advices.length} advices`);
  } catch (err) {
    console.error("Error setting up liked advices:", err);
  }
};
