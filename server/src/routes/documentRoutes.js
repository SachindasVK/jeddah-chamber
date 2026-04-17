import express from 'express';
import multer from 'multer';
import { verifyToken } from '../middlewares/auth.js';
import Document from '../models/Document.js';
import { createDocumentAndQR, uploadPdf } from '../controllers/documentController.js';

const router = express.Router();

// Setup storage for local temp files before Cloudinary upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const uploads = multer({ storage });

// --- POST ROUTES ---
router.post('/generate', verifyToken, createDocumentAndQR);
router.post('/upload/:docId', verifyToken, uploads.single('pdf'), uploadPdf);

// --- GET ROUTES ---

/** * Public Route: Used by the QR Scanner (Phone)
 * Combined the two duplicates into this single clean route
 */
router.get('/view/:id', async (req, res) => {
  try {
    const doc = await Document.findOne({ uniqueId: req.params.id });

    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Ensure we return pdfUrl so the frontend iframe works
    res.json({
      success: true,
      title: doc.title,
      pdfUrl: doc.pdfPath, 
      date: doc.createdAt
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * Protected Route: Get all documents for Admin List (with pagination)
 */
router.get('/all', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5; 
    const skip = (page - 1) * limit;

    const totalDocs = await Document.countDocuments();
    const docs = await Document.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      documents: docs,
      totalPages: Math.ceil(totalDocs / limit),
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching documents" });
  }
});

/**
 * Protected Route: Get single document details by MongoDB _id
 */
router.get('/details/:id', verifyToken, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// --- DELETE ROUTES ---
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // Note: It's safer to use findByIdAndDelete to ensure you are using the MongoDB _id
    const deletedDoc = await Document.findByIdAndDelete(req.params.id);
    if (!deletedDoc) return res.status(404).json({ message: "Document not found" });
    
    res.status(200).json({ message: "Document deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;