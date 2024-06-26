import express from "express";
import {
  generateRazorpayOrderId,
  getKey,
  paymentVerification,
  getOrders,
  cancelOrder,
  getOrdersStatus,
  getAllOrders,
  getOrder,
  editOrder,
  deleteOrder,
  getTotalSales,
} from "../controllers/order.controller.js";

import { isLoggedIn, verifyPermission } from "../middlewares/auth.middleware.js";
import authRoles from "../utils/authRoles.js";

const router = express.Router();


router.get("/getkey",isLoggedIn, getKey)
router.post("/checkout",isLoggedIn, generateRazorpayOrderId)
router.post("/paymentverification",isLoggedIn, paymentVerification)
router.get("/user/all",isLoggedIn, getOrders)
router.delete("/:orderId",isLoggedIn, verifyPermission([authRoles.ADMIN]), deleteOrder)
router.delete("/cancel/:orderId",isLoggedIn, cancelOrder)
router.get("/status",isLoggedIn, getOrdersStatus)
router.get("/all",isLoggedIn, getAllOrders)
router.get("/id/:id",isLoggedIn, verifyPermission([authRoles.ADMIN]), getOrder)
router.patch("/update/:id",isLoggedIn, verifyPermission([authRoles.ADMIN]),editOrder)
router.get("/total-sales", isLoggedIn, verifyPermission([authRoles.ADMIN]), getTotalSales)


export default router;