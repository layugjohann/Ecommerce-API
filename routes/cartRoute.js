const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");

// const passport = require('passport');
// require('../passport');
							
const { verify, verifyAdmin, isLoggedIn} = require("../auth")


// add router here ------------------------------------

 router.get("/", verify, cartController.getCart);

router.post("/add", verify, cartController.addToCart);

router.patch("/update", verify, cartController.updateCartQuantity);

router.patch("/:productId", verify, cartController.removeFromCart);

router.put("/clear", verify, cartController.clearCart);

router.get("/all", verify, verifyAdmin, cartController.getAllCarts);

// Added subtract cart quantity


// end router here ------------------------------------


module.exports = router;