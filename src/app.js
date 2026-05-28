import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

// app
const app = express();

// =========================
// CORS CONFIG
// =========================
const allowedOrigins = process.env.CORS_ORIGIN.split(",");

app.use(
   cors({
      origin: (origin, callback) => {
         // allow requests with no origin
         // (mobile apps, postman, server-to-server)
         if (!origin) {
            return callback(null, true);
         }

         if (allowedOrigins.includes(origin)) {
            callback(null, true);
         } else {
            callback(new Error("CORS not allowed"));
         }
      },
      credentials: true,
   })
);

// =========================
// MIDDLEWARES
// =========================
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));

// =========================
// TEST ROUTE
// =========================
app.get("/", (req, res) => {
   res.send("We are live.");
});

// =========================
// IMPORT ROUTES
// =========================
import userRouter from "./routes/user.routes.js";
import blogRouter from "./routes/blog.routes.js";
import careerRouter from "./routes/career.routes.js";
import robotRouter from "./routes/robot.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

// =========================
// ROUTES
// =========================
app.use("/api/v1/user", userRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/robot", robotRouter);
app.use("/api/v1/career", careerRouter);

// =========================
// ERROR MIDDLEWARE
// =========================
app.use(errorMiddleware);

export { app };
