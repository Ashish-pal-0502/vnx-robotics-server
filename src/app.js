import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

// app
const app = express();
//middleware
app.use(express.json({ limit: "1024kb" }));
app.use(express.urlencoded({ extended: true, limit: "1024kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(
   cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
   })
);
//test route
app.get("/", (req, res) => {
   res.send("We are live.");
});

//importing routes
import userRouter from "./routes/user.routes.js";
import blogRouter from "./routes/blog.routes.js";
import careerRouter from "./routes/career.routes.js";
import robotRouter from "./routes/robot.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import heroRouter from "./routes/hero.routes.js";

//routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/blog", blogRouter);
app.use("/api/v1/robot", robotRouter);
app.use("/api/v1/career", careerRouter);
app.use("/api/v1/hero", heroRouter);

//error handling middleware
app.use(errorMiddleware);

export { app };
