import express from "express";
const router = express.Router();

import {
  signup,
  signin,
  getProfile,
  signout,
  forgetPassword,
  resetPassword,
  updateProfile,
  getUserById,
  getAllUsers,
  deleteUser,
  updateProfileByAdmin,
  changePassword,
} from "../controllers/auth.controller.js";

import { isLoggedIn, verifyPermission } from "../middlewares/auth.middleware.js";
import authRoles from "../utils/authRoles.js";


router.post("/signup", signup)
router.post("/signin", signin)
router.get("/signout", signout)
router.get("/all", isLoggedIn, getAllUsers)
router.get("/getprofile", isLoggedIn, getProfile)
router.patch("/update/:id", isLoggedIn, verifyPermission([authRoles.ADMIN]), updateProfileByAdmin)
router.patch("/profile/update", isLoggedIn, updateProfile)
router.get("/:id", isLoggedIn, getUserById)
router.delete("/:id", isLoggedIn, verifyPermission([authRoles.ADMIN]), deleteUser)
router.post("/forgotPassword", forgetPassword)
router.post("/resetPassword/:token", resetPassword)
router.post("/changePassword", isLoggedIn, changePassword)

export default router;