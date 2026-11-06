import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const UPLOAD_DIR = "uploads";
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXT = [".pdf", ".doc", ".docx"];

export const upload = multer({
  storage: multer.diskStorage({
    destination: UPLOAD_DIR,
    // Random name: avoids collisions and untrusted user-supplied filenames
    filename: (req, file, cb) =>
      cb(null, crypto.randomUUID() + path.extname(file.originalname).toLowerCase()),
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB, same as the modal
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.includes(ext)) return cb(null, true);
    cb(new Error("Only PDF or Word documents are allowed."));
  },
});