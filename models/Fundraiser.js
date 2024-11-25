const mongoose = require("mongoose");

const fundraiserSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  goalAmount: { type: Number, required: true }, // Total fundraising goal
  raisedAmount: { type: Number, default: 0 }, // Amount raised so far
});

const Fundraiser = mongoose.model("Fundraiser", fundraiserSchema);

module.exports = Fundraiser;
