import express from "express";
import dotenv from "dotenv";

dotenv.config({ path: new URL("../.env", import.meta.url).pathname });
import connectDB from "./config/db.js";
import cors from "cors";
import adminRoutes from "./routes/adminAuthRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import compression from "compression";
import helmet from "helmet";

const app = express();

connectDB();
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  }),
);
app.use(compression());
const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = [
  "https://esjcci.org.in",
  "https://www.esjcci.org.in",
  clientOrigin,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use(express.json());

app.use("/uploads", express.static("uploads"));
app.use("/api/admin", adminRoutes);
app.use("/api/document", documentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


