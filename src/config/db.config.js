import mongoose from "mongoose";

const connectDB = async () => {
   try {
      const mongoUri = process.env.MONGODB_URI.endsWith("/")
         ? `${process.env.MONGODB_URI}${process.env.DB_NAME}`
         : `${process.env.MONGODB_URI}/${process.env.DB_NAME}`;
      const ConnectionInstance = await mongoose.connect(mongoUri);
      console.log(
         `\n🔛 DATABASE CONNECTED !! DB HOST: ${ConnectionInstance.connection.host}`
            .bgGreen.white
      );
   } catch (error) {
      console.log(`\n🔗 DATABASE CONNECTION ERROR ${error}`.bgRed.white);
      process.exit(1);
   }
};

export default connectDB;
