const mongoose = require("mongoose");

const ratingAndReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5, // ⭐ good practice to keep ratings between 1 and 5
  },
  review: {
    type: String,
    required: true,
    trim: true,
  },
});

module.exports = mongoose.model("RatingAndReview", ratingAndReviewSchema);
