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

export const sendVerificationMail = async (name, email) => {
   try {
      if (!email) {
         throw new ApiError(400, "Email is required");
      }

      const accessToken = jwt.sign(
         { name, email },
         process.env.ACCESS_TOKEN_SECRET,
         { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
      );

      const message = {
         from: process.env.SMTP_MAIL,
         to: email,
         subject: "Verify your email",
         html: `
            <p>Hi ${name},</p>
            <p>Click below to verify your email:</p>
            <a href="${process.env.CLIENT_URL}/verify/${accessToken}">
               Verify Email
            </a>
         `,
      };

      const response = await transporter.sendMail(message);
      return response;
   } catch (error) {
      console.error("Mail Error:", error);
      throw new ApiError(500, "Email sending failed");
   }
};
