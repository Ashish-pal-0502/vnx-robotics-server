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
         required: [true, "Description is required"],
      },

      location: {
         type: String,
         required: [true, "Location is required"],
         trim: true,
      },

      jobType: {
         type: String,
         enum: ["Full Time", "Part Time", "Internship", "Contract", "Remote"],
         default: "Full Time",
         trim: true,
      },

      category: {
         type: String,
         required: [true, "Category is required"],
         trim: true,
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
