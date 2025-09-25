const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const News = require("../models/News");

const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "news_uploads",
    resource_type: "auto", // image/video auto
    public_id: (req, file) => Date.now().toString(),
  },
});

const upload = multer({ storage });

// Upload news
router.post("/", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Image is required" });

    const news = new News({
      title: req.body.title,
      description: req.body.description,
      image: req.file.path,
      video: req.body.video || "",
    });

    await news.save();
    res.status(201).json(news);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all news
router.get("/", async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Preview route for WhatsApp / OG tags
router.get("/:id/preview", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).send("News not found");

    const titleSafe = news.title.replace(/"/g, "&quot;");
    const descSafe = news.description.replace(/"/g, "&quot;");

    res.send(`<!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${titleSafe}</title>

        <!-- Open Graph -->
        <meta property="og:title" content="${titleSafe}" />
        <meta property="og:description" content="${descSafe}" />
        <meta property="og:image" content="${news.image}" />
        ${news.video ? `<meta property="og:video" content="${news.video}" />` : ""}
        <meta property="og:type" content="article" />
        <meta property="og:url" content="https://backendnews-h3lh.onrender.com/news/${news._id}/preview" />

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${titleSafe}" />
        <meta name="twitter:description" content="${descSafe}" />
        <meta name="twitter:image" content="${news.image}" />
        ${news.video ? `<meta name="twitter:player" content="${news.video}" />` : ""}

        <!-- Redirect to frontend -->
        <meta http-equiv="refresh" content="0;url=https://frontend-news-tau.vercel.app/news/${news._id}" />
      </head>
      <body>
        <p>Redirecting to <a href="https://frontend-news-tau.vercel.app/news/${news._id}">${titleSafe}</a>...</p>
      </body>
      </html>`);
  } catch (err) {
    console.error("Preview error:", err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;
