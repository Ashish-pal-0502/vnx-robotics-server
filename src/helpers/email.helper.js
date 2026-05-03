import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import ApiError from "../middlewares/error.middleware.js";

// create transporter once
const transporter = nodemailer.createTransport({
   host: process.env.SMTP_HOST,
   port: process.env.SMTP_PORT,
   secure: false,
   auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
   },
});

//send OTP on mail for forgot password
export const sendOtpOnMail = (subject, email, otp) => {
   try {
      //creating transporter
      const transporter = nodemailer.createTransport({
         host: process.env.SMTP_HOST,
         port: process.env.SMTP_PORT,
         secure: false,
         requireTLS: true,
         auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
         },
      });
      //creating mail options
      const message = {
         from: process.env.SMTP_MAIL,
         to: email,
         subject: `${subject}`,
         html: "<p>Your OTP: " + otp + "</p>",
      };
      //send email
      transporter.sendMail(message, function (error, info) {
         if (error) {
            throw new ApiError(500, "Email sending failed");
         }
      });
   } catch (error) {
      throw new ApiError(500, "Email sending failed");
   }
};
