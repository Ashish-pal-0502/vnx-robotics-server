import mongoose from "mongoose";

const careerSchema = new mongoose.Schema(
   {
      title: {
         type: String,
         required: [true, "Job title is required"],
         trim: true,
      },
      description: {
         type: String,
         required: true,
      },
      applyLink: {
         type: String,
         trim: true,
      },
      postedBy: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User",
      },
   },
   {
      timestamps: true,
   }
);

export const Career = mongoose.model("Career", careerSchema);
