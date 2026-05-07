import nodemailer from "nodemailer";
import ApiError from "../utils/ApiError.js";
import { StatusCodes } from "http-status-codes";

// create transporter once
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

// send OTP email
export const sendOtpOnMail = async (subject, email, otp) => {
   try {
      const message = {
         from: process.env.SMTP_MAIL,
         to: email,
         subject,
         html: `
            <div style="font-family: Arial, sans-serif;">
               <h2>OTP Verification</h2>
               <p>Your OTP is:</p>
               <h1>${otp}</h1>
               <p>This OTP will expire in 10 minutes.</p>
            </div>
         `,
      };
      const info = await transporter.sendMail(message);
      return info;
   } catch (error) {
      console.error("EMAIL ERROR:", error);
      throw new ApiError(
         StatusCodes.INTERNAL_SERVER_ERROR,
         "Email sending failed"
      );
   }
};
