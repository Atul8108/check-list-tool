const jwt = require("jsonwebtoken");
const token = jwt.sign({ id: 1 }, "changeme", { expiresIn: "1d" });
const data = jwt.verify(token, process.env.JWT_SECRET || "changeme");
