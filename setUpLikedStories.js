require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Story = require("./models/Story");

// MongoDB connection
mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async () => {
  console.log("Connected to MongoDB");
  await setupLikedStories();
  mongoose.connection.close();
});

const setupLikedStories = async () => {
  try {
    const users = await User.find();
    const stories = await Story.find();

    for (let user of users) {
      // Randomly select a subset of stories to like
      const likedStories = stories
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * stories.length));

      for (let story of likedStories) {
        story.likedBy.push(user._id);
        await story.save();
      }
    }

    console.log(`Assigned liked stories to ${users.length} users`);
  } catch (err) {
    console.error("Error setting up liked stories:", err);
  }
};
