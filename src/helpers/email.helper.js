import nodemailer from "nodemailer";

const sendVerificationMail = (name, email, userId) => {
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
      //creating mail options
      const message = {
         from: process.env.SMTP_MAIL,
         to: email,
         subject: "For Verification Email",
         html:
            "<p>HI! " +
            name +
            ', Please click here to <a href="' +
            "http://localhost:7071/api/v1/auth" +
            "/verify/" +
            userId +
            '" target="_blank">Verify </a> your email. </p>',
      };
      //send email
      transporter.sendMail(message, function (error, info) {
         if (error) {
            // email failed silently — use a logging service in production
            console.error("Error sending verification email:", error);
         }
      });
   } catch (error) {
      // transporter setup failed
      console.error("Error setting up email transporter:", error);
   }
};

export { sendVerificationMail };
