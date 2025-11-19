const express = require("express");
const router = express.Router();
const userAuthController = require("../Controllers/userAuth.controller");

router.post("/signup", userAuthController.signUp);
router.post("/signin", userAuthController.signIn);

module.exports = router;