const express = require("express");
const router = express.Router();
const userAuthController = require("../Controllers/userAuth.controller");

router.post("/signup", userAuthController.signUp); // DONE EAV MODEL
router.post("/signin", userAuthController.signIn); // DONE EAV MODEL

module.exports = router;