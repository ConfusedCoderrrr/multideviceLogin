import express from "express";
import { verifyToken } from "../index.js";
import {
  testApi,
  registerUser,
  loginUser,
  updateUser,
  deleteUser,
  verifyUser,
  getLoginHistory,
  logoutDevice,
  logoutAllDevices,
  generateOtp,
  verifyOtp,
  congratualationRegistration,
  getAllUsers,
} from "../controllers/index.js";

const router = express.Router();

router.route("/test").get(testApi);

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/verify-otp").post(verifyUser);

router.route("/login-history").get(verifyToken, getLoginHistory);

router.route("/devices/:deviceId/logout").delete(verifyToken, logoutDevice);

router.route("/devices/logout").delete(verifyToken, logoutAllDevices);

router.route("/generate-otp").post(generateOtp);

router.route("/verify-user-otp").post(verifyOtp);

router.route("/congReg").post(congratualationRegistration);

router.route("/admin/users").get(verifyToken, getAllUsers);

router
  .route("/update")
  .patch(verifyToken, updateUser)
  .delete(verifyToken, deleteUser);

export default router;
