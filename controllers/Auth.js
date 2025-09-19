const User = require("../models/User");
const OTP = require("../models/OTP");
const otpgenerator = require("otp-generator");
const bcrypt = require("bcrypt"); // Used to hash user passwords before saving
const jwt = require("jsonwebtoken"); // Import JWT for token generation


// =========================================================
// Send OTP Controller
// =========================================================
exports.sendOTP = async (req , res) => {
  try {
    const { email } = req.body; // extract email from request body

    // 1. Check if the user already exists in DB
    //    If yes → no need to send OTP because they are already registered
    const checkUserPresent = await User.findOne({ email });
    if (checkUserPresent){
      return res.status(401).json({
        success:false,
        message:"User is already registered",
      })
    }

    // 2. Generate a random 6-digit OTP
    //    - Only numbers allowed
    //    - No alphabets or special characters
    let otp = otpgenerator.generate(6,{
      upperCaseAlphabets:false,
      lowerCaseAlphabets:false,
      specialChars:false,
    });
    console.log("Generated OTP:", otp);

    // 3. Ensure OTP is unique in DB
    //    Keep regenerating if same OTP already exists
    let result = await OTP.findOne({ otp });
    while(result){
      otp = otpgenerator.generate(6,{
        upperCaseAlphabets:false,
        lowerCaseAlphabets:false,
        specialChars:false,
      });
      result = await OTP.findOne({ otp });
    }

    // 4. Save OTP in DB against email
    //    Schema has expiry so it will auto-delete after set time
    const otpPayload = { email , otp }
    const otpBody = await OTP.create(otpPayload);
    console.log("Saved OTP in DB:", otpBody);

    // 5. Send success response
    // ⚠️ Currently OTP is sent in response for testing
    //    In real production, you should send OTP via email/SMS instead
    res.status(200).json({
      success:true,
      message:'OTP sent successfully',
      otp, 
    })

  } catch (error) {
    console.log(error);
    // If anything goes wrong, send server error
    return res.status(500).json({
      success:false,
      message:error.message,
    })
  }
};


// =========================================================
// Signup Controller
// =========================================================
exports.signUp = async(req,res) =>{
  try {
    // Extract all required data from request body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp
    } = req.body;

    // 1. Validate required fields
    //    All fields must be filled, otherwise return error
    if(!firstName || !lastName || !email || !password || !confirmPassword || !otp){
      return res.status(403).json({
        success:false,
        message:"All fields are required"
      })
    }

    // 2. Check if password and confirmPassword match
    if(password !== confirmPassword){
      return res.status(400).json({
        success:false,
        message: 'Password and confirmPassword do not match'
      })
    }

    // 3. Check if user already exists
    //    If yes → stop signup
    const existingUser = await User.findOne({ email });
    if(existingUser){
      return res.status(400).json({
        success:false,
        message:'User already exists'
      })
    }

    // 4. Get most recent OTP for this email
    //    Sorted by createdAt (latest first)
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);

    // If OTP not found, return error
    if(recentOtp.length === 0){
      return res.status(400).json({
        success:false,
        message:"OTP not found"
      })
    }

    // 5. Validate OTP
    //    Compare OTP entered by user with latest OTP from DB
    if(otp !== recentOtp[0].otp){
      return res.status(400).json({
        success:false,
        message:"Invalid OTP"
      });
    }

    // 6. Encrypt (hash) the password before saving
    //    Never store plain text passwords in DB
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Optional: prepare profile details (separate collection can be used)
    //    Currently just adding default values
    const profileDetails = {
      gender:null,
      dateOfBirth:null,
      about:null,
      contactNumber:null
    }

    // 8. Create a new user in DB
    const user = await User.create ({
      firstName,
      lastName,
      email,
      contactNumber,
      password:hashedPassword, // store hashed password
      accountType,
      additionalDetails:profileDetails._id, // only valid if profile is saved separately
      image:`https://api.dicebear.com/9.x/initials/svg?seed=${firstName}%20${lastName}` // auto profile avatar
    })

    // 9. Send success response back
    return res.status(200).json({
      success:true,
      message:"User registered successfully",
      user
    })

  } catch (error) {
    console.log(error)
    // Server error catch
    return res.status(500).json({
      success:false,
      message:"User could not be registered. Please try again"
    })
  }
}




// =========================================================
// Login Controller
// =========================================================
exports.login = async (req , res )=>{
  try {
    // 1. Extract login credentials from request body
    const { email , password } = req.body;

    // 2. Validate input
    if(!email || !password){
      return res.status(403).json({
        success:false,
        message:"All fields are required. Please try again",
      });
    }

    // 3. Check if user exists in DB
    const user = await User.findOne({ email }).populate("additionalDetails");
    if(!user){
      return res.status(401).json({
        success:false,
        message:"User is not registered. Please sign up first"
      });
    }

    // 4. Compare entered password with hashed password in DB
    const isPasswordValid = await bcrypt.compare(password , user.password);
    if(!isPasswordValid){
      return res.status(401).json({
        success:false,
        message:"Invalid email or password"
      });
    }

    // 5. Generate JWT token with user payload
    const payload = {
      email: user.email,
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "2h", // token expiry
    });

    // 6. Hide password before sending user back
    user.password = undefined;

   user.token = token;
user.password = undefined;

//create cookie and send response
const options = {
  expires: new Date(Date.now() + 3*24*60*60*1000), // ✅ Cookie valid for 3 days
  httpOnly: true, // ✅ Can't access cookie from JS (security)
}

res.cookie("token", token, options).status(200).json({
  success: true,
  token,
  user,
  message: "Logged in successfully",
})


  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success:false,
      message:"Login failed. Please try again"
    });
  }
};
