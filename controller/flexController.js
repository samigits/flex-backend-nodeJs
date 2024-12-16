const cybersourceRestApi = require("cybersource-rest-client");
const credentials = require("../config/default");
const jwt = require("jsonwebtoken");

exports.captureContextFromSdk = (req, res) => {
  try {
    console.log({ credentials });
    const configObject = {
      authenticationType: credentials.authenticationType,
      runEnvironment: credentials.runEnvironment,

      merchantID: credentials.merchant.merchantId,
      merchantKeyId: credentials.merchant.merchantKeyId,
      merchantsecretKey: credentials.merchant.merchantSecretKey,

      keyAlias: credentials.merchant.keyAlias,
      keyPass: credentials.merchant.keyPass,
      keyFileName: credentials.merchant.keyFileName,
      keysDirectory: credentials.merchant.keysDirectory,

      useMetaKey: false,
      portfolioID: "",

      logConfiguration: {
        enableLog: false,
        logFileName: credentials.logging.LogFileName,
        logDirectory: credentials.logging.logDirectory,
        logFileMaxSize: credentials.logging.logfileMaxSize,
        loggingLevel: "debug",
        enableMasking: true,
      },
    };

    var apiClient = new cybersourceRestApi.ApiClient();
    var reqObj = new cybersourceRestApi.GenerateCaptureContextRequest();

    reqObj.clientVersion = "v2.0";
    reqObj.targetOrigins = ["http://localhost"];
    reqObj.allowedCardNetworks = ["VISA", "MASTERCARD"];

    var instance = new cybersourceRestApi.MicroformIntegrationApi(
      configObject,
      apiClient
    );

    instance.generateCaptureContext(reqObj, function (error, data, response) {
      if (error) {
        console.log("Error", error);
      } else if (data) {
        console.log("Capture Context: ", JSON.stringify(data));
      }
      res.json({
        success: true,
        data: data,
      });
    });
  } catch (err) {
    console.log("ccSdk: ", err);
  }
};

exports.validateToken = async (req, res, next) => {
  try {
    console.log("at verify: ----");
    let flexToken = req.body.flexToken;
    flexToken = flexToken.replace(/["]/g, "");
    console.log("\n\n Transient Token: ", flexToken);
    const verificationResult = jwt.decode(flexToken, { complete: true });
    res.json({
      success: true,
      data: verificationResult,
    });
  } catch (err) {
    console.log("Validation Error:", err);
    res.status(500).json({
      success: false,
      err: "Tokne verfication failed",
    });
  }
};
