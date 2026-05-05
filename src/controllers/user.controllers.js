import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../middlewares/error.middleware.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";
import { sendOtpOnMail } from "../helpers/email.helper.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import crypto from "crypto";

//generate access and refresh token
const generateAccessAndRefreshTokens = async (userId) => {
   const user = await User.findById(userId);
   const accessToken = user.generateAccessToken();
   const refreshToken = user.generateRefreshToken();
   user.refreshToken = refreshToken;
   await user.save({ validateBeforeSave: false });
   return { accessToken, refreshToken };
};

//cookie option
const options = {
   httpOnly: true,
   secure: process.env.COOKIE_SECURE === "true", // Set secure flag based on environment variable
   sameSite: "Strict",
};

//register user
const registerUser = asyncHandler(async (req, res, next) => {
   const { name, email, password } = req.body;
   if (!name) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Name is required!"));
   }
   if (!email) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Email is required!"));
   }
   if (!password) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "Password is required!")
      );
   }
   const user = await User.findOne({ email });
   if (user) {
      return next(new ApiError(StatusCodes.CONFLICT, "User already exist!"));
   }
   const otp = Math.floor(1000 + Math.random() * 9000);
   await sendOtpOnMail("Verify user OTP!", email, otp);
   const newUser = await User.create({
      name,
      email,
      otp,
      password,
      otpExpiry: Date.now() + 10 * 60 * 1000, // OTP expiry time 10 minutes
   });
   return res
      .status(StatusCodes.CREATED)
      .json(
         new ApiResponse(
            StatusCodes.CREATED,
            { newUser },
            "OTP send to user email please check your email!"
         )
      );
});

//verify user
const verifyUser = asyncHandler(async (req, res, next) => {
   const { email, otp } = req.body;
   if (!otp) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "OTP is required!"));
   }
   const user = await User.findOne({ email });
   if (!user) {
      return next(new ApiError(StatusCodes.NOT_FOUND, "User not found!"));
   }
   if (String(user.otp).trim() !== String(otp).trim()) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Invalid OTP!"));
   }
   if (user.otpExpiry < Date.now()) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "OTP has expired!"));
   }
   user.otp = "";
   user.otpExpiry = undefined;
   user.is_verified = true;
   await user.save({ validateBeforeSave: false });
   const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );
   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
   );
   const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );
   return res
      .status(StatusCodes.OK)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            StatusCodes.OK,
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully!"
         )
      );
});

//login user
const loginUser = asyncHandler(async (req, res, next) => {
   const { email, password } = req.body;
   if (!email) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Email is required!"));
   }
   if (!password) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "Password is required!")
      );
   }
   const user = await User.findOne({
      $or: [{ email }],
   });
   if (!user) {
      return next(
         new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials!")
      );
   }
   if (!user.is_verified) {
      const otp = Math.floor(1000 + Math.random() * 9000);
      await sendOtpOnMail("Verify user OTP!", email, otp);
      return next(
         new ApiError(
            StatusCodes.FORBIDDEN,
            "Please verify your account! An email has been sent to your email for OTP."
         )
      );
   }
   const isPasswordCorrect = await user.isPasswordCorrect(password);
   if (!isPasswordCorrect) {
      return next(
         new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials!")
      );
   }
   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
   );
   const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );
   return res
      .status(StatusCodes.OK)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            StatusCodes.OK,
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully!"
         )
      );
});

//google login
const googleLogin = asyncHandler(async (req, res, next) => {
   const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
   const { tokenId } = req.body;
   if (!tokenId) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "Token ID is required!")
      );
   }
   const ticket = await client.verifyIdToken({
      idToken: tokenId,
   });
   const payload = ticket.getPayload();
   const { email, name } = payload;
   let user = await User.findOne({ email });
   if (!user) {
      user = await User.create({
         name,
         email,
         password: crypto.randomBytes(5).toString("hex"),
      });
   }
   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
   );
   const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );
   return res
      .status(StatusCodes.OK)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            StatusCodes.OK,
            { user: loggedInUser, accessToken, refreshToken },
            "User logged in successfully!"
         )
      );
});

//logout user
const logoutUser = asyncHandler(async (req, res, next) => {
   await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            refreshToken: null,
         },
      },
      {
         new: true,
      }
   );
   return res
      .status(StatusCodes.OK)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(StatusCodes.OK, {}, "User logged out!"));
});

