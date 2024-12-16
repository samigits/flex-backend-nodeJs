const superagent = require("superagent");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const {
  generateHttpSignature,
  digestGenerator,
} = require("../services/HashServices");

const config = require("../config/default");
const { normalizeParams } = require("../services/formatService");
const credentials = require("../config/default");
exports.setupAuthentication = async (req, res, next) => {
  try {
    console.log("\n\n Req Body setup: ", req.body);
    var isTransientToken = req.body.isTransientToken;
    var isSavedToken = req.body.isSavedToken;
    var transientToken = (await req.body.transientToken)
      ? req.body.transientToken
      : "";
    var paymentInstrument = req.body.paymentInstrument;
    if (isSavedToken && !paymentInstrument) {
      throw new Error("Invalid request, payment instrument is required");
    }
    var payloadAuth = {
      clientReferenceInformation: {
        code: Math.floor(10000000 + Math.random() * 90000000),
        partner: {
          developerId: "7891234",
          solutionId: "89012345",
        },
      },
    };
    if (!isSavedToken) {
      payloadAuth.tokenInformation = { transientToken: transientToken };
    } else {
      payloadAuth.paymentInformation = {
        customer: { customerId: "--- replace your merchant ---" },
      };
    }
    console.log("PayloadAuth Built: ", payloadAuth);
    var trxPayload = JSON.stringify(payloadAuth);
    var endpoint = "/risk/v1/authentication-setups/";
    var method = "post";
    var statusCode = -1;
    var url = "https://apitest.cybersource.com" + endpoint;

    var headerParams = {};
    var contentType = "application/json;charset=utf-8";
    var acceptType = "application/hal+json;charset=utf-8";
    var request = superagent(method, url);
    var bodyParam = trxPayload;
    var signature = generateHttpSignature(endpoint, method, bodyParam);
    var date = new Date(Date.now()).toUTCString();

    var digest = digestGenerator(trxPayload);
    digest = "SHA-256=" + digest;

    headerParams["digest"] = digest;
    headerParams["v-c-merchant-id"] = config.merchant.merchantId;
    headerParams["date"] = date;
    headerParams["host"] = config.runEnvironment;
    headerParams["signature"] = signature;
    headerParams["User-Agent"] = "Mozilla/5.0";

    //set header parameters
    request.set(normalizeParams(headerParams));

    //set timeout
    request.timeout(5000);

    request.type(contentType);

    request.send(bodyParam);

    request.accept(acceptType);

    request.end((err, response) => {
      var data = response.body;

      if (
        data == null ||
        (typeof data === "object" &&
          typeof data.length === "undefined" &&
          !Object.keys(data).length)
      ) {
        // SuperAgent does not always produce a body; use the unparsed response as a fallback
        data = response.text;
      }
      console.log("\n\n Authentication Setup:", data);
      var _status = -1;
      if (response["status"] >= 200 && response["status"] <= 299) {
        _status = 0;
      }
      console.log("Auth Setup Rsp: ", data);
      res.json({
        ok: true,
        header: response.header,
        data: data,
      });
    });
  } catch (err) {
    console.log(err);
  }
};

exports.checkEnrollement = async (req, res, next) => {
  try {
    console.log("enrol body req: ", req.body);
    var currency = req.body.currency;
    var totalAmount = req.body.totalAmount;
    var transientToken = req.body.flexResponse;

    var cardHolder = req.body.cardHolderName;
    var nameHasSpace = false;
    cardHolder.indexOf("") != -1 ? (nameHasSpace = true) : "";
    cardHolder = cardHolder.split(" ");
    var paReference = req.body.paReference;
    var returnUrl = req.body.returnUrl;
    var merchantReference = req.body.merchantRefrence
      ? req.body.merchantRefrence
      : Math.random() * (9999999 - 1000000 + 1) + 1000000;
    var cavvAuth = req.body.cavvAuth;
    var xidAuth = req.body.xidAuth;
    var authDirectoryServeTrxId = req.body.authDirectoryServeTrxId;
    const authSpecificationVersion = req.body.authSpecificationVersion;
    var ecommerceIndicatorAuth = req.body.ecommerceIndicatorAuth;

    var payloadAuth = {
      clientReferenceInformation: {
        code: merchantReference,
      },
      processingInformation: {
        commerceIndicator: ecommerceIndicatorAuth,
      },
      orderInformation: {
        amountDetails: {
          currency: currency,
          totalAmount: totalAmount,
        },
        billTo: {
          address1: "1 Market St",
          address2: "Address 2",
          administrativeArea: "CA",
          country: "US",
          locality: "san francisco",
          firstName: nameHasSpace ? cardHolder[0] : cardHolder,
          lastName: nameHasSpace ? cardHolder[1] : "",
          phoneNumber: "4158880000",
          email: "test@cybs.com",
          postalCode: "94105",
        },
      },
      tokenInformation: {
        jti: transientToken,
      },
      buyerInformation: {
        mobilePhone: 12345678844,
      },
      consumerAuthenticationInformation: {
        returnUrl: returnUrl,
        referenceId: paReference,
        transactionMode: "internet",
        cavv: cavvAuth,
        xid: xidAuth,
        directoryServerTransactionId: authDirectoryServeTrxId,
        paSpecificationVersion: authSpecificationVersion,
        challengeCode: "04",
        deviceChannel: "Browser",
        messageCategory: "01",
      },
    };

    var trxPayload = JSON.stringify(payloadAuth);
    console.log("Payload Check Enroll: ", payloadAuth);
    var endpoint = "/risk/v1/authentications/";
    var method = "post";
    var statusCode = -1;
    var url = "https://apitest.cybersource.com" + endpoint;
    var headerParams = {};
    var contentType = "application/json;charset=utf-8";
    var acceptType = "application/hal+json;charset=utf-8";
    var request = superagent(method, url);
    var bodyParam = trxPayload;

    var signature = generateHttpSignature(endpoint, method, bodyParam);
    var date = new Date(Date.now()).toUTCString();

    var digest = digestGenerator(trxPayload);
    digest = "SHA-256=" + digest;

    headerParams["digest"] = digest;
    headerParams["v-c-merchant-id"] = credentials.merchant.merchantId;
    headerParams["date"] = date;
    headerParams["host"] = credentials.runEnvironment;
    headerParams["signature"] = signature;
    headerParams["User-Agent"] = "Mozilla/5.0";

    request.set(normalizeParams(headerParams));
    request.timeout(5000);
    request.type(contentType);
    request.send(bodyParam);
    request.accept(acceptType);
    request.end((error, response) => {
      var data = response.body ? response.body : response.text;
      if (
        data === null ||
        (typeof data === "object" && !Object.keys(data).length)
      ) {
        // SuperAgent does not always produce a body; use the unparsed response as a fallback
        data = response.text;
        console.log("enroll check res: ", data);
      }

      var _status = -1;
      if (response["status"] >= 200 && response["status"] <= 299) {
        _status = 0;
      }
      res.json({
        ok: true,
        header: response.header,
        data: data,
      });
    });
  } catch (err) {
    res.status(400).json({ err });
  }
};

