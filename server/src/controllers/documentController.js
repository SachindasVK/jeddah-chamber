import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import cloudinary from "../config/ cloudinary.js";
import Document from "../models/Document.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const createDocumentAndQR = async (req, res) => {
  try {
    const { title } = req.body;

    // 1. Check if a document with this title already exists
    const existingDoc = await Document.findOne({ title: title.trim() });
    if (existingDoc) {
      return res.status(400).json({ 
        success: false, 
        message: "A document with this title already exists. Please use a unique title." 
      });
    }

    const uniqueId = uuidv4();
    const qrUrl = `http://192.168.43.89:5173/view/${uniqueId}`;

    const qrOptions = {
      errorCorrectionLevel: "H",
      version: 15,
      margin: 2,
      width: 300,
    };

    const qrCodeImage = await QRCode.toDataURL(qrUrl, qrOptions);

    const newDoc = new Document({
      title: title.trim(),
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
    if (err.code === 11000) {
      return res.status(400).json({ message: "Duplicate title or ID detected." });
    }
    res.status(500).json({ message: err.message });
  }
};



export const uploadPdf = async (req, res) => {
  try {
    const { docId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No PDF file provided" });
    }

    const existingDoc = await Document.findById(docId);
    if (!existingDoc) {
      if (req.file.path) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        message: "Document record not found. Please generate QR first.",
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "raw",
      folder: "jeddam_chamber_pdfs",
    });

    existingDoc.pdfPath = result.secure_url;
    await existingDoc.save();

    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Failed to delete local file:", err);
      else console.log("Local file deleted successfully");
    });

    res.status(200).json({
      success: true,
      message: "PDF uploaded successfully",
      pdfUrl: result.secure_url,
    });
  } catch (err) {
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    console.error(err);
    res.status(500).json({ message: "Server error during upload" });
  }
};

export const pdfDetails = async (req, res) => {
  try {
    const doc = await Document.findOne({ uniqueId: req.params.id });

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, message: "Document not found" });
    }

    res.json({
      success: true,
      title: doc.title,
      pdfUrl: doc.pdfPath,
      date: doc.createdAt,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const pdfList = async (req, res) => {
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
      currentPage: page,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching documents" });
  }
};

export const Details = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const pdfDelete = async (req, res) => {
  try {
    const deletedDoc = await Document.findByIdAndDelete(req.params.id);
    if (!deletedDoc)
      return res.status(404).json({ message: "Document not found" });

    res.status(200).json({ message: "Document deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
