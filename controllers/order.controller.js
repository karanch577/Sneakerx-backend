import config from "../config/index.js";
import instance from "../config/razorpay.config.js";
import Coupon from "../models/coupon.schema.js";
import Product from "../models/product.schema.js";
import Order from "../models/order.schema.js";
import asyncHandler from "../services/asyncHandler.js";
import CustomError from "../utils/customError.js";
import crypto from "crypto";
import paymentStatus from "../utils/paymentStatus.js";
import orderStatus from "../utils/orderStatus.js";


/**********************************************************
 * @GENEARATE_RAZORPAY_ID
 * @route https://localhost:5000/api/order/razorpay
 * @description Controller used for genrating razorpay Id
 * @description Creates a Razorpay Id which is used for placing order
 * @returns Order Object with "Razorpay order id generated successfully"
 *********************************************************/

export const generateRazorpayOrderId = asyncHandler(async (req, res) => {
    // frontend will send an array of products

    const { products, phoneNumber, address, coupon } = req.body
    const user = req.user._id

    if(!products ||
        !user ||
        !phoneNumber ||
        !address) {
            throw new CustomError("These fields are mandatory for placing order", 400)
        }
    
    let totalAmount = 0
    let discount = 0
    let activeCoupon = ""

    // verify products from backend and
    // calculating the total amount

    for(const item of products){
        try {
            const product = await Product.findById(item.productId)
            totalAmount = totalAmount + Number(product.sellingPrice) * item.count
        } catch (error) {
            throw new CustomError("Ordered product not found in DB", 400)
        }
    }

        
    // check if any coupon is used
    if(coupon) {
    const usedCoupon = await Coupon.findById(coupon._id)
    
    // check if the coupon is active
    
    if(usedCoupon.active) {
        activeCoupon = usedCoupon
        discount = totalAmount * (usedCoupon.discount / 100)
    }
}

// calculate the finalAmount after discount
let finalAmount = totalAmount - discount
    

    const options = {
        amount: Math.round(finalAmount) * 100,
        currency: "INR",
        receipt: `receipt_${new Date().getTime()}`
    }

    const order = await instance.orders.create(options)

    // if the res is not returned payment is failed
    if(!order) {
        throw new CustomError("failed creating order id", 400)
    }

    const userOrder = await Order.create({
        products,
        phoneNumber,
        user:req.user._id,
        address,
        coupon: activeCoupon.code,
        amount: finalAmount
    })

    if(!userOrder) {
        throw new CustomError("failed storing the order in db", 400)
    }
    res.status(200).json({
        success: true,
        order,
        userOrderId: userOrder._id
    })
})

/**********************************************************
 * @SEND_RAZORPAY_KEY
 * @route https://localhost:5000/api/order/getkey
 * @description Controller used to send razorpay key to frontend
 * @returns Object with "Razorpay key"
 *********************************************************/

export const getKey = asyncHandler(async (_req, res) => {
    res.status(200).json({
        success: true,
        key: config.RAZORPAY_KEY
    })
})

/**********************************************************
 * @RAZORPAY_PAYMENT_VERIFY
 * @route https://localhost:5000/api/order/paymentverification
 * @description Controller used for verifying the razorpay's payment
 * @description update the transaction id and the status in db
 * @returns Object with "Razorpay key"
 *********************************************************/

export const paymentVerification = asyncHandler(async (req, res) => {
    const {razorpay_order_id, razorpay_payment_id, razorpay_signature, userOrderId} = req.body
    const body=razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto.createHmac('sha256', config.RAZORPAY_SECRET)
    .update(body.toString())
.digest('hex');

    const isVerified = expectedSignature === razorpay_signature

    const userOrder = await Order.findById(userOrderId)
  if(isVerified){
    const products = userOrder.products
    userOrder.transactionId = razorpay_payment_id
    userOrder.status = orderStatus.ORDERED
    userOrder.transactionStatus = paymentStatus.SUCCESS
    await userOrder.save()

    // updating the stock
    for (const item of products) {
        const product = await Product.findById(item.productId)

        product.sizes = product.sizes.map(el => {
            if(el.size === item.size) {
                el.quantity = el.quantity - item.count
            }
            return el;
        })

        product.sold = product.sold + Number(item.count)

        await product.save()
    }
    res.status(200).json({
        success: true,
        message: "payment successful",
        paymentId: razorpay_payment_id
    })
  } else {
    userOrder.transactionStatus = paymentStatus.FAILED
    res.status(400).json({
        success: false,
        message: "Payment not verified"
    })
  } 
})