exports.paymentAuthorization = async (req, res, next) => {
  try {
    console.log("Auth Body: ", req.body);
    var totalAmount = req.body.itemPrice;
    var currency = req.body.currency;
    var isTransientToken = req.body.isTransientToken;
    var transientToken = req.body.flexresponse;

    var cardHolder = req.body.cardHolderName;
    var nameHasSpace = false;
    cardHolder.indexOf(" ") != -1 ? (nameHasSpace = true) : "";
    cardHolder = cardHolder.split(" ");

    var paReference = req.body?.paReference ?? "";
    var returnUrl = req.body?.returnUrl ?? "http://localhost:3000";
    var merchantReference =
      req.body?.merchantReference ??
      Math.random() * (9999999 - 1000000 + 1) + 1000000;
    var cavvAuth = req.body?.cavvAuth ?? "";
    var xidAuth = req.body?.xidAuth ?? "";
    var authDirectoryServeTrxId = req.body.authDirectoryServeTrxId
      ? req.body.authDirectoryServeTrxId
      : "";
    var authSpecificationVersion = req.body.authSpecificationVersion
      ? req.body.authSpecificationVersion
      : "";
    var ecommerceIndicatorAuth = req.body.ecommerceIndicatorAuth
      ? req.body.ecommerceIndicatorAuth
      : "vbv";

    var payload = {
      clientReferenceInformation: {
        code: "test_payment",
      },
      processingInformation: {
        commerceIndicator: ecommerceIndicatorAuth,
      },
      orderInformation: {
        billTo: {
          firstName: nameHasSpace ? cardHolder[0] : cardHolder,
          lastName: nameHasSpace ? cardHolder[1] : "",
          address1: "1 Market St",
          postalCode: "94105",
          locality: "san francisco",
          administrativeArea: "CA",
          country: "US",
          phoneNumber: "4158880000",
          company: "Visa",
          email: "test@cybs.com",
        },
        amountDetails: {
          totalAmount: totalAmount,
          currency: currency,
        },
      },
      ...(isTransientToken != 1
        ? {
            paymentInformation: {
              card: {
                type: "001",
                expirationMonth: "12",
                expirationYear: "2026",
                number: "4242424242424242",
              },
            },
          }
        : {
            tokenInformation: {
              jti: transientToken,
            },
          }),
      consumerAuthenticationInformation: {
        returnUrl: returnUrl,
        referenceId: paReference,
        transactionMode: "MOTO",
        cavv: cavvAuth,
        xid: xidAuth,
        directoryServerTransactionId: authDirectoryServeTrxId,
        paSpecificationVersion: authSpecificationVersion,
      },
    };
    var trxPayload = JSON.stringify(payload);
    console.log("Auth payload: ", payload);
    var endpoint = "/pts/v2/payments";
    var method = "post";
    var statusCode = -1;
    var url = "https://apitest.cybersource.com" + endpoint;

    var headerParams = {};
    var contentType = "application/json;charset=utf-8";
    var acceptType = "application/hal+json;charset=utf-8";
    var request = superagent(method, url);
    var bodyParam = trxPayload;

    var digest = digestGenerator(trxPayload);

    headerParams["digest"] = "SHA-256=" + digest;
    headerParams["v-c-merchant-id"] = credentials.merchant.merchantId;
    headerParams["date"] = new Date(Date.now()).toUTCString();
    headerParams["host"] = credentials.runEnvironment;
    headerParams["signature"] = await generateHttpSignature(
      endpoint,
      method,
      bodyParam
    );
    headerParams["User-Agent"] = "Mozilla/5.0";

    request.set(normalizeParams(headerParams));

    request.timeout(5000);
    request.type(contentType);
    request.send(bodyParam);
    request.accept(acceptType);
    request.end((err, response) => {
      var data = response.body ? response.body : response.text;
      console.log("\n\n Authorization : ", data);
      if (
        data === null ||
        (typeof data === "object" &&
          typeof data.length === "undefined" &&
          !Object.keys(data).length)
      ) {
        // SuperAgent does not always produce a body; use the unparsed response as a fallback
        data = response.text;
      }

      var _status = -1;
      if (response["status"] >= 200 && response["status"] <= 299) {
        _status = 0;
      }
      res.json({
        ok: true,
        header: response.header,
        data: data ? data : JSON.parse(response.text),
      });
    });
  } catch (err) {
    console.log("authorization err:", err);
  }
};

