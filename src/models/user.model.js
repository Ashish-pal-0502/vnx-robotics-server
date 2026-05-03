import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         minlength: [3, "Name must be at least 3 characters long!"],
         maxlength: [20, "Name must be less than 20 characters long!"],
         validate: {
            validator: function (v) {
               return /^[a-zA-Z\s]+$/.test(v); // Only allows letters and spaces
            },
            message: (props) => `${props.value} is not a valid name!`,
         },
         trim: true,
      },
      email: {
         type: String,
         match: [/.+\@.+\..+/, "Please enter a valid email address!"],
         minlength: [3, "Email must be at least 3 characters long!"],
         maxlength: [30, "Email must be less than 30 characters long!"],
         unique: true,
         trim: true,
      },
      phone: {
         type: String,
         match: [/^\d{10}$/, "Please enter a valid 10-digit phone number!"],
         maxlength: [10, "Phone number must be 10 digits long!"],
         minlength: [10, "Phone number must be 10 digits long!"],
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
         minlength: [8, "Password must be at least 8 characters long!"],
         maxlength: [16, "Password must be less than 16 characters long!"],
      },
      otp: {
         type: String,
      },
      otpExpiry: {
         type: Date,
      },
      refreshToken: {
         type: String,
      },
   },
   { timestamps: true }
);

// encrypt password
userSchema.pre("save", async function (next) {
   if (!this.isModified("password")) return;
   this.password = await bcrypt.hash(this.password, 10);
   next;
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
         name: this.name,
         email: this.email,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
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
