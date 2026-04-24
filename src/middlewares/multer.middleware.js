import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";

//resolve path
const __dirname = path.resolve();
//storage
const storage = multer.diskStorage({
   destination: function (req, file, cb) {
      cb(null, path.join(__dirname, "./public/temp"));
   },
   filename: function (req, file, cb) {
      const uniqueId = uuidv4();
      cb(null, uniqueId + "-" + file.originalname);
   },
});

export const upload = multer({ storage });
