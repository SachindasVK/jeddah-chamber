import express from "express";
import multer from "multer";
import { verifyToken } from "../middlewares/auth.js";

import {
  createDocumentAndQR,
  uploadPdf,
  pdfDetails,
  pdfList,
  Details,
  pdfDelete,
} from "../controllers/documentController.js";

const router = express.Router();
const storage = multer.memoryStorage();
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
