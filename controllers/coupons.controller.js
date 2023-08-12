import Coupon from "../models/coupon.schema.js";
import asyncHandler from "../services/asyncHandler.js";
import CustomError from "../utils/customError.js";



/**********************************************************
 * @CREATE_COUPON
 * @route https://localhost:5000/api/coupon/create
 * @description Controller used for creating a new coupon
 * @description Only admin and Moderator can create the coupon
 * @returns Coupon Object with success message "Coupon Created SuccessFully"
 *********************************************************/

export const createCoupon = asyncHandler(async (req, res) => {
    const { name, discount } = req.body

    if(!name || !discount) {
        throw new CustomError("Required field", 400)
    }

    // check if the discount is greater than 100%

    if(discount < 0 && discount > 100) {
        throw new CustomError("Discount cannot be more than 100%", 400)
    }
    const coupon = await Coupon.create({
        code : name.toUpperCase(),
        discount,
    })

    if(!coupon) {
        throw new CustomError("failed creating the coupon", 400)
    }

    return res.status(200).json({
        status: true,
        coupon
    })
})

/**********************************************************
 * @UPDATE_COUPON
 * @route https://localhost:5000/api/coupon/update/:couponId
 * @description Controller used for updating the coupon
 * @description Only admin can update the coupon
 * @returns Coupon Object with success message "Coupon updated SuccessFully"
 *********************************************************/

export const updateCoupon = asyncHandler(async (req, res) => {
    const {id} = req.params
    let {property, value} = req.body

    // if the property is status change it to active

    if(property === "status") {
        property = "active"
        value = Boolean(value)
    } else if(property === "discount") {
        value = Number(value)
    } else if(property === "name") {
        property = "code"
        value = value.toUpperCase()
    }
    
    if(!id) {
        throw new CustomError("id is required", 400)
    }

    if(!property && !value) {
        throw new CustomError("property and value is required", 400)
    }

    const coupon = await Coupon.findById(id)

    if(!coupon) {
        throw new CustomError("Coupon not found in db", 404)
    }

    coupon[property] = value    

    await coupon.save()

    return res.status(200).json({
        success: true,
        coupon
    })
})

/**********************************************************
 * @DELETE_COUPON
 * @route https://localhost:5000/api/coupon/:couponId
 * @description Controller used for deleting the coupon
 * @description Only admin and Moderator can delete the coupon
 * @returns Success Message "Coupon Deleted SuccessFully"
 *********************************************************/

export const deleteCoupon = asyncHandler(async (req, res) => {
    const { id } = req.params
    
    if(!id) {
        throw new CustomError("code is required", 400)
    }

    const response = await Coupon.findByIdAndDelete(id)
   
    if(response) {
        res.status(200).json({
            success: true,
            message: "coupon deleted successfully"
        })
    }else {
        res.status(400).json({
            success: false,
            message: "Error in deleting the coupon"
        })
    }
})

/**********************************************************
 * @GET_ALL_COUPONS
 * @route https://localhost:5000/api/coupon
 * @description Controller used for getting all coupons details
 * @description Only admin and Moderator can get all the coupons
 * @returns allCoupons Object
 *********************************************************/

export const getAllCoupons = asyncHandler(async (req, res) => {

    const coupons = await Coupon.find()
    if(coupons.length == 0) {
        throw new CustomError("No coupon found in db", 400)
    }

    return res.status(200).json({
        success: true,
        coupons
    })
})

/**********************************************************
 * @GET_ALL_ACTIVE_COUPONS
 * @route https://localhost:5000/api/coupon
 * @description Controller used for getting all active coupons
 * @returns allActiveCoupons Object
 *********************************************************/

export const getAllActiveCoupons = asyncHandler(async (req, res) => {
    const coupons = await Coupon.find({active: true})
    if(coupons.length == 0) {
        throw new CustomError("No coupon found in db", 400)
    }

    return res.status(200).json({
        success: true,
        coupons
    })
})

/**********************************************************
 * @GET_COUPON_BY_ID
 * @route https://localhost:5000/api/coupon/:id
 * @description Controller used for getting a coupon using id
 * @returns the required coupon object
 *********************************************************/

export const getCouponById = asyncHandler(async (req, res) => {
    const {id} = req.params

    if(!id) {
        throw new CustomError("id is required", 404)
    }

    const coupon = await Coupon.findById(id)

    if(!coupon) {
        throw new CustomError("Coupon not found in DB", 404)
    }

    return res.status(200).json({
        success: true,
        coupon
    })
})