const mongoose = require("mongoose");

const storySchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: Date, default: Date.now },
  ERP: { type: String, required: true },
  Name: { type: String, required: true },
  popularity: { type: Number, default: 0 },
  likedBy: [{ type: String }],
});

const Story = mongoose.model("Story", storySchema);

module.exports = Story;
