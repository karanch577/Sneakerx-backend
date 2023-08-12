import mongoose from "mongoose";
import orderStatus from "../utils/orderStatus.js";
import paymentStatus from "../utils/paymentStatus.js";


const orderSchema = mongoose.Schema(
    {
        products: {
            type: [
                {
                    productId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "Product",
                        required: true
                    },
                    count: Number,
                    size: String,
                    price: String
                }
            ],
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        coupon: String,
        transactionId: String,
        transactionStatus: {
            type: String,
            required: true,
            enum: Object.values(paymentStatus),
            default: paymentStatus.PENDING
        },
        status: {
            type: String,
            enum: Object.values(orderStatus),
            default: orderStatus.PENDING
        }
    },
    {
        timestamps: true
    }
)

export default mongoose.model("Order", orderSchema)