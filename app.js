const express = require('express');
const path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
const cors = require('cors');
var MyInfoConnector = require("myinfo-connector-v4-nodejs");
const config = require('./config/config.js');
const connector = new MyInfoConnector(config.MYINFO_CONNECTOR_CONFIG);
const crypto = require("crypto");
var sessionIdCache = {};

const PORT = 3001;

const app = express();

app.use(express.json());
app.use(cors());

app.set('views', path.join(__dirname, 'front'));
app.set('view engine', 'pug');

app.use(express.static(path.resolve(__dirname, 'front')));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());

app.get('/callback', function (req, res) {
    res.sendFile(__dirname + '/front/index.html');
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + 'front/index.html');
});

app.get("/getEnv", function (req, res) {
    try {
      if (
        config.APP_CONFIG.DEMO_APP_CLIENT_ID == undefined ||
        config.APP_CONFIG.DEMO_APP_CLIENT_ID == null
      ) {
        res.status(500).send({
          error: "Missing Client ID",
        });
      } else {
        res.status(200).send({
          clientId: config.APP_CONFIG.DEMO_APP_CLIENT_ID,
          redirectUrl: config.APP_CONFIG.DEMO_APP_CALLBACK_URL,
          scope: config.APP_CONFIG.DEMO_APP_SCOPES,
          purpose_id: config.APP_CONFIG.DEMO_APP_PURPOSE_ID,
          authApiUrl: config.APP_CONFIG.MYINFO_API_AUTHORIZE,
          subentity: config.APP_CONFIG.DEMO_APP_SUBENTITY_ID,
        });
      }
    } catch (error) {
      console.log("Error".red, error);
      res.status(500).send({
        error: error,
      });
    }
  });

  app.post("/generateCodeChallenge", async function (req, res, next) {
    try {
      // call connector to generate code_challenge and code_verifier
      let pkceCodePair = connector.generatePKCECodePair();
      // create a session and store code_challenge and code_verifier pair
      let sessionId = crypto.randomBytes(16).toString("hex");
      sessionIdCache[sessionId] = pkceCodePair.codeVerifier;
  
      //establish a frontend session with browser to retrieve back code_verifier
      res.cookie("sid", sessionId);
      //send code code_challenge to frontend to make /authorize call
      res.status(200).send(pkceCodePair.codeChallenge);
    } catch (error) {
      console.log("Error".red, error);
      res.status(500).send({
        error: error,
      });
    }
  });

  app.get("/callback", function (req, res) {
    res.sendFile(__dirname + `/public/index.html`);
  });

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
})