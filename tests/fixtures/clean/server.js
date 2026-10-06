const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const app = express();
app.use(helmet());
app.use(rateLimit({ windowMs: 60000, max: 100 }));
app.use(requireAuth);
app.get("/api/users", (req, res) => res.json([]));
