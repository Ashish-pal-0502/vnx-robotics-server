import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";

const sendVerificationMail = async (name, email, password) => {
   try {
      //creating transporter
      const transporter = nodemailer.createTransport({
         host: "smtp.gmail.com",
         port: 587,
         secure: false,
         requireTLS: true,
         auth: {
            user: process.env.SMTP_MAIL,
            pass: process.env.SMTP_PASSWORD,
         },
      });
      const accessToken = jwt.sign(
         { name, email, password },
         process.env.ACCESS_TOKEN_SECRET,
         { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
      );
      //creating mail options
      const message = {
         from: process.env.SMTP_MAIL,
         to: email,
         subject: "For Verification Email",
         html: `<p>Hi ${name}, please click here to 
  <a href="http://localhost:3000/verify/${accessToken}" target="_blank">
  Verify
  </a> your email.</p>`,
      };
      //send email
      const res = await transporter.sendMail(message);
      return res;
   } catch (error) {
      return error;
   }
};

export { sendVerificationMail };
