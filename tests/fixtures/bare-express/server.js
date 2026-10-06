const express = require("express");
const app = express();
app.get("/api/users", (req, res) => res.json([]));
app.post("/login", (req, res) => res.end());
app.delete("/api/orders/:id", requireAuth, (req, res) => res.end());
