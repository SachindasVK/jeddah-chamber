import express from "express";
import multer from "multer";
import { verifyToken } from "../middlewares/auth.js";
import Document from "../models/Document.js";
import {
  createDocumentAndQR,
  uploadPdf,
  pdfDetails,
  pdfList,
  Details,
  pdfDelete,
} from "../controllers/documentController.js";

const router = express.Router();

// Setup storage for local temp files before Cloudinary upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const uploads = multer({ storage });

// --- POST ROUTES ---
router.post("/generate", verifyToken, createDocumentAndQR);
router.post("/upload/:docId", verifyToken, uploads.single("pdf"), uploadPdf);

// --- GET ROUTES ---
router.get("/view/:id", pdfDetails);
router.get("/all", verifyToken, pdfList);
router.get("/details/:id", verifyToken, Details);

// --- DELETE ROUTES ---
router.delete("/:id", verifyToken, pdfDelete);

export default router;
