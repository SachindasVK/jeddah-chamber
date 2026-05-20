import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ message: "Access Denied: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    
    req.admin = verified; 
    
    next();
  } catch (err) {
    const message = err.name === "TokenExpiredError" ? "Token Expired" : "Invalid Token";
    res.status(401).json({ message });
  }
};