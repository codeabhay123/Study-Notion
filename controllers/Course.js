const { success } = require("zod");
const Course = require("../models/Course");
const Tag = require("../models/tags");
const User = require("../models/User");
const { uploadImageCloudinary } = require("../utils/imageuploder");

// Create Course Handler
exports.createCourse = async (req, res) => {
  try {
    // fetch data
    const { courseName, courseDescription, whatYouWillLearn, price, tag } = req.body;

    // get the thumbnail
    const thumbnail = req.files?.thumbnailImage;

    // validation
    if (!courseName || !courseDescription || !whatYouWillLearn || !price || !tag || !thumbnail) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // check the instructor
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId);

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: "Instructor details not found",
      });
    }

    // check the tag
    const tagDetails = await Tag.findById(tag);
    if (!tagDetails) {
      return res.status(404).json({
        success: false,
        message: "Tag details not found",
      });
    }

    // upload thumbnail to Cloudinary
    const uploadedImage = await uploadImageCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );

    // create course entry in DB
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn,
      price,
      tag: tagDetails._id,
      thumbnail: uploadedImage.secure_url,
    });

    // add the new course to the instructor's courses array
    await User.findByIdAndUpdate(
      instructorDetails._id,
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    // add the new course to the tag's courses array
    await Tag.findByIdAndUpdate(
      tagDetails._id,
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    // send response after all DB updates
    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: newCourse,
    });

  } catch (error) {
    console.error("Error creating course:", error);
    return res.status(500).json({
      success: false,
      message: "Fail to creaat the coursef",
      error: error.message,
    });
  }
};



// Get All Courses
exports.showAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find(
      {},
      {
        courseName: true,
        price: true,
        thumbnail: true,
        instructor: true,
        ratingAndReview: true,
        studentEnrolled: true,
      }
    )
      .populate("instructor") // populate instructor details
      .exec();

    return res.status(200).json({
      success: true,
      message: "Data for all courses fetched successfully",
      data: allCourses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
      error: error.message,
    });
  }
};
