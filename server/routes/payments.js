const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const axios = require("axios");

const BREVO_KEY = process.env.BREVO_API_KEY || "";
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_SENDER_EMAIL = "cosen.hub@gmail.com";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

router.post("/create-order", async (req, res) => {
  try {
    const { amount, currency = "INR", receipt = "receipt#1" } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const options = {
      amount: amount * 100, // amount in smallest currency unit (paise)
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (err) {
    console.error("[Razorpay Create Order Error]", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

  router.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, user, plan } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Payment verified successfully
      
      // Send Congratulations Email
      if (user && user.email) {
        try {
          const payload = {
            sender: { name: "Lead Finder PRO", email: BREVO_SENDER_EMAIL },
            to: [{ email: user.email, name: user.name }],
            subject: "🎉 Welcome to Lead Finder PRO - Payment Successful!",
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #f97316;">Payment Successful!</h2>
                <p>Hi ${user.name || 'there'},</p>
                <p>Congratulations! Your payment for the <strong>${plan?.name || 'Pro'} Plan</strong> (${plan?.billing || 'Monthly'}) was successful.</p>
                <p>You can now log in to your dashboard and start finding high-ticket clients on autopilot with your new upgraded limits.</p>
                <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>Order ID:</strong> ${razorpay_order_id}</p>
                  <p style="margin: 5px 0 0 0;"><strong>Payment ID:</strong> ${razorpay_payment_id}</p>
                </div>
                <p>If you have any questions, feel free to reply to this email.</p>
                <p>Best,<br>The Lead Finder PRO Team</p>
              </div>
            `,
          };
          await axios.post(BREVO_API_URL, payload, {
            headers: { "api-key": BREVO_KEY, "Content-Type": "application/json" },
          });
          console.log(`[payments] Congratulations email sent to ${user.email}`);
        } catch (emailErr) {
          console.error("[payments] Failed to send congratulations email:", emailErr?.response?.data || emailErr.message);
        }
      }

      res.json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, error: "Invalid signature" });
    }
  } catch (err) {
    console.error("[Razorpay Verify Error]", err);
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

module.exports = router;
