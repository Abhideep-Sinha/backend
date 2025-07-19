import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser())

// API routes
app.use("/api/users", userRoutes);

export default app;