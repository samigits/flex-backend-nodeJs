const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const indexRoute = require("./routes/indexRoute");
const flexRouter = require('./routes/flexRoute'); 
const paymentRouter = require('./routes/paymentRoute');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/", indexRoute);
app.use("/flex-microform", flexRouter);
app.use("/payment", paymentRouter )
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
