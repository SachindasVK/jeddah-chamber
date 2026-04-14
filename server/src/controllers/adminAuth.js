import Admin from '../models/Admin.js';
import { hash } from 'bcryptjs';
import { createTransport } from 'nodemailer';
import jwt from 'jsonwebtoken';
import { compare } from 'bcryptjs';

export const signup = async(req, res)=> {
  try {
    const { name, email, password } = req.body;

    // 1. Check if admin already exists
    let admin = await Admin.findOne({ email });
    if (admin) return res.status(400).json({ message: "Admin already exists" });

    // 2. Hash Password
    const hashedPassword = await hash(password, 10);

    // 3. Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    // 4. Create Admin (Unverified)
    admin = new Admin({
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpires
    });

    await admin.save();

    // 5. Send OTP via Email
    const transporter = createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your QR Manager OTP Verification',
      text: `Your OTP is: ${otp}. It expires in 10 minutes.`
    });

    res.status(201).json({ success: true, message: "OTP sent to email" });

  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Server Error", error: error.message });
  }
}

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // 1. Find the admin
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // 2. Check if OTP is correct
    if (admin.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // 3. Check if OTP expired
    if (admin.otpExpires < Date.now()) {
      return res.status(400).json({ message: "OTP expired. Please sign up again." });
    }

    // 4. Verification Success: Update the admin
    admin.isVerified = true;
    admin.otp = undefined; // Clear OTP so it can't be used again
    admin.otpExpires = undefined;
    await admin.save();

    res.status(200).json({ success: true, message: "Account verified! You can now login." });
  } catch (error) {
    res.status(500).json({ message: "Verification failed", error: error.message });
  }
};



export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if admin exists
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // 2. Check if verified
    if (!admin.isVerified) {
      return res.status(401).json({ message: "Please verify your email first" });
    }

    // 3. Check password
    const isMatch = await compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // 4. Create JWT Token
    const token = jwt.sign(
      { id: admin._id }, 
      process.env.JWT_SECRET || 'your_secret_key', 
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email }
    });

  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};
