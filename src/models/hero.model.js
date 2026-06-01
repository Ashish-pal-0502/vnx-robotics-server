import mongoose from "mongoose";

const heroSchema = new mongoose.Schema(
   {
      desktopVideo: {
         url: {
            type: String,
         },
         key: {
            type: String,
         },
      },
      mobileVideo: {
         url: {
            type: String,
         },
         key: {
            type: String,
         },
      },
   },
   {
      timestamps: true,
   }
);

export const Hero = mongoose.model("Hero", heroSchema);
