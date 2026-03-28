import multer from "multer";

const storage = process.env.AWS_BUCKET_NAME
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: "uploads/",
      filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
      },
    });

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const limits = {
  fileSize: 20 * 1024 * 1024,
};

export const upload = multer({
  storage,
  fileFilter,
  limits,
});
