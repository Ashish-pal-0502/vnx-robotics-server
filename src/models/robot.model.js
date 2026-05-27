import mongoose from "mongoose";

const robotSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: true,
         trim: true,
         minlength: 2,
         maxlength: 100,
      },

      slug: {
         type: String,
         unique: true,
         lowercase: true,
         trim: true,
      },

      description: {
         type: String,
         required: true,
         trim: true,
         minlength: 10,
      },
      images: [
         {
            url: String,
            key: String,
         },
      ],
   },
   {
      timestamps: true,
   }
);

export const Robot = mongoose.model("Robot", robotSchema);
