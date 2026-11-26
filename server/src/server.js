
import express from "express";
import 'dotenv/config'
import connectDB from "./config/db.js";
import cors from "cors";
import adminRoutes from "./routes/adminAuthRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import compression from "compression";
import helmet from "helmet";


const app = express();

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://esjcci.org.in",
  "https://www.esjcci.org.in",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(compression());
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.use("/api/admin", adminRoutes);
app.use("/api/document", documentRoutes);

// Connect MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
