import User from "../models/user.schema.js";
import asyncHandler from "../services/asyncHandler.js";
import CustomError from "../utils/customError.js";
import { mailHelper } from "../utils/mailHelper.js";
import crypto from "crypto";
import JWT from "jsonwebtoken";
import config from "../config/index.js";
import axios from "axios";
import qs from "qs";


const cookieOptions = {
    expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'none',
    secure: true
}

/***************************************************************
 * @SIGNUP
 * @REQUEST_TYPE POST
 * @route http://localhost:4000/api/user/signup
 * @description User signUp controller for creating new user
 * @parameters name, email, password
 * @returns User Object
 ***************************************************************/

// two time async will be taken as once async
export const signup = asyncHandler(async(req, res) => {
    const { name , email, password } = req.body
    if(!(name || email || password)) {
        throw new CustomError("Please fill all fields", 400)
    }

    // check if user exist
    const existingUser = await User.findOne({email})
    
    if(existingUser) {
        throw new CustomError("User already registered", 400)
    }

    const user = await User.create({
        name,
        email,
        password
    })
    const token = user.getJwtToken()

    // above since we have created and saved the user in the DB, password field is also returned in user
    // select false will only deselect on the time of query
    user.password = undefined

    res.cookie("token", token, cookieOptions)

    return res.status(200).json({
        success: true,
        message: "User created successfully",
        user
    })
})

/***************************************************************
 * @SIGNIN
 * @REQUEST_TYPE POST
 * @route http://localhost:4000/api/user/signin
 * @description User signIn controller for sign in
 * @parameters email, password
 * @returns User Object
 ***************************************************************/

export const signin = asyncHandler(async (req, res) => {
    const { email, password } = req.body
    if(!(email || password)) {
        throw new CustomError("Fill all the fields", 400)
       }

    const user = await User.findOne({email}).select("+password")

    if(!user) {
        throw new CustomError("Invalid credentials", 400)
    }

    const isPasswordMatched = await user.comparePassword(password)
    if(isPasswordMatched) {
        const token = user.getJwtToken()

        res.cookie("token", token, cookieOptions)
        
        // remove the password before sending the user to frontend
        user.password = undefined;
        return res.status(200).json({
            success: true,
            message: "Signin successfully",
            user
        })
    }
    throw new CustomError("Invalid credentials", 400)
})

/***************************************************************
 * @SIGNOUT
 * @REQUEST_TYPE GET
 * @route http://localhost:4000/api/user/signout
 * @description User will signout
 * @returns User Object
 ***************************************************************/

export const signout = asyncHandler(async(req, res) => {
    res.cookie("token", null,{
        expires: new Date(Date.now()),
        httpOnly: true
    })


    return res.status(200).json({
        success: true,
        message: "user successfully signout"
    })
})

/***************************************************************
 * @FORGOT_PASSWORD
 * @REQUEST_TYPE POST
 * @route http://localhost:4000/api/auth/password/forgot
 * @description User will submit an email and we will generate a token
 * @returns success message - send email
 ***************************************************************/

export const forgetPassword = asyncHandler(async(req, res) => {
    const {email} = req.body
    if(!email){
        throw new CustomError("Enter the email", 404)
    }

    const user = await User.findOne({email})
    if(!user) {
        throw new CustomError("User not found", 404)
    }
    // in this method we are saving token and expiry in the DB
    const resetToken = user.generateForgotPasswordToken()
    // validateBeforeSave is set to false - it will bypass all the validation
    await user.save({validateBeforeSave: false})

    console.log(req.protocol)
    console.log(req.get("X-Forwarded-Host"))
    const resetUrl = `${req.headers.origin}/resetPassword/${resetToken}`
    console.log(resetToken)
    const text = `Click on the link to reset the password - \n\n${resetUrl}\n\n`

    try {
        await mailHelper({
            email: user.email,
            subject: "Click on the link to reset the password",
            text
        })
        res.status(200).json({
            success: true,
            message: `Email sent to ${user.email}`
        })
    } catch (error) {
        // clearing the fields 
        forgotPasswordToken = undefined
        forgotPasswordExpiry = undefined

        await user.save({validateBeforeSave: false})
        throw new CustomError(error.message || "Failure in sending email")
    }
    
})

