const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const newsRoutes = require("./routes/newsRoutes");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());



const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.use("/news", newsRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
