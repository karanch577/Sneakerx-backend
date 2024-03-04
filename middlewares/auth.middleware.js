import JWT from "jsonwebtoken";
import config from "../config/index.js";
import User from "../models/user.schema.js";
import asyncHandler from "../services/asyncHandler.js";
import CustomError from "../utils/customError.js";

/**
 * @description
 * * This middleware is responsible for validating the logged in user.
 */

export const isLoggedIn = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies.token || (req.headers.authorization && req.headers.authorization.startsWith("Bearer"))) {
    token = req.cookies.token || req.headers.authorization.split(" ")[1];
  }

  console.log("token ==>>", token)

  if (!token) {
    throw new CustomError("Not authorized to access the route1", 401);
  }

  try {
    const decoded = JWT.verify(token, config.JWT_SECRET);
    req.user = await User.findById(decoded._id, "name email role");
    next();
  } catch (error) {
    throw new CustomError("Not authorized to access the route | error", 401);
  }
});

/**
 * @param {AvailableUserRoles} roles
 * @description
 * * This middleware is responsible for validating multiple user role permissions at a time.
 */

export const verifyPermission = (role = []) => asyncHandler((req, res, next) => {
  if(role.includes(req.user.role)) {
    next()
  } else {
    throw new CustomError("You are not authorized for this action", 401)
  }
})