const express = require("express");
const multer = require("multer");
const path = require("path");
const News = require("../models/News");

const router = express.Router();

// Serve uploaded images publicly
router.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Add news
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

// Get all news
router.get("/", async (req, res) => {
  try {
    const news = await News.find().sort({ createdAt: -1 });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// Get news by ID
router.get("/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).json({ error: "News not found" });
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: "News not found" });
  }
});

// Shareable news page (for WhatsApp/Facebook previews)
router.get("/share/:id", async (req, res) => {
  try {
    const news = await News.findById(req.params.id);
    if (!news) return res.status(404).send("News not found");

    const backendUrl = process.env.BACKEND_URL || "https://backendnews-h3lh.onrender.com";

    // Ensure image URL is absolute
    const imageUrl = news.imageUrl ? backendUrl + news.imageUrl : backendUrl + "/default-image.png";

    // Shorten description for meta tag
    const shortDesc = news.description.length > 150 ? news.description.substring(0, 147) + "..." : news.description;

    const html = `
      <!doctype html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${news.title}</title>

        <!-- Open Graph / Facebook -->
        <meta property="og:type" content="article" />
        <meta property="og:title" content="${news.title}" />
        <meta property="og:description" content="${shortDesc}" />
        <meta property="og:image" content="${imageUrl}" />
        <meta property="og:url" content="${backendUrl}/api/news/share/${news._id}" />

        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${news.title}" />
        <meta name="twitter:description" content="${shortDesc}" />
        <meta name="twitter:image" content="${imageUrl}" />
      </head>
      <body>
        <h2>${news.title}</h2>
        <p>${news.description}</p>
        ${news.imageUrl ? `<img src="${imageUrl}" width="300"/>` : ""}
        ${news.videoUrl ? `<iframe width="400" height="250" src="${news.videoUrl}" title="video" frameborder="0" allowfullscreen></iframe>` : ""}
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
