import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
   {
      heading: {
         type: String,
         trim: true,
         min: 3,
         max: 160,
         required: true,
      },
      image: [
         {
            url: String,
            key: String,
         },
      ],
      slug: {
         type: String,
      },
      content: {
         type: String,
         required: true,
      },
      mtitle: {
         type: String,
      },
      mdesc: {
         type: String,
      },
      user: {
         type: String,
      },
   },
   { timestamps: true }
);

export const Blog = mongoose.model("Blog", blogSchema);
