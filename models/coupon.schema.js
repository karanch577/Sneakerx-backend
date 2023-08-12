import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, 'Coupon is required'],
            unique: true
        },
        discount: {
            type: Number,
            required: true
        },
        active: {
            type: Boolean,
            default: true
        }
    },{
        timestamps: true
    }
)

export default mongoose.model("Coupon", couponSchema)