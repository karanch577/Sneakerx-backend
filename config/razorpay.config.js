import Razorpay from "razorpay";
import config from "./index.js";

const instance = new Razorpay({
    key_id: config.RAZORPAY_KEY,
    key_secret: config.RAZORPAY_SECRET
  });

export default instance;