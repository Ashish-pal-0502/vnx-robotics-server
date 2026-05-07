import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

//app
const app = express();
//middleware
app.use(
   cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
   })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(morgan("dev"));

//only test purpose
app.get("/", (req, res) => {
   res.send("We are live.");
});

//import routes
import userRouter from "./routes/user.routes.js";
import blogRouter from "./routes/blog.routes.js";
import errorMiddleware from "./middlewares/error.middleware.js";

//routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/blog", blogRouter);

//error middleware
app.use(errorMiddleware);

export { app };
