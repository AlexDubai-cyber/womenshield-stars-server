
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const TELEGRAM_BOT_TOKEN = "7661051838:AAE8hN7dJ-7ND6gaDyU67B2UmsYtyoYfCoE";
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const app = express();
app.use(bodyParser.json());

app.post("/webhook", async (req, res) => {
  const update = req.body;

  // Команда старта покупки
  if (update.message?.text?.startsWith("/start buy_")) {
    const guideKey = update.message.text.split(" ")[0].replace("/start buy_", "");
    const userId = update.message.from.id;

    const prices = {
      guide1: 5000,  // 50 stars
      guide2: 7500,  // 75 stars
      guide3: 10000  // 100 stars
    };

    await axios.post(`${TELEGRAM_API}/sendInvoice`, {
      chat_id: userId,
      title: "Доступ к PDF-гайду",
      description: "Гайд разблокируется после оплаты",
      payload: guideKey,
      provider_token: "",  // Telegram Stars не требует token
      currency: "XTR",
      prices: [{ label: "Гайд", amount: prices[guideKey] || 5000 }],
      start_parameter: "buy_" + guideKey
    });
  }

  // Подтверждение оплаты Stars
  if (update.pre_checkout_query) {
    await axios.post(`${TELEGRAM_API}/answerPreCheckoutQuery`, {
      pre_checkout_query_id: update.pre_checkout_query.id,
      ok: true
    });
  }

  // После успешной оплаты — отправляем PDF
  if (update.message?.successful_payment) {
    const guideKey = update.message.successful_payment.invoice_payload;
    const userId = update.message.chat.id;

    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: userId,
      text: `✅ Оплата за ${guideKey} прошла! Вот твой гайд:`,
      reply_markup: {
        inline_keyboard: [[
          { text: "📘 Открыть PDF", url: `https://yourdomain.com/guides/${guideKey}.pdf` }
        ]]
      }
    });
  }

  res.sendStatus(200);
});

app.listen(3000, () => {
  console.log("Womenshield Stars Server is running on port 3000");
});
