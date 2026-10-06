router.get("/orders/:id", auth, async (req, res) => {
  res.json(await Order.findById(req.params.id));
});
router.delete("/orders/:id", auth, async (req, res) => {
  await Order.findOne({ _id: req.params.id });
});
