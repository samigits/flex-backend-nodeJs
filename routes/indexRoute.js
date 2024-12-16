var express = require("express");
var indexRouter = express.Router();
const paymentControl = require("../controller/paymentController");

indexRouter.get("/", function (req, res, next) {
  res.json({ message: "Welcome to the flex" });
});

indexRouter.post("/response", paymentControl.combinedApiAfterChallenge);
module.exports = indexRouter;
