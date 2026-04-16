import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "../config/ cloudinary.js";
import Document from "../models/Document.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Part 1: Generate the QR (You already have this working)
export const createDocumentAndQR = async (req, res) => {
  try {
    const { title } = req.body;
    const uniqueId = uuidv4();
    // This URL is what the user sees when they scan the QR
    // const qrUrl = `http://localhost:5000/api/document/verify/${uniqueId}`;
    const qrUrl = `http://172.20.10.5:5173/view/${uniqueId}`;
    const qrCodeImage = await QRCode.toDataURL(qrUrl);

    const newDoc = new Document({
      title,
      uniqueId,
      qrUrl,
      createdBy: req.admin.id,
    });

    await newDoc.save();

    res.status(201).json({
      success: true,
      document: newDoc,
      qrCodeImage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Part 2: Upload PDF to Cloudinary
export const uploadPdf = async (req, res) => {
  try {
    const { docId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No PDF file provided" });
    }

    // 1. Check if the document exists first
    const existingDoc = await Document.findById(docId);
    if (!existingDoc) {
      return res.status(404).json({ message: "Document record not found. Please generate QR first." });
    }

    // 2. Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "auto",
      folder: "jeddam_chamber_pdfs",
    });

    // 3. Update the record
    existingDoc.pdfPath = result.secure_url;
    await existingDoc.save();

    res.status(200).json({
      success: true,
      message: "PDF uploaded successfully",
      pdfUrl: result.secure_url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during upload" });
  }
};