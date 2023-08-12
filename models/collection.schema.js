import mongoose from "mongoose";


const collectionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Name of the category is required"],
        unique: true,
        trim: true,
        maxLength: [50, "maxlength of category is 50"]
    }
},{timestamps: true})

export default mongoose.model("Collection", collectionSchema)