import QRCode from "qrcode";
import { v4 as uuidv4 } from "uuid";
import cloudinary from "../config/cloudinary.js";
import Document from "../models/Document.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const createDocumentAndQR = async (req, res) => {
  try {
    const {
      title,
      docNumber,
      unifiedNumber,
      creationDate,
      docStatus,
      establishmentName,
      subscriptionNumber,
      requestSubmitter,
      commercialRegisterNumber,
    } = req.body;

    const docTitle = title?.trim() || `Document-${Date.now()}`;

    const existingDoc = await Document.findOne({ title: docTitle });
    if (existingDoc) {
      return res.status(400).json({
        success: false,
        message:
          "A document with this title already exists. Please use a unique title.",
      });
    }

    const uniqueId = uuidv4();
    const qrUrl = `${process.env.CLIENT_URL}/view/${uniqueId}`;

    const qrOptions = {
      errorCorrectionLevel: "Q",
      version: 15,
      margin: 2,
      width: 300,
    };

    const qrCodeImage = await QRCode.toDataURL(qrUrl, qrOptions);

    const newDoc = new Document({
      title: docTitle,
      uniqueId,
      qrUrl,
      createdBy: req.admin.id,
      docNumber: docNumber || undefined,
      unifiedNumber: unifiedNumber || undefined,
      creationDate: creationDate || undefined,
      docStatus: (docStatus && ["active", "inactive", "archived"].includes(docStatus)) ? docStatus : undefined,
      establishmentName: establishmentName || undefined,
      subscriptionNumber: subscriptionNumber || undefined,
      requestSubmitter: requestSubmitter || undefined,
      commercialRegisterNumber: commercialRegisterNumber || undefined,
    });

    await newDoc.save();

    res.status(201).json({
      success: true,
      document: newDoc,
      qrCodeImage,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res
      .status(400)
      .json({ success: false, message: "Duplicate title or ID detected." });
    }
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
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
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "jeddah_chamber_pdfs",
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: error.message });
        }

        existingDoc.pdfPath = result.secure_url;
        await existingDoc.save();

        return res.status(200).json({
          success: true,
          message: "PDF uploaded successfully",
          pdfUrl: result.secure_url,
        });
      },
    );

    uploadStream.end(req.file.buffer);
  } catch (err) {
    console.log(err)
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
      docNumber: doc.docNumber,
      unifiedNumber: doc.unifiedNumber,
      creationDate: doc.creationDate,
      docStatus: doc.docStatus,
      establishmentName: doc.establishmentName,
      subscriptionNumber: doc.subscriptionNumber,
      requestSubmitter: doc.requestSubmitter,
      commercialRegisterNumber: doc.commercialRegisterNumber,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const pdfList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search?.trim() || "";
    const skip = (page - 1) * limit;
    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: "i" } },
            { docNumber: { $regex: search, $options: "i" } },
            { unifiedNumber: { $regex: search, $options: "i" } },
            { docStatus: { $regex: search, $options: "i" } },
            { establishmentName: { $regex: search, $options: "i" } },
            { subscriptionNumber: { $regex: search, $options: "i" } },
            { requestSubmitter: { $regex: search, $options: "i" } },
            { commercialRegisterNumber: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const totalDocs = await Document.countDocuments(query);
    const docs = await Document.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      documents: docs,
      totalPages: Math.max(1, Math.ceil(totalDocs / limit)),
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

export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      docNumber,
      unifiedNumber,
      creationDate,
      docStatus,
      establishmentName,
      subscriptionNumber,
      requestSubmitter,
      commercialRegisterNumber,
    } = req.body;

    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    if (title && title.trim() !== doc.title) {
      const existingDoc = await Document.findOne({ title: title.trim() });
      if (existingDoc) {
        return res.status(400).json({
          success: false,
          message: "A document with this title already exists. Please use a unique title.",
        });
      }
      doc.title = title.trim();
    }

    if (docNumber !== undefined) doc.docNumber = docNumber || undefined;
    if (unifiedNumber !== undefined) doc.unifiedNumber = unifiedNumber || undefined;
    if (creationDate !== undefined) doc.creationDate = creationDate || undefined;
    if (docStatus !== undefined) {
      doc.docStatus = (docStatus && ["active", "inactive", "archived"].includes(docStatus)) ? docStatus : undefined;
    }
    if (establishmentName !== undefined) doc.establishmentName = establishmentName || undefined;
    if (subscriptionNumber !== undefined) doc.subscriptionNumber = subscriptionNumber || undefined;
    if (requestSubmitter !== undefined) doc.requestSubmitter = requestSubmitter || undefined;
    if (commercialRegisterNumber !== undefined) doc.commercialRegisterNumber = commercialRegisterNumber || undefined;

    await doc.save();

    res.status(200).json({
      success: true,
      message: "Document updated successfully.",
      document: doc,
    });
  } catch (err) {
    console.error("Error updating document:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
