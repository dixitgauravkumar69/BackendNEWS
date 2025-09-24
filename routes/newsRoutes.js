const express = require("express");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const News = require("../models/News");

const router = express.Router();

// ✅ Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Multer Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith("video");
    return {
      folder: "news_uploads",
      resource_type: isVideo ? "video" : "image", // explicitly set video
      public_id: Date.now().toString(),
    };
  },
});

const upload = multer({ storage });

// ✅ Upload news (image + video)
router.post("/", upload.fields([{ name: "image", maxCount: 1 }, { name: "video", maxCount: 1 }]), async (req, res) => {
  try {
    if (!req.files?.image?.[0]) {
      return res.status(400).json({ error: "Image is required" });
    }

    const news = new News({
      title: req.body.title,
      description: req.body.description,
      image: req.files.image[0].path,
      video: req.files?.video?.[0]?.path || "", // optional
    });

    await news.save();
    res.status(201).json(news);
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});
// ✅ Get all news
router.get("/", async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Preview page for WhatsApp / OG Tags
router.get("/:id/preview", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).send("News not found");

    const descriptionSafe = news.description.replace(/"/g, "&quot;");

    res.send(`
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${news.title}</title>

        <!-- Open Graph -->
        <meta property="og:title" content="${news.title}" />
        <meta property="og:description" content="${descriptionSafe}" />
        <meta property="og:image" content="${news.image}" />
        <meta property="og:url" content="https://backendnews-h3lh.onrender.com/news/${news._id}" />
        <meta property="og:type" content="article" />

        <!-- Twitter -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${news.title}" />
        <meta name="twitter:description" content="${descriptionSafe}" />
        <meta name="twitter:image" content="${news.image}" />

        <!-- Auto redirect -->
        <meta http-equiv="refresh" content="0; url=https://frontend-news-tau.vercel.app/news/${news._id}" />
      </head>
      <body>
        <p>Redirecting to <a href="https://frontend-news-tau.vercel.app/news/${news._id}">${news.title}</a>...</p>
      </body>
      </html>
    `);
  } catch (err) {
    console.error("Preview error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
