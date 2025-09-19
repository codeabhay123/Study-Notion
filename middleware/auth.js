const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

// Auth middleware
exports.auth = async (req, res, next) => {
  try {
    // Extract token
    const token =
      req.cookies.token ||
      req.body.token ||
      req.header("Authorization")?.replace("Bearer ", "").trim();

    // If token is missing
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is missing",
      });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);

      req.user = decoded; // attach payload to req.user
      next(); // proceed to the next middleware/route handler
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication failed",
      error: error.message,
    });
  }
};

//is student

exports.isStudent = async (req, res ,next ) =>{
    try {
       if(req.user.accountType !== "Student"){
        return res.status(401).json({
            sucesses:false,
            message:"This is the protected route only for the student"
        });
       }
       next();
        
    } catch (error) {
         return res.status(500).json({
            success:false,
            meassage:"user role can not be verified "
         });
    }
}

//is asdmin


exports.isStudent = async (req, res ,next ) =>{
    try {
       if(req.user.accountType !== "Student"){
        return res.status(401).json({
            sucesses:false,
            message:"This is the protected route only for the student"
        });
       }
       next();
        
    } catch (error) {
         return res.status(500).json({
            success:false,
            meassage:"user role can not be verified "
         });
    }
}

//is instructer


exports.isStudent = async (req, res ,next ) =>{
    try {
       if(req.user.accountType !== "Student"){
        return res.status(401).json({
            sucesses:false,
            message:"This is the protected route only for the student"
        });
       }
       next();
        
    } catch (error) {
         return res.status(500).json({
            success:false,
            meassage:"user role can not be verified "
         });
    }
} 