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
const Job = require("./models/Job");
const Admin = require("./models/Admin");

const setupLikedStoriesForUser = async (userId) => {
  try {
    const stories = await Story.find();
    const likedStories = stories
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * stories.length))
      .map((story) => story._id);

    await User.updateOne({ _id: userId }, { $set: { likedStories } });
  } catch (err) {
    console.error("Error setting up liked stories:", err);
  }
};

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
    user = await Admin.findOne({ id });
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
      jobs: [], // Initialize jobs as an empty array
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
app.post("/stories", async (req, res) => {
  const { title, content } = req.body;
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

    const newStory = new Story({
      title,
      content,
      ERP: user.id,
      Name: `${user.first_name} ${user.last_name}`,
      userId: user._id, // Save userId
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

// Get all stories without pagination
app.get("/all-stories", async (req, res) => {
  try {
    const stories = await Story.find();
    res.json(stories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Get all advices without pagination
app.get("/all-advices", async (req, res) => {
  try {
    const advices = await Advice.find();
    res.json(advices);
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
      userId: user._id, // Save userId
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

app.get("/alumni/profile", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;

  try {
    const alumni = await Alumni.findOne({ id: userId });

    if (!alumni) {
      return res.status(404).json({ error: "Alumni not found" });
    }

    res.json(alumni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/advices/alumni", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;

  try {
    const advices = await Advice.find({ ERP: userId });
    res.json({ advices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
app.get("/stories/alumni", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;

  try {
    const stories = await Story.find({ ERP: userId });
    res.json({ stories });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/alumni/jobs", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;

  try {
    const alumni = await Alumni.findOne({ id: userId });

    if (!alumni) {
      return res.status(404).json({ error: "Alumni not found" });
    }

    res.json(alumni.jobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.put("/alumni/profile", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;
  const { first_name, last_name, sex, degree, major, graduation, image } =
    req.body;

  try {
    const alumni = await Alumni.findOne({ id: userId });

    if (!alumni) {
      return res.status(404).json({ error: "Alumni not found" });
    }

    alumni.first_name = first_name || alumni.first_name;
    alumni.last_name = last_name || alumni.last_name;
    alumni.sex = sex || alumni.sex;
    alumni.degree = degree || alumni.degree;
    alumni.major = major || alumni.major;
    alumni.graduation = graduation || alumni.graduation;
    alumni.image = image || alumni.image;

    await alumni.save();

    res.json({ message: "Profile updated successfully", alumni });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new job
app.post("/alumni/jobs", async (req, res) => {
  const { employer, role, date_start, date_end } = req.body;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;

  try {
    const alumni = await Alumni.findOne({ id: userId });
    if (!alumni) {
      return res.status(404).json({ message: "Alumni not found" });
    }

    const newJob = new Job({
      employer,
      role,
      date_start,
      date_end,
      alumni_id: alumni._id,
    });
    await newJob.save();

    alumni.jobs.push(newJob._id);
    await alumni.save();

    res.status(201).json({ message: "Job created successfully", job: newJob });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a job
app.patch("/alumni/jobs/:id", async (req, res) => {
  const { employer, role, date_start, date_end } = req.body;
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;

  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const alumni = await Alumni.findOne({ id: userId });
    if (!alumni || !alumni.jobs.includes(job._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    job.employer = employer || job.employer;
    job.role = role || job.role;
    job.date_start = date_start || job.date_start;
    job.date_end = date_end || job.date_end;

    await job.save();

    res.json({ message: "Job updated successfully", job });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a job
app.delete("/alumni/jobs/:id", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;

  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    const alumni = await Alumni.findOne({ id: userId });
    if (!alumni || !alumni.jobs.includes(job._id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await job.remove();
    alumni.jobs.pull(job._id);
    await alumni.save();

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get student profile
app.get("/student/profile", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;

  try {
    const student = await Student.findOne({ id: userId });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Update student profile
app.put("/student/profile", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;
  const { first_name, last_name, sex, degree, major, graduation, image } =
    req.body;

  try {
    const student = await Student.findOne({ id: userId });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    student.first_name = first_name || student.first_name;
    student.last_name = last_name || student.last_name;
    student.sex = sex || student.sex;
    student.degree = degree || student.degree;
    student.major = major || student.major;
    student.graduation = graduation || student.graduation;
    student.image = image || student.image;

    await student.save();

    res.json({ message: "Profile updated successfully", student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Promote a student
app.patch("/student/promotion", async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.verify(token, "your_jwt_secret");
  const userId = decoded.id;

  try {
    const student = await Student.findOne({ id: userId });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Update the student's status or any other relevant fields
    student.status = "promoted"; // Example field update
    await student.save();

    res.json({ message: "Student promoted successfully", student });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get all profiles
app.get("/all-profiles", async (req, res) => {
  try {
    const students = await Student.find();
    const alumni = await Alumni.find();
    const admins = await Admin.find();

    const profiles = [
      ...students.map((student) => ({
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        role: "student",
      })),
      ...alumni.map((alumnus) => ({
        id: alumnus.id,
        name: `${alumnus.first_name} ${alumnus.last_name}`,
        role: "alumni",
      })),
      ...admins.map((admin) => ({
        id: admin.id,
        name: "Admin",
        role: "admin",
      })),
    ];

    res.json(profiles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a student
app.delete("/student/:id", async (req, res) => {
  try {
    const student = await Student.findOneAndDelete({ id: req.params.id });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an alumnus
app.delete("/alumni/:id", async (req, res) => {
  try {
    const alumnus = await Alumni.findOneAndDelete({ id: req.params.id });
    if (!alumnus) {
      return res.status(404).json({ message: "Alumnus not found" });
    }
    res.json({ message: "Alumnus deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete an admin
app.delete("/admin/:id", async (req, res) => {
  try {
    const admin = await Admin.findOneAndDelete({ id: req.params.id });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    res.json({ message: "Admin deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
app.get("/keep-alive", (req, res) => {
  res.status(200).json({ message: "Server is alive" });
});
