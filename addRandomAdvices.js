require("dotenv").config();
const mongoose = require("mongoose");
const Alumni = require("./models/Alumni");
const User = require("./models/User");
const Advice = require("./models/Advice");
const { faker } = require("@faker-js/faker");

// MongoDB connection
mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async () => {
  console.log("Connected to MongoDB");
  await generateRandomAdvices();
  mongoose.connection.close();
});

const generateRandomAdvices = async () => {
  try {
    const alumni = await Alumni.find();
    const users = await User.find();
    if (alumni.length === 0) {
      console.log("No alumni found");
      return;
    }

    const advices = [];
    for (let i = 0; i < 10; i++) {
      const randomAlumni = alumni[Math.floor(Math.random() * alumni.length)];
      const advice = new Advice({
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(3),
        ERP: randomAlumni.id,
        Name: `${randomAlumni.first_name} ${randomAlumni.last_name}`,
        category: faker.helpers.arrayElement([
          "General",
          "BSCS",
          "BBA",
          "SSLA",
          "BSAF",
          "BSS",
        ]),
        likedBy: [],
      });

      // Randomly select a subset of users to like the advice
      const likedUsers = users
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * users.length));

      for (let user of likedUsers) {
        advice.likedBy.push(user._id);
      }

      advice.popularity = advice.likedBy.length;
      advices.push(advice);
    }

    await Advice.insertMany(advices);
    console.log("Random advices generated successfully");
  } catch (err) {
    console.error("Error generating random advices:", err);
  }
};
