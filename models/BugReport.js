const mongoose = require("mongoose");

const bugReportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  reportedBy: { type: String, required: true }, // Store the id field as a string
  createdAt: { type: Date, default: Date.now },
  status: { type: String, default: "Open" }, // Status of the bug report (Open, In Progress, Closed)
});

const BugReport = mongoose.model("BugReport", bugReportSchema);

module.exports = BugReport;
