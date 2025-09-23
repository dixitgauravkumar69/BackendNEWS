const express = require("express");
const multer = require("multer");
const path = require("path");
const News = require("../models/News");

const router = express.Router();

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// Upload news
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const news = new News({
      title: req.body.title,
      description: req.body.description,
      image: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
      video: req.body.video || "",
    });
    await news.save();
    res.status(201).json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all news
router.get("/", async (req, res) => {
  const news = await News.find().sort({ createdAt: -1 });
  res.json(news);
});

// Preview page for OG tags
router.get("/:id/preview", async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).send("News not found");

  res.send(`
    <html>
    <head>
      <meta property="og:title" content="${news.title}" />
      <meta property="og:description" content="${news.description}" />
      <meta property="og:image" content="${news.image}" />
      <meta property="og:url" content="https://yourfrontend.vercel.app/news/${news._id}" />
      <meta property="og:type" content="website" />
    </head>
    <body>
      <script>window.location.href="https://yourfrontend.vercel.app/news/${news._id}"</script>
    </body>
    </html>
  `);
});

module.exports = router;
