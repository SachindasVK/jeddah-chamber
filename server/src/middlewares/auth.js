import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1]; // Get token from "Bearer TOKEN"
  
  if (!token) return res.status(403).json({ message: "Access Denied" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = verified; // This contains the ID we put in the token during login
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid Token" });
  }
};