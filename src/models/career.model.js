import mongoose from "mongoose";

const careerSchema = new mongoose.Schema(
   {
      title: {
         type: String,
         required: [true, "Job title is required"],
         trim: true,
      },
      company: {
         type: String,
         required: [true, "Company name is required"],
         trim: true,
      },
      location: {
         type: String,
         required: [true, "Location is required"],
         trim: true,
      },
      jobType: {
         type: String,
         enum: ["Full-Time", "Part-Time", "Internship", "Contract"],
         default: "Full-Time",
      },
      experience: {
         type: String,
         required: true,
      },
      salary: {
         type: String,
      },
      description: {
         type: String,
         required: true,
      },
      skills: [
         {
            type: String,
            trim: true,
         },
      ],
      openings: {
         type: Number,
         default: 1,
      },
      deadline: {
         type: Date,
      },
      isActive: {
         type: Boolean,
         default: true,
      },
      slug: {
         type: String,
      },
      applyLink: {
         type: String,
         trim: true,
      },
      applyEmail: {
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
