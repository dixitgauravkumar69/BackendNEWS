const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const newsRoutes = require("./routes/newsRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

mongoose.connect(MONGO_URI).then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.use("/news", newsRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
