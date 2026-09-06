/* =========================================================
   TOYNEXX PAYMENT BACKEND

   BUG FIX: the original server.js could only CREATE a
   Razorpay order — it had no way to check whether a payment
   that came back from the browser was genuine. That meant
   the checkout page had to just trust the browser's word
   that "payment succeeded", which anyone could fake from the
   browser console. This version adds the missing
   /verify-payment route that checks Razorpay's signature
   using your secret key.
   ========================================================= */

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const Razorpay = require("razorpay");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.get("/", (req, res) => {
    res.send("TOYNEXX Payment Server is running!");
});

/* ---------------------------------------------------------
   CREATE ORDER
   Body: { amount: <rupees> }
   --------------------------------------------------------- */

app.post("/create-order", async (req, res) => {

    try {

        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `toynexx_${Date.now()}`
        });

        res.json({
            success: true,
            order
        });

    } catch (error) {

        console.error("Razorpay Error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create Razorpay order"
        });

    }

});

/* ---------------------------------------------------------
   VERIFY PAYMENT  (NEW)

   Body: {
     razorpay_order_id,
     razorpay_payment_id,
     razorpay_signature
   }

   Razorpay signs every successful payment using your secret
   key. We recompute that same signature here and compare it.
   If it matches, the payment is real. If it doesn't, someone
   is trying to fake a successful order.
   --------------------------------------------------------- */

app.post("/verify-payment", (req, res) => {

    try {

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Missing payment details."
            });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        const isValid = expectedSignature === razorpay_signature;

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed."
            });
        }

        // Payment is genuinely confirmed here.
        // This is where you'd save the order to a database,
        // send a confirmation email, and reduce stock.

        res.json({
            success: true,
            message: "Payment verified."
        });

    } catch (error) {

        console.error("verify-payment error:", error);

        res.status(500).json({
            success: false,
            message: "Server error while verifying payment."
        });

    }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `TOYNEXX server running on http://localhost:${PORT}`
    );

});
