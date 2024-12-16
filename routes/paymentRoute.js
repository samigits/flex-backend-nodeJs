const paymentRouter = require("express").Router();

const paymentControl = require("../controller/paymentController");

paymentRouter.post("/setup", paymentControl.setupAuthentication);
paymentRouter.post("/enrol-check", paymentControl.checkEnrollement);
paymentRouter.post("/authorize", paymentControl.paymentAuthorization);
paymentRouter.post("/capture", paymentControl.capturePayment);
paymentRouter.post("/combined", paymentControl.combinedApi);
paymentRouter.post(
  "/validate-authentication",
  paymentControl.combinedApiAfterChallenge
);
paymentRouter.post("/zero-auth", paymentControl.zeroAtuh);
paymentRouter.post(
  "/retrieve-token/:instrumentId",
  paymentControl.retrieveTokenDetail
);
paymentRouter.post("/pay-with-token", paymentControl.payUsingSavedCard)
module.exports = paymentRouter;
