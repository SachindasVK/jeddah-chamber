import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import cors from 'cors'
import adminRoutes from './routes/adminAuthRoutes.js'
import documentRoutes from './routes/documentRoutes.js'
import compression from 'compression'
import helmet from 'helmet'

const app = express();

connectDB();
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json())

app.use('/uploads', express.static('uploads'));
app.use('/api/admin', adminRoutes);
app.use('/api/document',documentRoutes)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});