exports.capturePayment = async (req, res, next) => {
  try {
    const { paymentCode, amount, currency } = req.body;
    if (!paymentCode || !amount || !currency) {
      throw new Error("missing one or more required fields");
    }
    const payload = {
      clientReferenceInformation: {
        code: paymentCode,
      },
      orderInformation: {
        amountDetails: {
          totalAmount: amount,
          currency: currency,
        },
      },
    };

    var trxPayload = JSON.stringify(payload);
    var endpoint = `/pts/v2/payments/${paymentCode}/captures`;
    var method = "post";
    var statusCode = -1;
    var url = "https://apitest.cybersource.com" + endpoint;

    var headerParams = {};
    var contentType = "application/json;charset=utf-8";
    var acceptType = "application/hal+json;charset=utf-8";
    var request = superagent(method, url);
    var bodyParam = trxPayload;

    var digest = digestGenerator(trxPayload);

    headerParams["digest"] = "SHA-256=" + digest;
    headerParams["v-c-merchant-id"] = credentials.merchant.merchantId;
    headerParams["date"] = new Date(Date.now()).toUTCString();
    headerParams["host"] = credentials.runEnvironment;
    headerParams["signature"] = await generateHttpSignature(
      endpoint,
      method,
      bodyParam
    );
    headerParams["User-Agent"] = "Mozilla/5.0";

    request.set(normalizeParams(headerParams));

    request.timeout(5000);
    request.type(contentType);
    request.send(bodyParam);
    request.accept(acceptType);
    request.end((err, response) => {
      var data = response.body ? response.body : response.text;
      console.log("\n\n Authorization : ", data);
      if (
        data === null ||
        (typeof data === "object" &&
          typeof data.length === "undefined" &&
          !Object.keys(data).length)
      ) {
        // SuperAgent does not always produce a body; use the unparsed response as a fallback
        data = response.text;
      }

      var _status = -1;
      if (response["status"] >= 200 && response["status"] <= 299) {
        _status = 0;
      }
      res.json({
        ok: true,
        header: response.header,
        data: data ? data : JSON.parse(response.text),
      });
    });
  } catch (err) {
    console.log("capture err: ", err.message);
    res.status(400).json({ err: err.message });
  }
};

