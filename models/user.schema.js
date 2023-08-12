import config from "../config/index.js";
import mongoose from "mongoose";
import authRoles from "../utils/authRoles.js";
import bcrypt from "bcryptjs";
import JWT from "jsonwebtoken";
import crypto from "crypto";
import userSource from "../utils/userSource.js";


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide the name"],
        maxLength: [50, "Name must be less than 50"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: true
    },
    password: {
        type: String,
        required: [true, "password is required"],
        minLength: [6, "Password must be atleast 6 char long"],
        select: false
    },
    source: {
        type: String,
        enum: Object.values(userSource),
        default: userSource.direct
    },
    socialId: {
        type: String,
    },
    role: {
        type: String,
        enum: Object.values(authRoles),
        default: authRoles.USER
    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date
},{
    timestamps: true
})

// pre hook - mongoose middleware

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next();
})

// add methods to schema directly

userSchema.methods = {
    // compare password
    comparePassword: async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password)
    },
    
    getJwtToken: function() {
        return JWT.sign({
            _id: this._id,
            role: this.role,
        },
        config.JWT_SECRET,
        {
            expiresIn: config.JWT_EXPIRY
        }
        )
    },

    generateForgotPasswordToken: function() {
        const token = crypto.randomBytes(20).toString('hex')
        this.forgotPasswordToken = crypto.createHash("sha256").update(token).digest('hex')
        this.forgotPasswordExpiry = Date.now() + 20 * 60 * 1000

        return token
    }
}

export default mongoose.model("User", userSchema)