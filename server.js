const compression = require("compression");
const express = require("express");
require("dotenv").config();
const path = require("path");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 3000;

app.use(compression());
app.use(express.static(path.join(__dirname, "build")));

const client = new twilio(
  process.env.REACT_APP_TWILIO_ACCOUNT_SID,
  process.env.REACT_APP_TWILIO_AUTH_TOKEN
);

app.post("/send-sms", async (req, res) => {
  console.dir(req);
  const { subject, message } = req.body;
  console.log(subject);

  try {
    const sms = await client.messages.create({
      body: `Subject: ${subject}\nMessage: ${message}`, // 件名とメッセージ本文を組み合わせ
      from: process.env.REACT_APP_TWILIO_PHONE_NUMBER_FROM, // Twilioから購入した電話番号
      to: process.env.REACT_APP_TWILIO_PHONE_NUMBER_TO, // SMSを受信する電話番号
    });

    console.log(sms.sid);
    res.status(200).send("SMS送信成功");
  } catch (error) {
    console.error(error);
    res.status(500).send("SMS送信失敗");
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "build", "index.html"));
});

app.listen(PORT);
console.log("Node server is now running on: http://localhost:" + PORT);
