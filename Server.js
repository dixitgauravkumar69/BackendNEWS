const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const newsRoutes = require("./routes/newsRoutes");


app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));



app.use("/api/news", newsRoutes);


if (process.env.NODE_ENV === "production") {
  const __dirname1 = path.resolve();
  app.use(express.static(path.join(__dirname1, "/frontend/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname1, "frontend", "dist", "index.html"))
  );
}

app.get("/",(req,res)=>
{
   res.send("SERVER_STARTTED----")
})


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
