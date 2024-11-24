require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const multer = require("multer");
const path = require("path");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB connection
mongoose.connect(process.env.MONGO_DB, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Models
const User = require("./models/User");
const Student = require("./models/Student");
const Alumni = require("./models/Alumni");
const Story = require("./models/Story");
const Advice = require("./models/Advice");

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Routes
app.post("/login", async (req, res) => {
  const { id, password } = req.body;

  try {
    // Check if the user is a student
    let user = await Student.findOne({ id });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, role: "student" },
        "your_jwt_secret",
        {
          expiresIn: "1h",
        }
      );

      return res.json({ token, user_id: "2" });
    }

    // Check if the user is an alumnus
    user = await Alumni.findOne({ id });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, role: "alumni" },
        "your_jwt_secret",
        {
          expiresIn: "1h",
        }
      );

      return res.json({ token, user_id: "1" });
    }

    // Check if the user is an admin
    user = await User.findOne({ id });
    if (user) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        "your_jwt_secret",
        {
          expiresIn: "1h",
        }
      );

      return res.json({ token, user_id: "0" });
    }

    return res.status(400).json({ message: "User not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/register-student", upload.single("image"), async (req, res) => {
  const { first_name, last_name, id, password, sex, degree } = req.body;
  const image = req.file.path;

  try {
    const existingStudent = await Student.findOne({ id });
    if (existingStudent) {
      return res.status(400).json({ message: "Student already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newStudent = new Student({
      first_name,
      last_name,
      id,
      password: hashedPassword,
      sex,
      degree,
      image,
      role: "2", // Explicitly set the role to "2"
    });
    await newStudent.save();

    // Setup liked stories for the new student
    await setupLikedStoriesForUser(newStudent._id);

    const token = jwt.sign(
      { id: newStudent.id, role: "student" },
      "your_jwt_secret",
      {
        expiresIn: "1h",
      }
    );

    res.status(201).json({
      message: "Student registered successfully",
      token,
      user_id: "2",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/register-alumni", upload.single("image"), async (req, res) => {
  const {
    first_name,
    last_name,
    id,
    password,
    sex,
    degree,
    major,
    graduation,
  } = req.body;
  const image = req.file.path;

  try {
    const existingAlumni = await Alumni.findOne({ id });
    if (existingAlumni) {
      return res.status(400).json({ message: "Alumni already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAlumni = new Alumni({
      first_name,
      last_name,
      id,
      password: hashedPassword,
      sex,
      degree,
      major, // Add major field
      image,
      role: "1", // Explicitly set the role to "1"
      graduation, // Add graduation field
    });
    await newAlumni.save();

    // Setup liked stories for the new alumni
    await setupLikedStoriesForUser(newAlumni._id);

    const token = jwt.sign(
      { id: newAlumni.id, role: "alumni" },
      "your_jwt_secret",
      {
        expiresIn: "1h",
      }
    );

    res.status(201).json({
      message: "Alumni registered successfully",
      token,
      user_id: "1",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Create a new story
app.post("/stories", async (req, res) => {
  const { title, content, ERP, Name } = req.body;

  try {
    const newStory = new Story({
      title,
      content,
      ERP,
      Name,
    });
    await newStory.save();

    res
      .status(201)
      .json({ message: "Story created successfully", story: newStory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/home-stories", async (req, res) => {
  try {
    const stories = await Story.find();
    res.json(stories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all stories with sorting, ordering, and pagination
app.get("/stories", async (req, res) => {
  const { sort, order, page } = req.query;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const sortOption = {};
    if (sort) {
      sortOption[sort] = order === "asc" ? 1 : -1;
    }

    const stories = await Story.find().sort(sortOption).skip(skip).limit(limit);

    const totalStories = await Story.countDocuments();
    const totalPages = Math.ceil(totalStories / limit);

    res.json({ stories, totalPages, currentPage: page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get liked stories for a user
app.get("/stories/likedstories", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;

  try {
    // Convert userId to ObjectId if it is a valid ObjectId string
    const isValidObjectId = mongoose.Types.ObjectId.isValid(userId);
    const query = isValidObjectId
      ? { _id: mongoose.Types.ObjectId(userId) }
      : { id: userId };

    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const likedStories = user.likedStories || [];
    res.json(likedStories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a story by ID
app.get("/stories/:id", async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }
    res.json(story);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a story
app.patch("/stories/:id", async (req, res) => {
  const { title, content } = req.body;

  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    story.title = title || story.title;
    story.content = content || story.content;
    await story.save();

    res.json({ message: "Story updated successfully", story });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a story
app.delete("/stories/:id", async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ message: "Story not found" });
    }

    await story.remove();
    res.json({ message: "Story deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all alumni with filtering, sorting, and pagination
app.get("/alumni", async (req, res) => {
  const { category, sort, page } = req.query;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const query = category ? { degree: category } : {};
    const sortOption = sort
      ? { graduation: sort.includes("asc") ? 1 : -1 }
      : {};

    const alumni = await Alumni.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalAlumni = await Alumni.countDocuments(query);
    const totalPages = Math.ceil(totalAlumni / limit);

    res.json({ alumni, totalPages, currentPage: page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get alumni profile by name
app.get("/alumni/profile_by_name/:name", async (req, res) => {
  const { name } = req.params;

  try {
    const alumni = await Alumni.find({
      $or: [
        { first_name: new RegExp(name, "i") },
        { last_name: new RegExp(name, "i") },
      ],
    });

    res.json(alumni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get alumni profile by ID
app.get("/alumni/profile/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const alumni = await Alumni.findOne({ id });

    if (!alumni) {
      return res.status(404).json({ error: "Alumni not found" });
    }

    res.json(alumni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    let user = await Student.findOne({ id });
    if (!user) {
      user = await Alumni.findOne({ id });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new advice
app.post("/advices", async (req, res) => {
  const { title, content, category } = req.body;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;

  try {
    // Fetch user information based on userId
    let user = await Student.findOne({ id: userId });
    if (!user) {
      user = await Alumni.findOne({ id: userId });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const newAdvice = new Advice({
      title,
      content,
      ERP: user.id,
      Name: `${user.first_name} ${user.last_name}`,
      category,
    });
    await newAdvice.save();

    res
      .status(201)
      .json({ message: "Advice created successfully", advice: newAdvice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all advices with sorting, ordering, and pagination
app.get("/advices", async (req, res) => {
  const { category, sort, order, page } = req.query;
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const query = category ? { category } : {};
    const sortOption = sort ? { [sort]: order === "asc" ? 1 : -1 } : {};

    const advices = await Advice.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    const totalAdvices = await Advice.countDocuments(query);
    const totalPages = Math.ceil(totalAdvices / limit);

    res.json({ advices, totalPages, currentPage: page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Like an advice
app.patch("/advices/like/:id", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;

  try {
    const advice = await Advice.findById(req.params.id);
    if (!advice) {
      return res.status(404).json({ message: "Advice not found" });
    }

    if (advice.likedBy.includes(userId)) {
      advice.likedBy.pull(userId);
      advice.popularity -= 1;
    } else {
      advice.likedBy.push(userId);
      advice.popularity += 1;
    }

    await advice.save();
    res.json({
      popularity: advice.popularity,
      liked: advice.likedBy.includes(userId),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get an advice by ID
app.get("/advices/:id", async (req, res) => {
  try {
    const advice = await Advice.findById(req.params.id);
    if (!advice) {
      return res.status(404).json({ message: "Advice not found" });
    }
    res.json(advice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update an advice
app.patch("/advices/:id", async (req, res) => {
  const { title, content, category } = req.body;

  try {
    const advice = await Advice.findById(req.params.id);
    if (!advice) {
      return res.status(404).json({ message: "Advice not found" });
    }

    advice.title = title || advice.title;
    advice.content = content || advice.content;
    advice.category = category || advice.category;
    await advice.save();

    res.json({ message: "Advice updated successfully", advice });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an advice
app.delete("/advices/:id", async (req, res) => {
  try {
    const advice = await Advice.findById(req.params.id);
    if (!advice) {
      return res.status(404).json({ message: "Advice not found" });
    }

    await advice.remove();
    res.json({ message: "Advice deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
