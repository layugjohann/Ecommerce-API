const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

							
const { verify, verifyAdmin, isLoggedIn } = require("../auth")


// add router here ------------------------------------

router.post("/checkout", verify, orderController.checkoutOrder);

router.get("/", verify, orderController.myOrders);

router.get("/all", verify, verifyAdmin, orderController.allOrders);

// end router here ------------------------------------



module.exports = router;