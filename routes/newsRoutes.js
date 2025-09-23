const express = require("express");
const multer = require("multer");
const News = require("../models/News");

const router = express.Router();

// ✅ Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// ✅ Add news
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const newNews = new News({
      title: req.body.title,
      description: req.body.description,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : null,
      videoUrl: req.body.videoUrl || null,
    });

    await newNews.save();
    res.json(newNews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add news" });
  }
});

// ✅ Get all news
router.get("/", async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// ✅ Get single news
router.get("/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ error: "News not found" });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: "News not found" });
  }
});

// ✅ OG Preview Share route
router.get("/share/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).send("News not found");

    const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

    const html = `
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${news.title}</title>
        <meta property="og:title" content="${news.title}" />
        <meta property="og:description" content="${news.description.substring(0, 100)}..." />
        <meta property="og:image" content="${backendUrl}${news.imageUrl}" />
        <meta property="og:url" content="${backendUrl}/api/news/share/${news._id}" />
        <meta property="og:type" content="article" />
      </head>
      <body>
        <h2>${news.title}</h2>
        <p>${news.description}</p>
        ${news.imageUrl ? `<img src="${backendUrl}${news.imageUrl}" width="300"/>` : ""}
        ${news.videoUrl ? `<iframe width="400" height="250" src="${news.videoUrl}" title="video"></iframe>` : ""}
      </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    res.status(500).send("Error generating preview");
  }
});

module.exports = router;
