import Admin from '../models/Admin.js';
import jwt from 'jsonwebtoken';
import { compare } from 'bcryptjs';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password)

    // 1. Find admin by email
    const admin = await Admin.findOne({ email });
    
    // If admin is not found in DB
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }


    // 2. Check if password matches
    const isMatch = await compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Create Token
    const token = jwt.sign(
      { id: admin._id }, 
      process.env.JWT_SECRET || 'your_secret_key', 
      { expiresIn: '1d' }
    );

    // 4. Send Response
    res.status(200).json({
      success: true,
      token,
      // Removed admin.name since we removed it from the Schema
      admin: { id: admin._id, email: admin.email } 
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};