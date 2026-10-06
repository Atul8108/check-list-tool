const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const app = express();
app.use(helmet());
app.use(rateLimit({ windowMs: 60000, max: 100 }));
app.use(cors({ origin: "https://app.example.com", credentials: true }));
app.use(requireAuth);
const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET, { expiresIn: "1d" });
app.get("/orders/:id", async (req, res) => {
  res.json(await Order.findOne({ _id: req.params.id, user: req.user.id }));
});
app.get("/notes/:id", async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (note.owner.toString() !== req.user.id) return res.sendStatus(403);
});
app.post("/signin", async (req, res) => {
  await User.findOne({ email: String(req.body.email) });
});
