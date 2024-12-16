const flexRouter = require("express").Router();

const flexControl = require("../controller/flexController");

flexRouter.post("/captureContextFromSdk", flexControl.captureContextFromSdk);
flexRouter.post("/verifyToken", flexControl.validateToken);
module.exports = flexRouter;
