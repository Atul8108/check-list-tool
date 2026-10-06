import Stripe from "stripe";
app.post("/webhook", (req, res) => {
  try { handle(req.body); } catch (e) {}
  res.sendStatus(200);
});
