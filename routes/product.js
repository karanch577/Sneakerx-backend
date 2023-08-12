import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  getLimitedProducts,
  getProductsByCategory,
  getSearchedProducts,
  updateProduct,
  updateProductImg,
  deleteProduct,
} from "../controllers/product.controller.js";

import { isLoggedIn, verifyPermission } from "../middlewares/auth.middleware.js";
import authRoles from "../utils/authRoles.js";

const router = express.Router();

router.get("/id/:productId", getProductById)
router.get("/all", getAllProducts)
router.get("/list", getLimitedProducts)
router.get("/search", getSearchedProducts)
router.get("/:category", getProductsByCategory)
router.post("/create",isLoggedIn, verifyPermission([authRoles.ADMIN]), createProduct)
router.patch("/update/:id",isLoggedIn, verifyPermission([authRoles.ADMIN]), updateProduct)
router.put("/updatePhotos/:id",isLoggedIn, verifyPermission([authRoles.ADMIN]), updateProductImg)
router.delete("/delete/:id", isLoggedIn, verifyPermission([authRoles.ADMIN]), deleteProduct)



export default router;