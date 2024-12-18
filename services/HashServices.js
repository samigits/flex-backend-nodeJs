const credentials = require("../config/default");
const crypto = require("crypto");

function digestGenerator(payload) {
  var data = payload;
  var buffer = Buffer.from(data, "utf8");
  const hash = crypto.createHash("sha256");
  hash.update(buffer);
  var digest = hash.digest("base64");
  return digest;
}

function generateHttpSignature(resource, method, payload) {
  var signatureHeader = "";
  var signatureValue = "";

  console.log("sign: ", resource);

  signatureHeader += 'keyid="' + credentials.merchant.merchantKeyId, + '"';

  signatureHeader += ', algorithm="HmacSHA256"';

  if (method === "get") {
    var headersForGetMethod = "host date (request-target) v-c-merchant-id";
    signatureHeader += ', headers="' + headersForGetMethod + '"';
  } else if (method === "post") {
    var headersForPostMethod =
      "host date (request-target) digest v-c-merchant-id";
    signatureHeader += ', headers="' + headersForPostMethod + '"';
  }

  var signatureString = "host: " + credentials.runEnvironment;
  signatureString += "\ndate: " + new Date(Date.now()).toUTCString();
  signatureString += "\n(request-target): ";

  if (method === "get") {
    var targetUrlForGet = "get " + resource;
    signatureString += targetUrlForGet + "\n";
  } else if (method === "post") {
    // Digest for POST call
    var digest = digestGenerator(payload);

    var targetUrlForPost = "post " + resource;
    signatureString += targetUrlForPost + "\n";

    signatureString += "digest: SHA-256=" + digest + "\n";

    signatureString += "v-c-merchant-id: " + credentials.merchant.merchantId;

    var data = new Buffer.from(signatureString, "utf8");

    // Decoding scecret key
    var key = new Buffer.from(credentials.merchant.merchantSecretKey, "base64");
    signatureValue = crypto
      .createHmac("sha256", key)
      .update(data)
      .digest("base64");

    signatureHeader += ', signature="' + signatureValue + '"';
    return signatureHeader;
  }
}

module.exports = { generateHttpSignature, digestGenerator };