/***************************************************************
 * @RESET_PASSWORD
 * @REQUEST_TYPE POST
 * @route http://localhost:4000/api/auth/password/reset/:resetToken
 * @description User will be able to reset the password
 * @parametere token from url, 
 * @returns user
 ***************************************************************/

export const resetPassword = asyncHandler(async (req, res) => {
    const {token: resetToken } = req.params
    const {password, confirmPassword} = req.body
    const forgotPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')

    const user = await User.findOne({
        forgotPasswordToken,
        forgotPasswordExpiry: {$gt: Date.now()}
    }).select("+password")

    if(!user) {
        throw new CustomError("Invalid token or too late", 400)
    }

    if(password !== confirmPassword) {
        throw new CustomError("Password and confirm password do not match", 400)
    }

    user.password = password
    user.forgotPasswordToken = undefined
    user.forgotPasswordExpiry = undefined

    const token = user.getJwtToken()
    await user.save()

    user.password = undefined

    res.cookie("token", token, cookieOptions)
    res.status(200).json({
        success: true,
        message: "Password reset successfully",
        user
    })
})

/***************************************************************
 * @CHANGE_PASSWORD
 * @REQUEST_TYPE POST
 * @route http://localhost:4000/api/auth/password/change
 * @description User will be able to change the password by providing the old password
 * @returns success - user
 ***************************************************************/

export const changePassword = asyncHandler(async (req, res) => {
    const { password, confirmPassword } = req.body
    const user = req.user
    
    if(password !== confirmPassword) {
        throw new CustomError(" Entered password do not match", 400)
    }
    user.password = password
    await user.save()

    res.status(200).json({
        success: true,
        message: "password changed successfully",
        user
    })
})

/***************************************************************
 * @GET_PROFILE
 * @REQUEST_TYPE GET
 * @route http://localhost:4000/api/auth/profile
 * @description check for token and populate req.user
 * @returns success - user
 ***************************************************************/

export const getProfile = asyncHandler(async (req, res) => {
    
    res.status(200).json({
        success: true,
        user:req.user
    })
})


/***************************************************************
 * @UPDATE_PROFILE
 * @REQUEST_TYPE PATCH
 * @route http://localhost:4000/api/user/profile/update
 * @description check for token and populate req.user
 * @description save the updated value in the db
 * @returns success - user
 ***************************************************************/

export const updateProfile = asyncHandler(async (req, res) => {
    const { property, value } = req.body

    if(!property || !value) {
        throw new CustomError("this fields are required", 400)
    }

    const user = await User.findById(req.user._id)

    if(!user) {
        throw new CustomError("user not found in DB", 404)
    }
    
    if(property !== "name" && property !== "email") {
        throw new CustomError("Only email and name can be modified", 403)
    }

    if(property === "name") {
        user.name = value
    }
    if(property === "email" && value.includes('@')) {
        user.email = value
    }
    await user.save()
    res.status(200).json({
        success: true,
        user
    })
})

/***************************************************************
 * @GET_USER_BY_ID
 * @REQUEST_TYPE GET
 * @route http://localhost:4000/api/user/:id
 * @description get the user from db and send it
 * @returns success - user
 ***************************************************************/

export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params

    const user = await User.findById(id)

    if(!user) {
        throw new CustomError("user not found in DB", 404)
    }

    res.status(200).json({
        success: true,
        user
    })
})