exports.combinedApi = async (req, res, next) => {
  try {
    console.log("CombinedOne: ", req.body);
    var {
      currency,
      totalAmount,
      transientToken,
      cardHolder,
      paReference,
      returnUrl,
      merchantReference,
      ecommerceIndicatorAuth,
      isSaveCard,
    } = req.body;
    // if (
    //   !currency ||
    //   !totalAmount ||
    //   !transientToken ||
    //   !cardHolder ||
    //   !merchantReference
    // ) {
    //   throw new Error("Missing required fields");
    // }
    var currency = req.body.currency;
    var totalAmount = req.body.totalAmount;
    var transientToken = req.body.transientToken;
    console.log({ flexResponse: transientToken });
    var cardHolder = req.body.cardHolder;
    var nameHasSpace = false;
    cardHolder.indexOf("") != -1 ? (nameHasSpace = true) : "";
    cardHolder = cardHolder.split(" ");
    var paReference = req.body.paReference;
    var returnUrl = req.body.returnUrl;
    var merchantReference = req.body.merchantReference;
    var ecommerceIndicatorAuth = req.body.ecommerceIndicatorAuth;

    var payloadAuth = {
      clientReferenceInformation: {
        code: merchantReference,
      },
      processingInformation: {
        commerceIndicator: ecommerceIndicatorAuth,
        capture: true,
        commerceIndicator: "internet",
        actionList: [
          "CONSUMER_AUTHENTICATION",
          isSaveCard ? "TOKEN_CREATE" : "",
        ],
        // actionList: ["CONSUMER_AUTHENTICATION", "TOKEN_CREATE"],
        actionTokenTypes: ["customer", "paymentInstrument", "shippingAddress"],
        authorizationOptions: {
          initiator: {
            type: "customer",
            storedCredentialUsed: "false",
          },
          aftIndicator: "true",
          fundingOptions: {
            initiator: {
              type: "S",
            },
          },
        },
      },
      orderInformation: {
        amountDetails: {
          currency: currency,
          totalAmount: totalAmount,
        },
        billTo: {
          address1: "1 Market St",
          address2: "Address 2",
          administrativeArea: "CA",
          country: "US",
          locality: "san francisco",
          firstName: nameHasSpace ? cardHolder[0] : cardHolder,
          lastName: nameHasSpace ? cardHolder[1] : "",
          phoneNumber: "4158880000",
          email: "test@cybs.com",
          postalCode: "94105",
        },
      },
      tokenInformation: {
        jti: transientToken,
      },
      deviceInformation: {
        ipAddress: "127.0.0.1",
        fingerprintSessionId: "146c1699-94ac-49fd-b593-bebc18c248b8",
        httpAcceptBrowserValue: "application/json",
        httpAcceptContent: "application/json",
        httpBrowserLanguage: "en-US",
        httpBrowserJavaEnabled: "N",
        httpBrowserJavaScriptEnabled: "N",
        httpBrowserColorDepth: "24",
        httpBrowserScreenHeight: "1280",
        httpBrowserScreenWidth: "1280",
        httpBrowserTimeDifference: "330",
        userAgentBrowserValue:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.48",
      },
      buyerInformation: {
        mobilePhone: 12345678844,
      },
      consumerAuthenticationInformation: {
        referenceId: paReference,
        returnUrl: "http://localhost:3000/response",
        transactionMode: "internet",
        deviceChannel: "BROWSER",
      },
      acquirerInformation: {
        merchantId: "boa1",
      },
      recipientInformation: {
        accountId: "987654321",
        accountType: "99",
        address1: "AlpineEcoRoad",
        address2: "Address2value",
        firstName: "recFirstname",
        lastName: "resLastname",
        middleName: "recMiddletname",
        locality: "recipient_city",
        country: "GBR",
        postalCode: "571216",
        streetName: "Alpineecoroad",
        dateOfBirth: "",
        beneficiaryId: "",
        beneficiaryName: "",
        buildingNumber: "TulipAppartment",
        beneficiaryAddress: "",
      },
      senderInformation: {
        account: {
          number: "154264765376576126571652675176",
          fundsSource: "02",
        },
        firstName: "senderfirstname",
        middleName: "sendermiddlename",
        lastName: "senderLastname",
        postalCode: "654321",
        phoneNumber: "01234567892",
        address1: "Colorfulstreet123",
        locality: "Rotterdam",
        countryCode: "GBR",
        identificationNumber: "12345678910111213223",
        personalIdType: "TXIN",
        administrativeArea: "KA",
        type: "B",
        name: "ThomasSmith",
        referenceNumber: "15426476537657",
      },
      merchantInformation: {
        vatRegistrationNumber: "15426476537657",
        merchantDescriptor: {
          name: "test",
          alternateName: "",
          contact: "",
          address1: "",
          locality: "MountainView",
          country: "",
          postalCode: "94044",
          administrativeArea: "CA",
          phone: "",
          url: "",
          countryOfOrigin: "",
          storeId: "",
          storeName: "",
          customerServicePhoneNumber: "",
        },
      },
      merchantDefinedInformation: [
        {
          key: "1",
          value: "test value 1",
        },
        {
          key: "2",
          value: "test value 2",
        },
        {
          key: "3",
          value: "test value 3",
        },
      ],
    };

    var trxPayload = JSON.stringify(payloadAuth);
    console.log("Payload Check Enroll: ", payloadAuth);
    var endpoint = "/pts/v2/payments/";
    var method = "post";
    var statusCode = -1;
    var url = "https://apitest.cybersource.com" + endpoint;
    var headerParams = {};
    var contentType = "application/json;charset=utf-8";
    var acceptType = "application/hal+json;charset=utf-8";
    var request = superagent(method, url);
    var bodyParam = trxPayload;

    var signature = generateHttpSignature(endpoint, method, bodyParam);
    var date = new Date(Date.now()).toUTCString();

    var digest = digestGenerator(trxPayload);
    digest = "SHA-256=" + digest;

    headerParams["digest"] = digest;
    headerParams["v-c-merchant-id"] = credentials.merchant.merchantId;
    headerParams["date"] = date;
    headerParams["host"] = credentials.runEnvironment;
    headerParams["signature"] = signature;
    headerParams["User-Agent"] = "Mozilla/5.0";

    request.set(normalizeParams(headerParams));
    request.timeout(5000);
    request.type(contentType);
    request.send(bodyParam);
    request.accept(acceptType);
    request.end((error, response) => {
      // console.log({ resComb: response.body });
      var data = response.body ? response.body : response.text;
      if (
        data === null ||
        (typeof data === "object" && !Object.keys(data).length)
      ) {
        // SuperAgent does not always produce a body; use the unparsed response as a fallback
        data = response.text;
        console.log("enroll check res: ", data);
      }

      var _status = -1;
      if (response["status"] >= 200 && response["status"] <= 299) {
        _status = 0;
      }
      res.json({
        ok: true,
        header: response.header,
        data: data,
      });
    });
  } catch (err) {
    console.log("capture err: ", err.message);
    res.status(400).json({ combinedApiErr: err.message });
  }
};

