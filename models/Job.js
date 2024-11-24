const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  employer: { type: String, required: true },
  role: { type: String, required: true },
  date_start: { type: Date, required: true },
  date_end: { type: Date },
  alumni_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Alumni",
    required: true,
  },
});

const Job = mongoose.model("Job", jobSchema);

module.exports = Job;
