const express = require("express");
const router = express.Router();
const userAuthController = require("../Controllers/userAuth.controller");
const { authenticateToken, requireAdmin } = require("../Utils/authMiddleware");

// ============ PUBLIC ROUTES ============
router.post("/signup", userAuthController.signUp); // Student registration only
router.post("/signin", userAuthController.signIn); // Login for all users

// ============ AUTHENTICATED ROUTES ============
router.get("/me", authenticateToken, userAuthController.getCurrentUser);
router.post("/change-password", authenticateToken, userAuthController.changePassword);

// ============ ADMIN-ONLY ROUTES ============
// Staff account management
router.post("/admin/staff", authenticateToken, requireAdmin, userAuthController.adminCreateStaffAccount);
router.post("/admin/staff/:staffUserId/reset-password", authenticateToken, requireAdmin, userAuthController.adminResetStaffPassword);
router.patch("/admin/staff/:staffUserId/status", authenticateToken, requireAdmin, userAuthController.adminUpdateStaffStatus);

module.exports = router;