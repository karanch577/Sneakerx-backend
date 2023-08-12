import express from "express";
import {
  getGoogleOauthUrl,
  getCode,
  sendGoogleUser,
} from "../controllers/auth.controller.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = express.Router();


router.get("/Oauthurl", getGoogleOauthUrl)
router.get("/callback", getCode)
router.get("/getUser", isLoggedIn, sendGoogleUser)

export default router;