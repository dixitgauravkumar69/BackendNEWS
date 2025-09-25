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
router.get("/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).send("News not found");

    const titleSafe = news.title.replace(/"/g, "&quot;");
    const descSafe = news.description.replace(/"/g, "&quot;");

    const url = `https://backendnews-h3lh.onrender.com/news/${news._id}`;

    res.send(`<!doctype html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${titleSafe}</title>

        <!-- ✅ OG Tags (WhatsApp, FB, Twitter ke liye) -->
        <meta property="og:title" content="${titleSafe}" />
        <meta property="og:description" content="${descSafe.substring(0, 150)}..." />
        <meta property="og:image" content="${news.image}" />
        <meta property="og:url" content="${url}" />
        <meta property="og:type" content="article" />

        <!-- Twitter cards bhi cover ho jaye -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${titleSafe}" />
        <meta name="twitter:description" content="${descSafe.substring(0, 150)}..." />
        <meta name="twitter:image" content="${news.image}" />

        <style>
          body { font-family: Arial, sans-serif; background: #f5f5f5; display: flex; justify-content: center; padding: 30px; }
          .card { background: #fff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); max-width: 600px; overflow: hidden; }
          .card img { width: 100%; display: block; }
          .card .content { padding: 20px; }
          .card h2 { margin: 0 0 10px; font-size: 24px; }
          .card p { font-size: 16px; color: #555; }
          .card video { width: 100%; margin-top: 15px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="card">
          ${news.image ? `<img src="${news.image}" alt="${titleSafe}" />` : ""}
          <div class="content">
            <h2>${titleSafe}</h2>
            <p>${descSafe}</p>
            ${news.video ? `<video controls src="${news.video}"></video>` : ""}
          </div>
        </div>
      </body>
      </html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});




module.exports = router;
