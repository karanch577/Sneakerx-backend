import express from "express";
import {
  createCollection,
  getCollections,
  updateCollection,
  deleteCollection,
  getProductByCollectionId
} from "../controllers/collection.controller.js";
import { isLoggedIn, verifyPermission } from "../middlewares/auth.middleware.js";
import authRoles from "../utils/authRoles.js";

const router = express.Router();

router.post("/create",isLoggedIn, verifyPermission([authRoles.ADMIN]), createCollection)
router.get("/all", getCollections)
router.put("/:id",isLoggedIn,verifyPermission([authRoles.ADMIN]), updateCollection)
router.delete("/:id",isLoggedIn,verifyPermission([authRoles.ADMIN]), deleteCollection)
router.get("/products/:id", getProductByCollectionId)


export default router;