require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("./models/Student");
const Alumni = require("./models/Alumni");
const Story = require("./models/Story");
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
  await updateStoriesAndAdvices();
  mongoose.connection.close();
});

const getRandomAlumni = async () => {
  const count = await Alumni.countDocuments();
  const random = Math.floor(Math.random() * count);
  const randomAlumni = await Alumni.findOne().skip(random);
  return randomAlumni;
};

const updateStoriesAndAdvices = async () => {
  try {
    // Update stories
    const stories = await Story.find();
    for (let story of stories) {
      let user = await Student.findOne({ id: story.ERP });
      if (!user) {
        user = await Alumni.findOne({ id: story.ERP });
      }

      if (user) {
        story.userId = user.id; // Use id instead of _id
        story.Name = `${user.first_name} ${user.last_name}`;
      } else {
        const randomAlumni = await getRandomAlumni();
        if (randomAlumni) {
          story.userId = randomAlumni.id; // Assign random alumni
          story.Name = `${randomAlumni.first_name} ${randomAlumni.last_name}`;
          console.log(`Assigned random alumni for story ${story._id}`);
        } else {
          console.log(`No alumni found to assign for story ${story._id}`);
        }
      }
      await story.save();
      console.log(`Updated story ${story._id} with userId and Name`);
    }

    // Update advices
    const advices = await Advice.find();
    for (let advice of advices) {
      let user = await Student.findOne({ id: advice.ERP });
      if (!user) {
        user = await Alumni.findOne({ id: advice.ERP });
      }

      if (user) {
        advice.userId = user.id; // Use id instead of _id
        advice.Name = `${user.first_name} ${user.last_name}`;
      } else {
        const randomAlumni = await getRandomAlumni();
        if (randomAlumni) {
          advice.userId = randomAlumni.id; // Assign random alumni
          advice.Name = `${randomAlumni.first_name} ${randomAlumni.last_name}`;
          console.log(`Assigned random alumni for advice ${advice._id}`);
        } else {
          console.log(`No alumni found to assign for advice ${advice._id}`);
        }
      }
      await advice.save();
      console.log(`Updated advice ${advice._id} with userId and Name`);
    }

    console.log("All stories and advices updated successfully");
  } catch (err) {
    console.error("Error updating stories and advices:", err);
  }
};
