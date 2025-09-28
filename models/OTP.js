const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
  },
  otp: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 10 * 60, // OTP expires after 5 minutes
  },
});

// function to send email with OTP
async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await mailSender(
      email,
      "Your OTP for verification",
      `Your OTP is <b>${otp}</b>. It will expire in 10 minutes. Please do not share it with anyone.`
    );
    console.log("Mail sent successfully:", mailResponse);
    return mailResponse;
  } catch (error) {
    console.log("Error sending email:", error.message);
    throw error;
  }
}

// pre-save hook: automatically send email after OTP is created
OTPSchema.pre("save", async function (next) {
  try {
    await sendVerificationEmail(this.email, this.otp);
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("OTP", OTPSchema);
