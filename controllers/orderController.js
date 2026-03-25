const Order = require("../models/Order");
const Cart = require("../models/Cart");
const bcrypt = require("bcrypt"); // <<
const auth = require("../auth");

const { errorHandler } = require("../auth");

// add CONTROLLERS HERE ---------------------------------------------

module.exports.checkoutOrder = (req, res) => {
	
	const userId = req.user.id;

	if (req.user.isAdmin) {
		return res.status(400).send({ 
			success: false,
			error: "Only non-admin users can get their order"
		});
	}

	return Cart.findOne({ userId })
	.then(cart => {
		if (!cart) {
			throw { 
				success: false,
				status: 404, 
				message: "No cart found"
			};
		}

		if (cart.cartItems.length === 0) {
			throw { 
				success: false,
				status: 400, 
				message: "Cart is empty"
			};
		}

		return Order.create({
			userId,
			productsOrdered: cart.cartItems,
			totalPrice: cart.totalPrice
		})
		.then(order =>{
			return Cart.findOneAndUpdate(
				{ userId: userId},
				{
					$set: {
						cartItems: [],
						totalPrice: 0
					}
				},
				{ new: true}

			)
			.then(() => order); // This code returns the newly created order, not the cart
		});
	})
	.then(order => res.status(200).send({
		success: true,
		message: "Order confirmed",
		order: order
	}))

	.catch(err => errorHandler(err, req, res));

}

module.exports.myOrders = (req, res) => {
	const userId = req.user.id;

	if (req.user.isAdmin) {
		return res.status(400).send({ 
			success: false,
			error: "Only non-admin users can get their order"
		});
	}
	
	return Order.findOne({ userId })
	.then(order => {
		if (!order) {
			throw { 
				success: false,
				status: 404, 
				message: "Order not found"
			};
		}

		return res.status(200).send({
			success: true,
			order: order
		});
	})
	.catch(err => errorHandler(err, req, res));

}


module.exports.allOrders = (req, res) => {
	
	return Order.find({})
    .then(orders => {
        if (orders.length === 0) {
            throw { 
            	success: false,
            	status: 200, 
            	message: "No orders found"
            };
        }
        
        return res.status(200).send({
        	sucess: true,
        	orders: orders
        });
    })
    .catch(error => errorHandler(error, req, res));
}
// end CONTROLLERS HERE ---------------------------------------------















