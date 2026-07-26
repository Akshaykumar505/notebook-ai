import fs from "fs";
import path from "path";
import { v4 as uuid } from "uuid";
import multer from "multer";
import { env } from "@/config/env";

// Make sure the upload directory exists before multer tries to write into it.
if (!fs.existsSync(env.UPLOAD_DIR)) {
  fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, env.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    // Prefix with a uuid so two uploads with the same original filename
    // never collide on disk.
    const ext = path.extname(file.originalname);
    cb(null, `${uuid()}${ext}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
});
