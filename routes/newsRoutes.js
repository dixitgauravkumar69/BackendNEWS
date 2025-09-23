const express = require("express");
const multer = require("multer");
const path = require("path");
const News = require("../models/News");

const router = express.Router();

// Serve uploads publicly from project root
router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const backendUrl = process.env.BACKEND_URL || "https://backendnews-h3lh.onrender.com";

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, Date.now() + "-" + safeName);
  },
});
const upload = multer({ storage });

// Add news
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const newNews = new News({
      title: req.body.title,
      description: req.body.description,
      imageUrl: req.file ? `${backendUrl}/uploads/${req.file.filename}` : null,
      videoUrl: req.body.videoUrl || null,
    });
    await newNews.save();
    res.json(newNews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add news" });
  }
});

// Get all news
router.get("/", async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// Shareable news page
router.get("/share/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).send("News not found");

    const ogImage = news.imageUrl || `${backendUrl}/default-image.png`;
    const shortDesc = news.description.length > 150
      ? news.description.substring(0, 147) + "..."
      : news.description;

    const newsPageUrl = `${backendUrl}/news/${news._id}`;

    const html = `
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${news.title}</title>

        <meta property="og:type" content="article" />
        <meta property="og:title" content="${news.title}" />
        <meta property="og:description" content="${shortDesc}" />
        <meta property="og:image" content="${ogImage}" />
        <meta property="og:url" content="${newsPageUrl}" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${news.title}" />
        <meta name="twitter:description" content="${shortDesc}" />
        <meta name="twitter:image" content="${ogImage}" />

        <meta http-equiv="refresh" content="0; url=${newsPageUrl}" />
      </head>
      <body>
        <p>Redirecting to <a href="${newsPageUrl}">${news.title}</a>...</p>
      </body>
      </html>
    `;
    res.send(html);

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating preview");
  }
});

module.exports = router;