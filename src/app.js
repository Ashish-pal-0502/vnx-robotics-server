import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

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

//only test purpose
app.get("/", (req, res) => {
   res.send("We are live.");
});

//import routes
import userRouter from "./routes/user.routes.js";
import blogRouter from "./routes/blog.routes.js";

//routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/blog", blogRouter);

export { app };
