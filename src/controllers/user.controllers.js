import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { StatusCodes } from "http-status-codes";
import { sendOtpOnMail } from "../helpers/email.helper.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import ApiError from "../utils/ApiError.js";
import { error } from "console";

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
const registerUser = asyncHandler(async (req, res) => {
   const { name, email, password } = req.body;
   if (!name) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Name is required!");
   }
   if (!email) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Email is required!");
   }
   if (!password) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Password is required!");
   }
   const user = await User.findOne({ email });
   if (user) {
      throw new ApiError(StatusCodes.CONFLICT, "User already exist!");
   }
   const otp = Math.floor(1000 + Math.random() * 9000);
   await sendOtpOnMail("Verify user OTP!", email, otp);
   await User.create({
      name,
      email,
      otp,
      password,
      otpExpiry: Date.now() + 10 * 60 * 1000, // OTP expiry time 10 minutes
   });
   return res.status(StatusCodes.CREATED).json(
      new ApiResponse({
         statusCode: StatusCodes.CREATED,
         data: {},
         message:
            "Registration successful! OTP send to user email please check your email!",
      })
   );
});

//verify user
const verifyUser = asyncHandler(async (req, res) => {
   const { email, otp } = req.body;
   if (!otp) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "OTP is required!");
   }
   const user = await User.findOne({ email });
   if (user && user.is_verified) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "User already verified!");
   }
   if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
   }
   if (String(user.otp).trim() !== String(otp).trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid OTP!");
   }
   if (user.otpExpiry < Date.now()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "OTP has expired!");
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
         new ApiResponse({
            statusCode: StatusCodes.OK,
            data: { accessToken },
            message: "User logged in successfully!",
         })
      );
});

//login user
const loginUser = asyncHandler(async (req, res) => {
   const { email, password } = req.body;
   if (!email) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Email is required!");
   }
   if (!password) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Password is required!");
   }
   const user = await User.findOne({
      $or: [{ email }],
   });
   if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials!");
   }
   if (!user.is_verified) {
      const otp = Math.floor(1000 + Math.random() * 9000);
      user.otp = otp;
      user.otpExpiry = Date.now() + 10 * 60 * 1000;
      await User.updateOne(
         { email },
         { $set: { otp: otp, otpExpiry: Date.now() + 10 * 60 * 1000 } }
      );
      await sendOtpOnMail("Verify user OTP!", email, otp);
      throw new ApiError(
         StatusCodes.FORBIDDEN,
         "An OTP has been sent to your email. Please verify it to continue."
      );
   }
   const isPasswordCorrect = await user.isPasswordCorrect(password);
   if (!isPasswordCorrect) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials!");
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
         new ApiResponse({
            statusCode: StatusCodes.OK,
            data: { accessToken },
            message: "User logged in successfully!",
         })
      );
});

//google login
const googleLogin = asyncHandler(async (req, res) => {
   const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
   const { tokenId, audience } = req.body;
   if (!tokenId) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Token ID is required!");
   }
   const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: audience,
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
         new ApiResponse({
            statusCode: StatusCodes.OK,
            data: { accessToken },
            message: "User logged in successfully!",
         })
      );
});

//get me
const getMe = asyncHandler(async (req, res) => {
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { user: req.user },
         message: "User found successfully.",
      })
   );
});

//logout user
const logoutUser = asyncHandler(async (req, res) => {
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
      .json(
         new ApiResponse({
            statusCode: StatusCodes.OK,
            data: {},
            message: "User logged out!",
         })
      );
});

//refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;
   if (!incomingRefreshToken) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized request!");
   }
   let decodedToken;
   try {
      decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
      );
   } catch (err) {
      throw new ApiError(
         StatusCodes.UNAUTHORIZED,
         "Invalid or expired refresh token"
      );
   }
   const user = await User.findById(decodedToken._id);
   if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "User not found");
   }
   if (user.refreshToken !== incomingRefreshToken) {
      user.refreshToken = null;
      await user.save();
      throw new ApiError(
         StatusCodes.UNAUTHORIZED,
         "Refresh token reuse detected"
      );
   }
   const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user._id
   );
   user.refreshToken = refreshToken;
   await user.save();
   const safeUser = await User.findById(user._id).select(
      "-password -refreshToken"
   );
   return res
      .status(StatusCodes.OK)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
         new ApiResponse({
            statusCode: StatusCodes.OK,
            data: {accessToken},
            message: "Access token refreshed successfully!",
         })
      );
});

//send OTP
const sendOTP = asyncHandler(async (req, res) => {
   const { email } = req.body;
   if (!email) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Email is required!");
   }
   const user = await User.findOne({ email });
   if (!user) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email!");
   }
   const otp = Math.floor(1000 + Math.random() * 9000);
   await User.updateOne(
      { email },
      { $set: { otp: otp, otpExpiry: Date.now() + 10 * 60 * 1000 } }
   );
   await sendOtpOnMail("Forgot Password OTP!", email, otp);
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: {},
         message: "OTP sent to your email successfully!",
      })
   );
});

//forgot password
const forgotPassword = asyncHandler(async (req, res) => {
   const { email, otp, password } = req.body;
   if (!otp) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "OTP is required!");
   }
   if (!password) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Password is required!");
   }
   const user = await User.findOne({ email });
   if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
   }
   if (String(user.otp).trim() !== String(otp).trim()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid OTP!");
   }
   if (user.otpExpiry < Date.now()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "OTP has expired!");
   }
   user.password = password;
   user.otp = "";
   user.otpExpiry = undefined;
   await user.save({ validateBeforeSave: false });
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: {},
         message: "Forgot password successfully!",
      })
   );
});

//for admin only
//get users
const getUsers = asyncHandler(async (req, res) => {
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
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: {
            users,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
         },
         message: "Users fetched successfully!",
      })
   );
});

//change privilege
const changePrivilege = asyncHandler(async (req, res) => {
   const { value } = req.body;
   if (value === undefined) {
      throw new ApiError(StatusCodes.BAD_REQUEST, "Value is required");
   }
   if (typeof value !== "boolean") {
      throw new ApiError(
         StatusCodes.BAD_REQUEST,
         "Value must be a boolean indicating admin status"
      );
   }
   const { id } = req.params;
   const user = await User.findByIdAndUpdate(
      { _id: id },
      {
         $set: {
            role: value ? "admin" : "user",
            is_admin: value,
         },
      },
      { new: true }
   ).select("-password -refreshToken");
   if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
   }
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: { user },
         message: "Changed user privilege successfully!",
      })
   );
});

//delete user
const deleteUser = asyncHandler(async (req, res) => {
   const { id } = req.params;
   const user = await User.findById(id);
   if (!user) {
      throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
   }
   await User.deleteOne({ _id: id });
   return res.status(StatusCodes.OK).json(
      new ApiResponse({
         statusCode: StatusCodes.OK,
         data: {},
         message: "User deleted!",
      })
   );
});

export {
   registerUser,
   loginUser,
   logoutUser,
   changePrivilege,
   verifyUser,
   googleLogin,
   getUsers,
   getMe,
   deleteUser,
   forgotPassword,
   refreshAccessToken,
   sendOTP,
};
