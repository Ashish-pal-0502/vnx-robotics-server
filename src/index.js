import dotenv from "dotenv";
import connectDB from "./config/db.config.js";
import colors from "colors";

//dotenv config
dotenv.config({ path: "./.env" });

const { app } = await import("./app.js");
const { errorMiddleware } = await import("./middlewares/error.middleware.js");

connectDB()
   .then(() => {
      app.listen(process.env.PORT || 7072, () => {
         console.log(
            `\n◔ SERVER IS RUNNING ON PORT: ${process.env.PORT}`.bgBlue.white
         );
      });
   })
   .catch((error) => {
      console.log(`\n🔗 MONGODB CONNECTION FAILED!!! ${error}`.bgRed.white);
   });

//error middleware
app.use(errorMiddleware);
