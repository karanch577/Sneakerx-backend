import mongoose from "mongoose";
import productSizes from "../utils/productSizes.js";

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            trim: true,
            required: [true, "Name is required"],
            maxLength: [250, "maxlength is 120 character"]
        },
        price: {
            type: String,
            required: [true, "Price is required"],
            maxLength: [8, "maxlength is 120 character"]
        },
        sellingPrice: {
            type: String,
            required: [true, "Selling price is required"],
            maxLength: [8, "maxlength is 120 character"]
        },
        description: {
            type: String,
            trim: true
        },
        colourShown: {
            type: String,
            trim: true
        },
        style: {
            type: String,
            trim: true
        },
        sizes: {
            type: [{
                size: {
                    type: String,
                    enum: productSizes,
                    required: true
                },
                quantity: {
                    type: String,
                    required: true,
                    default: 0
                }
            }],
            required: true,
        },
        photos: [{
            secure_url: {
                type: String,
                required: true
            }
        }],
        sold: {
            type: Number,
            default: 0
        },
        collectionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Collection",
            required: true
        }
    },{
        timestamps: true
    }
)

export default mongoose.model("Product", productSchema)