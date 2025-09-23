const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config();

const app = express();
const newsRoutes = require("./routes/newsRoutes");

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploads folder publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// API Routes
app.use("/api/news", newsRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  const __dirname1 = path.resolve();
  app.use(express.static(path.join(__dirname1, "/frontend/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "dist", "index.html"))
  );
}

// Test route
app.get("/", (req, res) => res.send("SERVER STARTED----"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
