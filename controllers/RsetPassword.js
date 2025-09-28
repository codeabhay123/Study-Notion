const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// =============================
// Send Reset Password Token
// =============================
exports.resetPasswordToken = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email does not exist",
      });
    }

    // 2. Generate token
    const token = crypto.randomUUID();

    // 3. Save token & expiry (10 mins)
    await User.findOneAndUpdate(
      { email },
      {
        token,
        resetPasswordExpires: Date.now() + 10 * 60 * 1000,
      },
      { new: true }
    );

    // 4. Create reset URL
    const resetUrl = `http://localhost:3000/update-password/${token}`;

    // 5. Send mail
    await mailSender(
      email,
      "Password Reset Link",
      `Click here to reset your password: ${resetUrl}`
    );

    return res.status(200).json({
      success: true,
      message: "Reset link sent successfully. Check your email.",
    });
  } catch (error) {
    console.error("Error in resetPasswordToken:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while generating reset password link",
    });
  }
};

// =============================
// Reset Password
// =============================
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword, token } = req.body;

    // 1. Validate passwords
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // 2. Find user by token
    const userDetails = await User.findOne({ token });
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "Invalid token",
      });
    }

    // 3. Check if token expired
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Token has expired, please regenerate",
      });
    }

    // 4. Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Update password & clear token fields
    await User.findOneAndUpdate(
      { token },
      {
        password: hashedPassword,
        token: null,
        resetPasswordExpires: null,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while resetting password",
    });
  }
};