/**********************************************************
 * @SEND_USER_ORDERS
 * @route https://localhost:5000/api/order/user
 * @description Controller used getting all the orders of the user
 * @returns Object with an array of all the orders of the user
 *********************************************************/

export const getOrders = asyncHandler(async (req, res) => {
    const userId = req.user._id
    if(!userId) {
        throw new CustomError("Please send the userId", 400)
    }
    const orders = await Order.find({user: userId}).sort({createdAt: "desc"})
    if(!orders.length) {
        res.status(404).json({
            success: false,
            message: "No order found in DB"
        })
    }

    res.status(200).json({
        success: true,
        message: "order found in db",
        orders
    })
})

/**********************************************************
 * @CANCEL_USER_ORDER
 * @route https://localhost:5000/api/order/user
 * @description Controller used to cancel the user's order
 * @returns Object with the cancelled order
 *********************************************************/

export const cancelOrder = asyncHandler(async (req, res) => {
    const {orderId} = req.params
    if(!orderId) {
        throw new CustomError("Please send the orderId", 400)
    }
    const order = await Order.findById(orderId)
    if(!order) {
        return res.status(404).json({
            success: false,
            message: "No order found in DB"
        })
    }
    order.status = orderStatus.CANCELLED
    await order.save()

    res.status(200).json({
        success: true,
        message: "order cancelled"
    })
})

/**********************************************************
 * @SEND_ORDER_STATUS
 * @route https://localhost:5000/api/order/status
 * @description Controller used to get the status of all orders
 * @returns Object with the order's status
 *********************************************************/

export const getOrdersStatus = asyncHandler(async (req, res) => {
    const { s } = req.query
    if(!s) {
        throw new CustomError("Query string not found", 400)
    }
    const orderCount = await Order.countDocuments({status: s})
   
    res.status(200).json({
        success: true,
        status : s,
        count: orderCount
    })
})

/**********************************************************
 * @SEND_ALL_ORDERS
 * @route https://localhost:5000/api/order/status
 * @description Controller used to get the status of all orders
 * @returns Object with the order's status
 *********************************************************/

 export const getAllOrders = asyncHandler(async (_req, res) => {

   const orders = await Order.find().sort({createdAt: "desc"}).populate("user", "name")
    if(!orders) {
        throw new CustomError("No orders found", 400)
    }
   
    res.status(200).json({
        success: true,
        orders
    })
})

/**********************************************************
 * @SEND_ORDER
 * @route https://localhost:5000/api/order/
 * @description Controller used to get a single order
 * @returns Object with the order's status
 *********************************************************/

export const getOrder = asyncHandler(async (req, res) => {
    const {id} = req.params

    const order = await Order.findById(id).populate("user", "name")

    if(!order) {
        throw new CustomError("No order found", 404)
    }

    res.status(200).json({
        success: true,
        order
    })
})

/**********************************************************
 * @EDIT_ORDER
 * @route https://localhost:5000/api/order/edit/:id
 * @description Controller used to edit order
 * @returns Object with updated order
 *********************************************************/

export const editOrder = asyncHandler(async (req, res) => {
    const {id} = req.params
    const {address, phoneNumber, status} = req.body

    const order = await Order.findById(id)

    if(!order) {
        throw new CustomError("No order found", 404)
    }

    address ? order.address = address : ""
    phoneNumber ? order.phoneNumber = phoneNumber : ""
    status ? order.status = status : ""

    await order.save()

    res.status(200).json({
        success: true,
        order
    })
})