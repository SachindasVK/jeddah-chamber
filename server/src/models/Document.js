import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  uniqueId: { type: String, required: true, unique: true }, // e.g., doc_12345
  qrUrl: { type: String, required: true }, // e.g., https://yourdomain.com/doc/doc_12345
  pdfPath: { type: String }, // Path to the uploaded file
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Document', documentSchema);