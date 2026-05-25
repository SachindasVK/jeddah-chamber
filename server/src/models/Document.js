import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
  },

  uniqueId: {
    type: String,
    required: true,
    unique: true,
  },

  qrUrl: {
    type: String,
    required: true,
  },

  pdfPath: {
    type: String,
  },

  // Arabic Form Fields
  docNumber: {
    type: String,
  },

  unifiedNumber: {
    type: String,
  },

  commercialRegisterNumber: {
    type: String,
  }, // رقم السجل التجاري

  creationDate: {
    type: Date,
  },

  docStatus: {
    type: String,
    enum: ["active", "inactive", "archived"],
  },

  establishmentName: {
    type: String,
  },

  subscriptionNumber: {
    type: String,
  },

  requestSubmitter: {
    type: String,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

export default mongoose.model("Document", documentSchema);