//refresh access token
const refreshAccessToken = asyncHandler(async (req, res, next) => {
   const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
   if (!incomingRefreshToken) {
      return next(
         new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized request!")
      );
   }
   const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
   );
   const user = await User.findById(decodedToken?._id);
   if (!user || user.refreshToken !== incomingRefreshToken) {
      return next(
         new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token")
      );
   }
   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
   );
   return res
      .status(StatusCodes.OK)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse(
            StatusCodes.OK,
            {
               user,
               accessToken: accessToken,
               refreshToken: refreshToken,
            },
            "Access token refreshed!"
         )
      );
});

//send OTP
const sendOTP = asyncHandler(async (req, res, next) => {
   const { email } = req.body;
   if (!email) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Email is required!"));
   }
   const user = await User.findOne({ email });
   if (!user) {
      return next(new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email!"));
   }
   const otp = Math.floor(1000 + Math.random() * 9000);
   await User.updateOne(
      { email },
      { $set: { otp: otp, otpExpiry: Date.now() + 10 * 60 * 1000 } }
   );
   await sendOtpOnMail("Forgot Password OTP!", email, otp);
   return res
      .status(StatusCodes.OK)
      .json(
         new ApiResponse(
            StatusCodes.OK,
            {},
            "OTP sent to your email successfully!"
         )
      );
});

//forgot password
const forgotPassword = asyncHandler(async (req, res, next) => {
   const { email, otp, password } = req.body;
   if (!otp || !password) {
      return next(
         new ApiError(StatusCodes.BAD_REQUEST, "OTP and Password is required!")
      );
   }
   const user = await User.findOne({ email });
   if (!user) {
      return next(new ApiError(StatusCodes.NOT_FOUND, "User not found!"));
   }
   if (String(user.otp).trim() !== String(otp).trim()) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "Invalid OTP!"));
   }
   if (user.otpExpiry < Date.now()) {
      return next(new ApiError(StatusCodes.BAD_REQUEST, "OTP has expired!"));
   }
   user.password = password;
   user.otp = "";
   user.otpExpiry = undefined;
   await user.save({ validateBeforeSave: false });
   return res
      .status(StatusCodes.OK)
      .json(
         new ApiResponse(StatusCodes.OK, {}, "Forgot password successfully!")
      );
});

//for admin only
//get users
const getUsers = asyncHandler(async (req, res, next) => {
   let search = "";
   if (req.query.search) {
      search = req.query.search;
   }
   let page = 1;
   if (req.query.page) {
      page = req.query.page;
   }
   const limit = 6;
   const users = await User.find({
      __v: 0,
      $or: [
         { name: { $regex: ".*" + search + ".*", $options: "i" } },
         { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
   })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();
   const count = await User.find({
      __v: 0,
      $or: [
         { name: { $regex: ".*" + search + ".*", $options: "i" } },
         { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
   }).countDocuments();
   return res.status(StatusCodes.OK).json(
      new ApiResponse(StatusCodes.OK, {
         users,
         totalPages: Math.ceil(count / limit),
         currentPage: page,
      })
   );
});

//change privilege
const changePrivilege = asyncHandler(async (req, res, next) => {
   const { value } = req.body;
   const { id } = req.params;
   const user = await User.findByIdAndUpdate(
      { _id: id },
      { $set: { is_admin: value } },
      { new: true }
   ).select("-password -refreshToken");
   if (!user) {
      return next(
         new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            "Error while changing user privilege!"
         )
      );
   }
   return res
      .status(StatusCodes.OK)
      .json(
         new ApiResponse(
            StatusCodes.OK,
            user,
            "Changed user privilege successfully."
         )
      );
});

//delete user
const deleteUser = asyncHandler(async (req, res, next) => {
   const { id } = req.params;
   const user = await User.findById(id);
   if (!user) {
      return next(new ApiError(StatusCodes.NOT_FOUND, "User not found"));
   }
   await User.deleteOne({ _id: id });
   return res
      .status(StatusCodes.OK)
      .json(new ApiResponse(StatusCodes.OK, {}, "User deleted!"));
});

export {
   registerUser,
   loginUser,
   logoutUser,
   changePrivilege,
   verifyUser,
   googleLogin,
   getUsers,
   deleteUser,
   forgotPassword,
   refreshAccessToken,
   sendOTP,
};
