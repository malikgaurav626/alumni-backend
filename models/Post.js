const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  userName: { type: String, required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  comments: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
      userName: { type: String },
      content: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