/***************************************************************
 * @GET_ALL_USERS
 * @REQUEST_TYPE GET
 * @route http://localhost:4000/api/user/:id
 * @description get the userS from db and send it
 * @description Only admin can access this route
 * @returns success - user
 ***************************************************************/

 export const getAllUsers = asyncHandler(async (req, res) => {
    if(!(req.user.role === "ADMIN")) {
        throw new CustomError("Protected route, only admin can access this route", 401)
    }

    const users = await User.find()

    if(!users.length) {
        throw new CustomError("users not found in DB", 404)
    }

    res.status(200).json({
        success: true,
        users
    })
})

/***************************************************************
 * @DELETE_USER
 * @REQUEST_TYPE DELETE
 * @route http://localhost:4000/api/user/:id
 * @description get the user from db and send it
 * @returns success - user
 ***************************************************************/

 export const deleteUser = asyncHandler(async (req, res) => {
    const {id} = req.params

    // preventing the deletion of admin by itself
    if(id == req.user._id) {
        throw new CustomError("Same user cannot remove itself", 401)
    }
  

    const user = await User.findByIdAndDelete(id)


    res.status(200).json({
        success: true,
        user
    })
})

/***************************************************************
 * @EDIT_USER_ADMIN
 * @REQUEST_TYPE PUT
 * @route http://localhost:4000/api/user/:id
 * @description get the user from db and send it
 * @returns success - user
 ***************************************************************/

 export const updateProfileByAdmin = asyncHandler(async (req, res) => {
     console.log(req.user)
    const {id} = req.params
    const {name, email, role} = req.body


    if((id == req.user._id) && (role === "USER")) {
        throw new CustomError("Admin cannot make itself to USER", 401)
    }
  

    const user = await User.findByIdAndUpdate(id, {
        name,
        email,
        role
    }, {new: true})

    if(!user) {
        throw new CustomError("Failed to update the user")
    }
    res.status(200).json({
        success: true,
        user
    })
})

/***************************************************************
 * @SEND_TO_GOOGLE_CONSENT_SCREEN
 * @REQUEST_TYPE PUT
 * @route http://localhost:4000/api/user/:id
 * @description get the user from db and send it
 * @returns success - user
 ***************************************************************/

export const getGoogleOauthUrl = asyncHandler((req, res) => {
    const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";

    const options = {
        redirect_uri: "https://iwebtrends.com/api/google/callback",
        client_id: process.env.GOOGLE_CLIENT_ID,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" ")
    }

    const qs = new URLSearchParams(options)

    const Oauthurl =  `${baseUrl}?${qs.toString()}`;

    return res.status(200).json({
        success: true,
        Oauthurl
    })

})

export const getCode = asyncHandler(async (req, res) => {
    const code = req.query.code;
    //  exchange the code with acess token and acess id

    const url = "https://oauth2.googleapis.com/token";

    const values = {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "https://iwebtrends.com/api/google/callback",
        grant_type: "authorization_code"
    }

    const resp = await axios.post(url, qs.stringify(values),
    {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        }
    })

    const {id_token, access_token} = resp.data;


    const decode = JWT.decode(id_token)

    if(decode.email) {
        // qwery the user
        const existingUser = await User.findOne({socialId: decode.sub})
        if(existingUser) {
        const token = JWT.sign({_id: existingUser._id}, config.JWT_SECRET, {expiresIn: config.JWT_EXPIRY})
        res.cookie("token", token, cookieOptions)

        res.redirect("https://phonezone.vercel.app")
        } else {
            const newUser = new User({
                name: decode.name,
                email: decode.email,
                source: "google",
                socialId: decode.sub
            })

            const savedUser = await newUser.save({validateBeforeSave: false})

            if(savedUser) {
                const token = JWT.sign({_id: newUser._id}, config.JWT_SECRET, {expiresIn: config.JWT_EXPIRY})
                res.cookie("token", token, cookieOptions)

                res.redirect("https://phonezone.vercel.app")
                
            }
        }
    }
})


export const sendGoogleUser = asyncHandler(async(req, res) => {
    if(req.user) {
        res.status(200).json({
            success: true,
            user: req.user
        })
    }
    throw new CustomError("Protected Route")
    
})
