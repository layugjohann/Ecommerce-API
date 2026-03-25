const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const bcrypt = require("bcrypt"); // <<
const auth = require("../auth");

const {errorHandler } = require("../auth");

// add CONTROLLERS HERE ---------------------------------------------

// GET CART
module.exports.getCart = (req, res) => {

const userId = req.user.id;

// Validate if the user is admin

if (req.user.isAdmin) {
    return res.status(400).send({
        success: false,
        error: "Only non-admin can retrieve cart"
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

    return res.status(200).send({
        success: true,
        cart: cart
    });
})

.catch(err => errorHandler(err, req, res));

}


// ADD TO CART

module.exports.addToCart = (req, res) => {

    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (req.user.isAdmin) {
    return res.status(400).send({
            success: false,
            error: "Only non-admin can retrieve cart"
        });
    }

    if (!productId || quantity === undefined) {
        return res.status(400).send({
            success: false,
            error: "All fields must be filled"
        });
    }

    const qty = Number(quantity);

    if (isNaN(qty) || qty <= 0) {
        return res.status(400).send({
            success: false,
            error: "Quantity must be positive numbers"
        });
    }

    return Product.findById(productId)
    .then(product => {
        if (!product) {
            throw { success: false, status: 404, message: "No product found" };
        }

        if (!product.isActive) {
            throw { success: false, status: 400, message: "Product not available" };
        }

        // ⚡ RETURN the nested promise so errors propagate
        return Cart.findOne({ userId })
        .then(cart => {
            if (!cart) {
                throw { success: false, status: 404, message: "No cart found" };
            }

            const item = cart.cartItems.find(
                item => item.productId.toString() === productId
            );

            const price = product.price;

            if (item) {
                item.quantity += qty;
                item.subtotal += qty * price;
            } else {
                cart.cartItems.push({
                    productId,
                    quantity: qty,
                    price,
                    subtotal: qty * price
                });
            }

            cart.totalPrice = cart.cartItems.reduce(
                (sum, item) => sum + item.subtotal, 0
            );

            return cart.save();
        });
    })
    .then(cart => res.status(200).send({
        success: true,
        message: "Item successfully added to cart",
        cart: cart
    }))
    .catch(err => errorHandler(err, req, res));
};

        

// UPDATE CART QUANTITY


module.exports.updateCartQuantity = (req, res) => {

    const { productId, newQuantity } = req.body;
    const userId = req.user.id;

    if (req.user.isAdmin) {
    return res.status(400).send({
            success: false,
            error: "Only non-admin can retrieve cart"
        });
    }

    if (!productId || newQuantity === undefined) {
        return res.status(400).send({
            success: false,
            error: "All fields are required"
        });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).send({
            success: false,
            error: "Invalid product ID"
        });
    }

    if (typeof newQuantity !== "number" || newQuantity < 0) {
        return res.status(400).send({
            success: false,
            error: "Invalid quantity"
        });
    }

    return Cart.findOne({ userId })

    .then(cart => {

        if (!cart) {
            throw {
                status: 404,
                success: false,
                message: "Cart not found"
            };
        }

        const item = cart.cartItems.find(
            item => item.productId.toString() === productId
        );

        if (!item) {
            throw {
                status: 404,
                success: false,
                message: "Item not found"
            };
        }

        if (newQuantity === 0) {
            cart.cartItems = cart.cartItems.filter(
                item => item.productId.toString() !== productId
            );
        } else {
            item.quantity = newQuantity;
            item.subtotal = newQuantity * item.price;
        }

        cart.totalPrice = cart.cartItems.reduce(
            (sum, item) => sum + item.subtotal, 0
        );

        return cart.save();
    })

    .then(updatedCart => res.status(200).send({
        success: true,
        message: "Cart updated successfully",
        cart: updatedCart
    }))

    .catch(err => errorHandler(err, req, res));
};




// REMOVE FROM CART

module.exports.removeFromCart = (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;

    if (req.user.isAdmin) {
        return res.status(400).send({
            success: false,
            error: "Only non-admin can retrieve cart"
        });
    }

    if (!productId) {
        return res.status(400).send({ 
            success: false,
            error: "Product ID is required"
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

        const itemIndex = cart.cartItems.findIndex(item => item.productId.toString() === productId);

        if (itemIndex === -1) {
            throw { 
                success: false,
                status: 404, 
                message: "Item is already removed from the cart"
            };
        }

        // Remove the item form the cart

        cart.cartItems.splice(itemIndex, 1);
        cart.totalPrice = cart.cartItems.reduce(
            (sum, item) => sum + item.subtotal, 0);

        return cart.save();

    })

    .then(updatedCart => res.status(200).send({
        success: true,
        message: "Item removed from the cart successfully",
        cart: updatedCart.cart
    }))

    .catch(err => errorHandler(err, req, res));
}

// CLEAR CART

module.exports.clearCart = (req, res) => {

    const userId = req.user.id;

    if (req.user.isAdmin) {
        return res.status(400).send({
            success: false,
            error: "Only non-admin can retrieve cart"
        });
    }

        return Cart.findOneAndUpdate( 
        {userId: userId},
        {
            $set: {
                cartItems: [],
                totalPrice: 0,
            }
        },
        { new: true }
    )

    .then(cart => {
        if (!cart) {
            throw { 
                success: false,
                status: 404, 
                message: "Cart not found"
            };
        }
        return res.status(200).send({
            success: true,
            message: "Cart successfully emptied",
            cart: cart

        })
    })
    .catch(err => errorHandler(err, req, res));
}


module.exports.getAllCarts = (req, res) => {
    
    Cart.find({})
        .then(carts => {
            if (carts.length === 0) {
                throw { 
                    status: 404,
                    success: false, 
                    message: "Cart not found"
                };
            }

            res.status(200).send({
                success: true,
                carts: carts
            });
        })
        .catch(error => errorHandler(error, req, res));
};

       
// end CONTROLLERS HERE ---------------------------------------------