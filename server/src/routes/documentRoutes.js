import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middlewares/auth.js';
import Document from '../models/Document.js';
import { createDocumentAndQR, uploadPdf } from '../controllers/documentController.js';

const router = express.Router();

// Setup storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const uploads = multer({ storage });

router.post('/generate', verifyToken, createDocumentAndQR);
router.post('/upload/:docId', verifyToken, uploads.single('pdf'), uploadPdf);
router.get('/view/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({ uniqueId: req.params.id });

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.get('/public/view/:uniqueId', async (req, res) => {
  try {
    const document = await Document.findOne({ uniqueId: req.params.uniqueId });
    
    if (!document) {
      return res.status(404).json({ message: "Document not found or invalid QR" });
    }

    res.status(200).json({
      success: true,
      title: document.title,
      pdfUrl: document.pdfPath, // This is the Cloudinary URL
      date: document.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});
export default router;