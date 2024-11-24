require("dotenv").config();
const mongoose = require("mongoose");
const Story = require("./models/Story"); // Adjust the path as necessary
const { faker } = require("@faker-js/faker");

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB);
    console.log("Connected to MongoDB");
    await addRandomStories();
    mongoose.connection.close();
  } catch (error) {
    console.error("Connection error:", error);
    process.exit(1);
  }
};

const generateERPCode = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    characters.charAt(Math.floor(Math.random() * characters.length))
  ).join("");
};

const addRandomStories = async () => {
  try {
    const stories = Array.from({ length: 10 }, () => ({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(),
      ERP: generateERPCode(5),
      Name: faker.person.fullName(),
      popularity: faker.number.int({ min: 0, max: 100 }),
      likedBy: [],
    }));

    await Story.insertMany(stories);
    console.log("Random stories added successfully");
  } catch (err) {
    console.error("Error adding stories:", err);
  }
};

connectDB();
