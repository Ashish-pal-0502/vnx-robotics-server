import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         trim: true,
      },
      email: {
         type: String,
         unique: true,
         required: true,
         trim: true,
      },
      phone: {
         type: String,
         trim: true,
      },
      is_verified: {
         type: Boolean,
         default: false,
      },
      is_admin: {
         type: Boolean,
         default: false,
      },
      password: {
         type: String,
         required: true,
      },
      otp: {
         type: String,
      },
      otpExpiry: {
         type: Date,
      },
      otpAttempts: {
         type: Number,
         default: 0,
      },
      otpBlockedUntil: {
         type: Date,
      },
      refreshToken: {
         type: String,
      },
      refreshTokenExpiry: {
         type: Date,
      },
   },
   { timestamps: true }
);

// encrypt password
userSchema.pre("save", async function () {
   if (!this.isModified("password")) return;
   this.password = await bcrypt.hash(this.password, 10);
});

//verify password
userSchema.methods.isPasswordCorrect = async function (password) {
   return await bcrypt.compare(password, this.password);
};

//generate access token
userSchema.methods.generateAccessToken = function () {
   return jwt.sign(
      {
         _id: this._id,
         role: this.is_admin,
         name: this.name,
         email: this.email,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
         expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      }
   );
};

//generate refresh token
userSchema.methods.generateRefreshToken = function () {
   return jwt.sign(
      {
         _id: this._id,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
   );
};

export const User = mongoose.model("User", userSchema);
