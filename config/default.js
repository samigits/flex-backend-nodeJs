const credentials = {
  authenticationType: "http_signature",
  runEnvironment: "apitest.cybersource.com",
  merchant: {
    merchantId: "-- replace your merchant Id",
    merchantKeyId: "--- replace you merchant key Id ---",
    merchantSecretKey: "--- replace merchant secret key ---",
    keysDirectory: "Resource",
    keyFileName: "testrest",
    keyAlias: "testrest",
    keyPass: "testrest",
  },

  logging: {
    enableLog: false,
    LogFileName: "cybs",
    LogDirectory: "../../log",
    logfileMaxSize: 5242880,
  },
};

module.exports = credentials;