exports.combinedApiAfterChallenge = async (req, res, next) => {
  try {
    // console.log({ requestChallengeAFt: req.body });
    // var currency = req.body.currency;
    var currency = "USD";
    var isSavedCard = true;
    // var totalAmount = req.body.totalAmount;
    var totalAmount = 12.0;
    // var transientToken = req.body.flexResponse;
    var transientToken =
      "1E4ERBCI47DODN84P7JSYNAD2X7FS97GOWSLV3G8MULSDQFNJSC6675A9C7F0A11";
    var authTrxId = req.body.TransactionId;
    // var cardHolder = req.body.cardHolderName;
    var cardHolder = "John Doe";
    var nameHasSpace = false;
    console.log("req:", req.body);
    console.log("authTrxId:", authTrxId);
    cardHolder.indexOf("") != -1 ? (nameHasSpace = true) : "";
    cardHolder = cardHolder.split(" ");
    var merchantReference = req.body.merchantRefrence
      ? req.body.merchantRefrence
      : Math.random() * (9999999 - 1000000 + 1) + 1000000;
    var ecommerceIndicatorAuth = req.body.ecommerceIndicatorAuth;
    var payloadAuth = {
      clientReferenceInformation: {
        code: merchantReference,
      },
      processingInformation: {
        commerceIndicator: ecommerceIndicatorAuth,
        capture: false,
        commerceIndicator: "internet",
        actionList: ["VALIDATE_CONSUMER_AUTHENTICATION"], //"TOKEN_CREATE"],
        // actionTokenTypes: ["customer", "paymentInstrument", "shippingAddress"],
        authorizationOptions: {
          initiator: {
            type: "customer",
            storedCredentialUsed: "false",
          },
          aftIndicator: "true",
          fundingOptions: {
            initiator: {
              type: "S",
            },
          },
        },
      },
      orderInformation: {
        amountDetails: {
          currency: currency,
          totalAmount: totalAmount,
        },
        billTo: {
          address1: "1 Market St",
          address2: "Address 2",
          administrativeArea: "CA",
          country: "US",
          locality: "san francisco",
          firstName: nameHasSpace ? cardHolder[0] : cardHolder,
          lastName: nameHasSpace ? cardHolder[1] : "",
          phoneNumber: "4158880000",
          email: "test@cybs.com",
          postalCode: "94105",
        },
      },
      // tokenInformation: {
      //   jti: transientToken,
      // },
      deviceInformation: {
        ipAddress: "127.0.0.1",
        fingerprintSessionId: "146c1699-94ac-49fd-b593-bebc18c248b8",
      },
      consumerAuthenticationInformation: {
        authenticationTransactionId: authTrxId,
      },
      recipientInformation: {
        accountId: "987654321",
        accountType: "99",
        address1: "AlpineEcoRoad",
        address2: "Address2value",
        firstName: "recFirstname",
        lastName: "resLastname",
        middleName: "recMiddletname",
        locality: "recipient_city",
        country: "GBR",
        postalCode: "571216",
        streetName: "Alpineecoroad",
        dateOfBirth: "",
        beneficiaryId: "",
        beneficiaryName: "",
        buildingNumber: "TulipAppartment",
        beneficiaryAddress: "",
      },
      senderInformation: {
        account: {
          number: "154264765376576126571652675176",
          fundsSource: "02",
        },
        firstName: "senderfirstname",
        middleName: "sendermiddlename",
        lastName: "senderLastname",
        postalCode: "654321",
        phoneNumber: "01234567892",
        address1: "Colorfulstreet123",
        locality: "Rotterdam",
        countryCode: "GBR",
        identificationNumber: "12345678910111213223",
        personalIdType: "TXIN",
        administrativeArea: "KA",
        type: "B",
        name: "ThomasSmith",
        referenceNumber: "15426476537657",
      },
      merchantInformation: {
        vatRegistrationNumber: "15426476537657",
        merchantDescriptor: {
          name: "test",
          alternateName: "",
          contact: "",
          address1: "",
          locality: "MountainView",
          country: "",
          postalCode: "94044",
          administrativeArea: "CA",
          phone: "",
          url: "",
          countryOfOrigin: "",
          storeId: "",
          storeName: "",
          customerServicePhoneNumber: "",
        },
      },
      merchantDefinedInformation: [
        {
          key: "1",
          value: "test value 1",
        },
        {
          key: "2",
          value: "test value 2",
        },
        {
          key: "3",
          value: "test value 3",
        },
      ],
    };
    !isSavedCard
      ? (payloadAuth.tokenInformation = {
          jti: transientToken,
        })
      : (payloadAuth.paymentInformation = {
          customer: {
            id: "---replace your token ---",
          },
        });
    console.log("payAuthBuild:", payloadAuth);
    var trxPayload = JSON.stringify(payloadAuth);
    console.log("Payload Check Enroll: ", payloadAuth);
    var endpoint = "/pts/v2/payments/";
    var method = "post";
    var statusCode = -1;
    var url = "https://apitest.cybersource.com" + endpoint;
    var headerParams = {};
    var contentType = "application/json;charset=utf-8";
    var acceptType = "application/hal+json;charset=utf-8";
    var request = superagent(method, url);
    var bodyParam = trxPayload;

    var signature = generateHttpSignature(endpoint, method, bodyParam);
    var date = new Date(Date.now()).toUTCString();

    var digest = digestGenerator(trxPayload);
    digest = "SHA-256=" + digest;

    headerParams["digest"] = digest;
    headerParams["v-c-merchant-id"] = credentials.merchant.merchantId;
    headerParams["date"] = date;
    headerParams["host"] = credentials.runEnvironment;
    headerParams["signature"] = signature;
    headerParams["User-Agent"] = "Mozilla/5.0";

    request.set(normalizeParams(headerParams));
    request.timeout(5000);
    request.type(contentType);
    request.send(bodyParam);
    request.accept(acceptType);
    request.end((error, response) => {
      console.log({ resComb: response.body });
      var data = response.body ? response.body : response.text;
      if (
        data === null ||
        (typeof data === "object" && !Object.keys(data).length)
      ) {
        // SuperAgent does not always produce a body; use the unparsed response as a fallback
        data = response.text;
        console.log("enroll check res: ", data);
      }

      var _status = -1;
      if (response["status"] >= 200 && response["status"] <= 299) {
        _status = 0;
      }
      res.json({
        ok: true,
        header: response.header,
        data: data,
      });
      // res.redirect("http://localhost/visa-aft")
    });
  } catch (err) {
    console.log("capture err: ", err.message);
    res.status(400).json({ combinedApiErr: err.message });
  }
};

