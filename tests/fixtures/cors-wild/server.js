const cors = require("cors");
app.use(cors({ origin: "*", credentials: true }));
app.use(
  cors({
    origin: true,
  }),
);
app.use(cors());
