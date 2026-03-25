const mongoose = require("mongoose");
const Product = require("../models/Product");
const bcrypt = require("bcrypt");
const auth = require("../auth");

const { errorHandler }  = require("../auth");


// CREATE PRODUCT
module.exports.createProduct = (req, res) => {

    const { name, description, price } = req.body;

    if (typeof name !== "string" || name.trim() === "" ||
    typeof description !== "string" || description.trim() === "" ||
    typeof price !== "number" || price < 0) 
    {
        return res.status(400).send({ 
            success: false, 
            error: "Invalid input"
        });
    }

    return Product.findOne({ name })
    .then(existingProduct => {
        if (existingProduct) {
            throw { 
                success: false,
                status: 409, 
                message: "Product already exist"
            };
        }
            
            const newProduct = new Product({
                name,
                description,
                price
            });

            return newProduct.save();
        })
        .then(product => {
                res.status(201).send({
                    success: true,
                    message: "Product added successfully",
                    product: product
                });
            })
            
    .catch(error => errorHandler(error, req, res));
};

// GET ALL PRODUCTS

module.exports.getAllProducts = (req, res) => {

    return Product.find({})
    .then(products => {
        if (products.length === 0) {
            throw { 
                success: false,
                status: 200, 
                message: "No products found"
            };
        }
        
        return res.status(200).send({
            success: true,
            products: products
        });
    })
    .catch(error => errorHandler(error, req, res));
}

// GET ALL ACTIVE

module.exports.getActiveProducts = (req, res) => {

    return Product.find({ isActive: true})
    .then(products => {
        if (products.length === 0) {
            throw { 
                success: false,
                status: 200, 
                message: "No products found"
            };
        }
        return res.status(200).send({
            success: true,
            products: products
        });
    })
    .catch(error => errorHandler(error, req, res));
}

// GET ONE PRODUCT

module.exports.getOneProduct = (req, res) => {
    
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).send({
            success: false,
            error: "Invalid product ID"
        });
    }

    return Product.findById(productId)
    .then(product => {
        if (!product) {
            throw { 
                success: false,
                status: 404, 
                message: "No product found"};
        }
        
        return res.status(200).send({
            success: true,
            product: product
        });
    })
    .catch(error => errorHandler(error, req, res));
}

// UPDATE PRODUCT

module.exports.updateProduct = (req, res) => {
    const { name, description, price } = req.body;
    const { productId } = req.params;

    if (typeof name !== "string" || name.trim() === "" ||
    typeof description !== "string" || description.trim() === "" ||
    typeof price !== "number" || price < 0) {
        
        return res.status(400).send({ 
            success: false,
            error: "Invalid input"
        });
    }

    if (!productId) {
        return res.status(400).send({ 
            success: false,
            error: "Product ID is required"
        });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).send({
            success: false,
            error: "Invalid product ID"
        });
    }

    return Product.findByIdAndUpdate( productId, {
        name,
        description,
        price
    },

    { new: true }
)
    .then(product => {
        if (!product) {
            throw { 
                success: false,
                status: 404, 
                message: "No product found"
            };
        }

    return res.status(200).send({
        success: true,
        message: "Product updated successfully",
        product: product
    });
 })
 .catch(error => errorHandler(error, req, res));

}

// SEARCH BY NAME

module.exports.searchByName = (req, res) => {

    const { name } = req.body;

    if ( name === undefined || name === "") {
    return res.status(400).send({
        success: false,
        message: "Product name is required"
     });
  
  }

    return Product.findOne({ name })

    .then(product => {
        if (!product) {
            throw { 
                success: false,
                status: 404, 
                message: "No product found"
            };
        }

        return res.status(200).send({
            success: true,
            product: product
        });
    })

    .catch(error => errorHandler(error, req, res));
};



// SEARCH BY PRICE

module.exports.searchByPrice = (req, res) => {

    const { minPrice, maxPrice} = req.body;

    if (minPrice === undefined || maxPrice === undefined) {
        return res.status(400).send({
            success: false,
            message: "Min price and Max price are required"
        });
    }

    const min = Number(minPrice);
    const max = Number(maxPrice);

    if (isNaN(min) || isNaN(max)) {
        return res.status(400).send({
            success: false,
            message: "Price must be a number"
        });
    }

    if (min <= 0 || max <= 0) {
        return res.status(400).send({
            success: false,
            message: "Invalid input"
        });
    }

    if (min > max) {
        return res.status(400).send({
            success: false,
            message: "Min cannot be higher than Max"
        });
    }

    return Product.find({
        price: {
            $gte: min,
            $lte: max
        }
    })
    .then(products => {
        if (products.length === 0) {
            throw { 
                success: false,
                status: 404, 
                message: "No products found"
            };
        }

        return res.status(200).send({
        success: true, 
        products: products

       });
    })
    .catch(error => errorHandler(error, req, res));
};


module.exports.archiveProduct = (req, res) => {
    
    const { productId } = req.params;

    if (!productId) {
        return res.status(400).send({ 
            success: false,
            error: "Product ID must be provided"
        });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).send({
            success: false,
            error: "Invalid product ID"
        });
    }

    return Product.findById(productId)
    .then(product => {
        if (!product) {
            throw { 
                success: false,
                status: 404, 
                message: "Product not found"
            };
        }

        if (!product.isActive) {
            throw { 
                success: false,
                status: 400, 
                message: "Product is already archived"
            };
        }

        product.isActive = false;
        return product.save();
    })

    .then(updatedProduct => res.status(200).send({
        success: true,
        message: "Product has been archived successfully",
        product: updatedProduct
    }))

    .catch(error => errorHandler(error, req, res));

}

module.exports.activateProduct = (req, res) => {
    
    const { productId } = req.params;

    if (!productId) {
        return res.status(400).send({ 
            success: false,
            error: "Product ID must be provided"
        });
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).send({
            success: false,
            error: "Invalid product ID"
        });
    }

    return Product.findById(productId)
    .then(product => {
        if (!product) {
            throw { 
                success: false,
                status: 404, 
                message: "Product not found"
            };
        }

        if (product.isActive) {
            throw { 
                success: false,
                status: 400, 
                message: "Product is already active"
            };
        }

        product.isActive = true;
        return product.save();
    })

    .then(updatedProduct => res.status(200).send({
        success: true,
        message: "Product has been activated successfully",
        product: updatedProduct
    }))
    .catch(error => errorHandler(error, req, res));

}
















// end CONTROLLERS HERE ---------------------------------------------