exports.zeroAtuh = async (req, res, next) => {
  try {
    var currency = req.body.currency;
    var totalAmount = req.body.totalAmount;
    var transientToken = req.body.flexResponse;
    console.log({ flexResponse: transientToken });
    var cardHolder = req.body.cardHolderName;
    var nameHasSpace = false;
    cardHolder.indexOf("") != -1 ? (nameHasSpace = true) : "";
    cardHolder = cardHolder.split(" ");
    paReference = req.body.paReference;
    var returnUrl = req.body.returnUrl;
    var merchantReference = req.body.merchantRefrence
      ? req.body.merchantRefrence
      : Math.random() * (9999999 - 1000000 + 1) + 1000000;
    // var cavvAuth = req.body.cavvAuth;
    // var xidAuth = req.body.xidAuth;
    // var authDirectoryServeTrxId = req.body.authDirectoryServeTrxId;
    // var authSpecificationVersion = req.body.authSpecificationVersion;
    var ecommerceIndicatorAuth = req.body.ecommerceIndicatorAuth;

    var payloadAuth = {
      clientReferenceInformation: {
        code: merchantReference,
      },
      processingInformation: {
        commerceIndicator: ecommerceIndicatorAuth,
        capture: true,
        commerceIndicator: "internet",
        actionList: ["CONSUMER_AUTHENTICATION", "TOKEN_CREATE"],
        authorizationOptions: {
          initiator: {
            type: "customer",
            storedCredentialUsed: "false",
          },
          aftIndicator: "true",
          fundingOptions: {
            initiator: {
              type: "S",
            },
          },
        },
      },
      orderInformation: {
        amountDetails: {
          currency: currency,
          totalAmount: 0,
        },
        billTo: {
          address1: "1 Market St",
          address2: "Address 2",
          administrativeArea: "CA",
          country: "US",
          locality: "san francisco",
          firstName: nameHasSpace ? cardHolder[0] : cardHolder,
          lastName: nameHasSpace ? cardHolder[1] : "",
          phoneNumber: "4158880000",
          email: "test@cybs.com",
          postalCode: "94105",
        },
      },
      tokenInformation: {
        jti: transientToken,
      },
      deviceInformation: {
        ipAddress: "127.0.0.1",
        fingerprintSessionId: "146c1699-94ac-49fd-b593-bebc18c248b8",
        httpAcceptBrowserValue: "application/json",
        httpAcceptContent: "application/json",
        httpBrowserLanguage: "en-US",
        httpBrowserJavaEnabled: "N",
        httpBrowserJavaScriptEnabled: "N",
        httpBrowserColorDepth: "24",
        httpBrowserScreenHeight: "1280",
        httpBrowserScreenWidth: "1280",
        httpBrowserTimeDifference: "330",
        userAgentBrowserValue:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.48",
      },
      buyerInformation: {
        mobilePhone: 12345678844,
      },
      consumerAuthenticationInformation: {
        referenceId: paReference,
        returnUrl: "http://localhost:3000/response",
        transactionMode: "internet",
        deviceChannel: "BROWSER",
      },
      acquirerInformation: {
        merchantId: "boa1",
      },
      recipientInformation: {
        accountId: "987654321",
        accountType: "99",
        address1: "AlpineEcoRoad",
        address2: "Address2value",
        firstName: "recFirstname",
        lastName: "resLastname",
        middleName: "recMiddletname",
        locality: "recipient_city",
        country: "GBR",
        postalCode: "571216",
        streetName: "Alpineecoroad",
        dateOfBirth: "",
        beneficiaryId: "",
        beneficiaryName: "",
        buildingNumber: "TulipAppartment",
        beneficiaryAddress: "",
      },
      senderInformation: {
        account: {
          number: "154264765376576126571652675176",
          fundsSource: "02",
        },
        firstName: "senderfirstname",
        middleName: "sendermiddlename",
        lastName: "senderLastname",
        postalCode: "654321",
        phoneNumber: "01234567892",
        address1: "Colorfulstreet123",
        locality: "Rotterdam",
        countryCode: "GBR",
        identificationNumber: "12345678910111213223",
        personalIdType: "TXIN",
        administrativeArea: "KA",
        type: "B",
        name: "ThomasSmith",
        referenceNumber: "15426476537657",
      },
      merchantInformation: {
        vatRegistrationNumber: "15426476537657",
        merchantDescriptor: {
          name: "test",
          alternateName: "",
          contact: "",
          address1: "",
          locality: "MountainView",
          country: "",
          postalCode: "94044",
          administrativeArea: "CA",
          phone: "",
          url: "",
          countryOfOrigin: "",
          storeId: "",
          storeName: "",
          customerServicePhoneNumber: "",
        },
      },
      merchantDefinedInformation: [
        {
          key: "1",
          value: "test value 1",
        },
        {
          key: "2",
          value: "test value 2",
        },
        {
          key: "3",
          value: "test value 3",
        },
      ],
    };

    var trxPayload = JSON.stringify(payloadAuth);
    console.log("Payload Check Enroll: ", payloadAuth);
    var endpoint = "/pts/v2/payments/";
    var method = "post";
    var statusCode = -1;
    var url = "https://apitest.cybersource.com" + endpoint;
    var headerParams = {};
    var contentType = "application/json;charset=utf-8";
    var acceptType = "application/hal+json;charset=utf-8";
    var request = superagent(method, url);
    var bodyParam = trxPayload;

    var signature = generateHttpSignature(endpoint, method, bodyParam);
    var date = new Date(Date.now()).toUTCString();

    var digest = digestGenerator(trxPayload);
    digest = "SHA-256=" + digest;

    headerParams["digest"] = digest;
    headerParams["v-c-merchant-id"] = credentials.merchant.merchantId;
    headerParams["date"] = date;
    headerParams["host"] = credentials.runEnvironment;
    headerParams["signature"] = signature;
    headerParams["User-Agent"] = "Mozilla/5.0";

    request.set(normalizeParams(headerParams));
    request.timeout(5000);
    request.type(contentType);
    request.send(bodyParam);
    request.accept(acceptType);
    request.end((error, response) => {
      console.log({ resComb: response.body });
      var data = response.body ? response.body : response.text;
      if (
        data === null ||
        (typeof data === "object" && !Object.keys(data).length)
      ) {
        // SuperAgent does not always produce a body; use the unparsed response as a fallback
        data = response.text;
        console.log("enroll check res: ", data);
      }

      var _status = -1;
      if (response["status"] >= 200 && response["status"] <= 299) {
        _status = 0;
      }
      res.json({
        ok: true,
        header: response.header,
        data: data,
      });
    });
  } catch (err) {
    console.log("zeroAtuh err: ", err.message);
    res.status(400).json({ zeroAuthErr: err.message });
  }
};

