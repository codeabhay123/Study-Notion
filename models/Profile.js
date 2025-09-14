const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  gender: {
    type: String,
  },
  dateOfBirth: {
    type: String,
  },
  about: {
    type: String,
  },
  contact: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model("Profile", profileSchema);
