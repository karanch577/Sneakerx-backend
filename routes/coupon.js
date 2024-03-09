import express from "express";
import {
  createCoupon,
  getAllCoupons,
  deleteCoupon,
  getAllActiveCoupons,
  getCouponById,
  updateCoupon,
} from "../controllers/coupons.controller.js";
import { isLoggedIn, verifyPermission } from "../middlewares/auth.middleware.js";
import authRoles from "../utils/authRoles.js";

const router = express.Router();

// Rest of your code...


router.post("/create",isLoggedIn, verifyPermission([authRoles.ADMIN]), createCoupon)
router.get("/all", getAllCoupons)
router.delete("/:id",isLoggedIn, verifyPermission([authRoles.ADMIN]), deleteCoupon)
router.get("/active", getAllActiveCoupons)
router.put("/update/:id", isLoggedIn, verifyPermission([authRoles.ADMIN]), updateCoupon)

router.get("/:id", getCouponById)

export default router;