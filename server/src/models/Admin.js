import { Schema, model } from "mongoose";

const AdminSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  }
}, { 
  timestamps: true 
});

export default model("Admin", AdminSchema);