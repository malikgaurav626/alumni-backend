require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("./models/Student");
const Alumni = require("./models/Alumni");
const User = require("./models/User");

// MongoDB connection
mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", async () => {
  console.log("Connected to MongoDB");
  await copyToUsers();
  mongoose.connection.close();
});

const copyToUsers = async () => {
  try {
    const students = await Student.find();
    const alumni = await Alumni.find();

    const bulkOps = [];

    students.forEach((student) => {
      bulkOps.push({
        updateOne: {
          filter: { id: student.id },
          update: {
            $setOnInsert: {
              first_name: student.first_name,
              last_name: student.last_name,
              id: student.id,
              password: student.password,
              sex: student.sex,
              degree: student.degree,
              image: student.image,
              role: student.role,
            },
          },
          upsert: true,
        },
      });
    });

    alumni.forEach((alumnus) => {
      bulkOps.push({
        updateOne: {
          filter: { id: alumnus.id },
          update: {
            $setOnInsert: {
              first_name: alumnus.first_name,
              last_name: alumnus.last_name,
              id: alumnus.id,
              password: alumnus.password,
              sex: alumnus.sex,
              degree: alumnus.degree,
              major: alumnus.major,
              image: alumnus.image,
              role: alumnus.role,
              graduation: alumnus.graduation,
            },
          },
          upsert: true,
        },
      });
    });

    await User.bulkWrite(bulkOps);

    console.log(
      `Copied ${students.length} students and ${alumni.length} alumni to the User collection`
    );
  } catch (err) {
    console.error("Error copying to User collection:", err);
  }
};