exports.payUsingSavedCard = async (req, res, next) => {
  try {
    console.log("CombinedOne Saved: ", req.body);
    var {
      currency,
      totalAmount,
      instrumentId,
      cardHolder,
      paReference,
      returnUrl,
      merchantReference,
      ecommerceIndicatorAuth,
      isSaveCard,
    } = req.body;
    // if (
    //   !currency ||
    //   !totalAmount ||
    //   !transientToken ||
    //   !cardHolder ||
    //   !merchantReference
    // ) {
    //   throw new Error("Missing required fields");
    // }
    var currency = req.body.currency;
    var totalAmount = req.body.totalAmount;
    var transientToken = req.body.transientToken;
    console.log({ flexResponse: transientToken });
    var cardHolder = req.body.cardHolder;
    var nameHasSpace = false;
    cardHolder.indexOf("") != -1 ? (nameHasSpace = true) : "";
    cardHolder = cardHolder.split(" ");
    var paReference = req.body.paReference;
    var returnUrl = req.body.returnUrl;
    var merchantReference = req.body.merchantReference;
    var ecommerceIndicatorAuth = req.body.ecommerceIndicatorAuth;

    var payloadAuth = {
      clientReferenceInformation: {
        code: merchantReference,
      },
      processingInformation: {
        capture: true,
        commerceIndicator: "internet",
        actionList: ["CONSUMER_AUTHENTICATION"],
        // actionList: ["CONSUMER_AUTHENTICATION", "TOKEN_CREATE"],
        authorizationOptions: {
          initiator: {
            type: "customer",
            storedCredentialUsed: "false",
          },
          aftIndicator: "true",
          fundingOptions: {
            initiator: {
              type: "S",
            },
          },
        },
      },
      orderInformation: {
        amountDetails: {
          currency: currency,
          totalAmount: totalAmount,
        },
        billTo: {
          address1: "1 Market St",
          address2: "Address 2",
          administrativeArea: "CA",
          country: "US",
          locality: "san francisco",
          firstName: nameHasSpace ? cardHolder[0] : cardHolder,
          lastName: nameHasSpace ? cardHolder[1] : "",
          phoneNumber: "4158880000",
          email: "test@cybs.com",
          postalCode: "94105",
        },
      },
      paymentInformation: {
        customer: {
          id: "--- replace your token ---",
        },
      },
      deviceInformation: {
        ipAddress: "127.0.0.1",
        fingerprintSessionId: "146c1699-94ac-49fd-b593-bebc18c248b8",
        httpAcceptBrowserValue: "application/json",
        httpAcceptContent: "application/json",
        httpBrowserLanguage: "en-US",
        httpBrowserJavaEnabled: "N",
        httpBrowserJavaScriptEnabled: "N",
        httpBrowserColorDepth: "24",
        httpBrowserScreenHeight: "1280",
        httpBrowserScreenWidth: "1280",
        httpBrowserTimeDifference: "330",
        userAgentBrowserValue:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36 Edg/112.0.1722.48",
      },
      buyerInformation: {
        mobilePhone: 12345678844,
      },
      consumerAuthenticationInformation: {
        referenceId: paReference,
        returnUrl: "http://localhost:3000/response",
        transactionMode: "internet",
        deviceChannel: "BROWSER",
      },
      acquirerInformation: {
        merchantId: "boa1",
      },
      recipientInformation: {
        accountId: "987654321",
        accountType: "99",
        address1: "AlpineEcoRoad",
        address2: "Address2value",
        firstName: "recFirstname",
        lastName: "resLastname",
        middleName: "recMiddletname",
        locality: "recipient_city",
        country: "GBR",
        postalCode: "571216",
        streetName: "Alpineecoroad",
        dateOfBirth: "",
        beneficiaryId: "",
        beneficiaryName: "",
        buildingNumber: "TulipAppartment",
        beneficiaryAddress: "",
      },
      senderInformation: {
        account: {
          number: "154264765376576126571652675176",
          fundsSource: "02",
        },
        firstName: "senderfirstname",
        middleName: "sendermiddlename",
        lastName: "senderLastname",
        postalCode: "654321",
        phoneNumber: "01234567892",
        address1: "Colorfulstreet123",
        locality: "Rotterdam",
        countryCode: "GBR",
        identificationNumber: "12345678910111213223",
        personalIdType: "TXIN",
        administrativeArea: "KA",
        type: "B",
        name: "ThomasSmith",
        referenceNumber: "15426476537657",
      },
      merchantInformation: {
        vatRegistrationNumber: "15426476537657",
        merchantDescriptor: {
          name: "test",
          alternateName: "",
          contact: "",
          address1: "",
          locality: "MountainView",
          country: "",
          postalCode: "94044",
          administrativeArea: "CA",
          phone: "",
          url: "",
          countryOfOrigin: "",
          storeId: "",
          storeName: "",
          customerServicePhoneNumber: "",
        },
      },
      merchantDefinedInformation: [
        {
          key: "1",
          value: "test value 1",
        },
        {
          key: "2",
          value: "test value 2",
        },
        {
          key: "3",
          value: "test value 3",
        },
      ],
    };

    var trxPayload = JSON.stringify(payloadAuth);
    console.log("Payload Check Enroll: ", payloadAuth);
    var endpoint = "/pts/v2/payments/";
    var method = "post";
    var statusCode = -1;
    var url = "https://apitest.cybersource.com" + endpoint;
    var headerParams = {};
    var contentType = "application/json;charset=utf-8";
    var acceptType = "application/hal+json;charset=utf-8";
    var request = superagent(method, url);
    var bodyParam = trxPayload;

    var signature = generateHttpSignature(endpoint, method, bodyParam);
    var date = new Date(Date.now()).toUTCString();

    var digest = digestGenerator(trxPayload);
    digest = "SHA-256=" + digest;

    headerParams["digest"] = digest;
    headerParams["v-c-merchant-id"] = credentials.merchant.merchantId;
    headerParams["date"] = date;
    headerParams["host"] = credentials.runEnvironment;
    headerParams["signature"] = signature;
    headerParams["User-Agent"] = "Mozilla/5.0";

    request.set(normalizeParams(headerParams));
    request.timeout(5000);
    request.type(contentType);
    request.send(bodyParam);
    request.accept(acceptType);
    request.end((error, response) => {
      console.log({ resComb: response.body });
      var data = response.body ? response.body : response.text;
      if (
        data === null ||
        (typeof data === "object" && !Object.keys(data).length)
      ) {
        // SuperAgent does not always produce a body; use the unparsed response as a fallback
        data = response.text;
        console.log("enroll check res: ", data);
      }

      var _status = -1;
      if (response["status"] >= 200 && response["status"] <= 299) {
        _status = 0;
      }
      res.json({
        ok: true,
        header: response.header,
        data: data,
      });
      // res.render("payment successful");
    });
  } catch (err) {
    console.log("capture err: ", err.message);
    res.status(400).json({ combinedApiErr: err.message });
  }
};
exports.retrieveTokenDetail = async (req, res, next) => {
  try {
    const { instrumentId } = req.params;
    var payloadAuth = {};
    var trxPayload = JSON.stringify(payloadAuth);
    // console.log("Payload Check Enroll: ", payloadAuth);
    var endpoint = `/tms/v1/instrumentidentifiers/${instrumentId}`;
    var method = "get";
    var statusCode = -1;
    var url = "https://apitest.cybersource.com" + endpoint;
    var headerParams = {};
    var contentType = "application/json;charset=utf-8";
    var acceptType = "application/hal+json;charset=utf-8";
    var request = superagent(method, url);
    var bodyParam = trxPayload;

    var signature = generateHttpSignature(endpoint, method, bodyParam);
    var date = new Date(Date.now()).toUTCString();

    var digest = digestGenerator(trxPayload);
    digest = "SHA-256=" + digest;

    headerParams["digest"] = digest;
    headerParams["v-c-merchant-id"] = credentials.merchant.merchantId;
    headerParams["date"] = date;
    headerParams["host"] = credentials.runEnvironment;
    headerParams["signature"] = signature;
    headerParams["User-Agent"] = "Mozilla/5.0";

    request.set(normalizeParams(headerParams));
    request.timeout(5000);
    request.type(contentType);
    request.send(bodyParam);
    request.accept(acceptType);
    request.end((error, response) => {
      console.log({ resComb: response.body });
      var data = response.body ? response.body : response.text;
      if (
        data === null ||
        (typeof data === "object" && !Object.keys(data).length)
      ) {
        // SuperAgent does not always produce a body; use the unparsed response as a fallback
        data = response.text;
        console.log("enroll check res: ", data);
      }

      var _status = -1;
      if (response["status"] >= 200 && response["status"] <= 299) {
        _status = 0;
      }
      res.json({
        ok: true,
        header: response.header,
        data: data,
      });
    });
  } catch (err) {
    console.log("retrieve token err: ", err.message);
  }
};
