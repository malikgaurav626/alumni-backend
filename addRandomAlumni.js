require("dotenv").config();
const mongoose = require("mongoose");
const Alumni = require("./models/Alumni"); // Adjust the path as necessary
const { faker } = require("@faker-js/faker");

// MongoDB connection
mongoose.connect(process.env.MONGO_DB);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
  addRandomAlumni();
});

const addRandomAlumni = async () => {
  try {
    const alumni = [];
    for (let i = 0; i < 10; i++) {
      const alumnus = new Alumni({
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        id: faker.string.uuid(),
        password: faker.internet.password(),
        sex: faker.person.sex(),
        degree: faker.helpers.arrayElement([
          "BSCS",
          "BBA",
          "SSLA",
          "BSAF",
          "BSS",
        ]),
        image: faker.image.avatar(),
        role: "1", // Explicitly set the role to "1"
        graduation: faker.date.past(10).getFullYear(),
      });
      alumni.push(alumnus);
    }

    await Alumni.insertMany(alumni);
    console.log("Random alumni added successfully");
    mongoose.connection.close();
  } catch (err) {
    console.error(err);
    mongoose.connection.close();
  }
};
