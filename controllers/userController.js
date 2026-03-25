const mongoose = require("mongoose");
const User = require("../models/User");
const Cart= require("../models/Cart");
const bcrypt = require("bcrypt"); // <<
const auth = require("../auth");

const {errorHandler } = require("../auth");

// add CONTROLLERS HERE ---------------------------------------------


module.exports.registerUser = (req, res) => {
    const { firstName, lastName, email, password, mobileNo } = req.body;
    

    if (!firstName || !lastName || !email || !password || !mobileNo) {
        return res.status(400).send({ 
            success: false,
            error: "All fields are required"
        });
    }

    if (!email.includes("@")) {
        return res.status(400).send({ 
            success: false,
            error: "Email format invalid"
        });
    }

    if (password.length < 8) {
        return res.status(400).send({ 
            success: false,
            error: "Password must be more than 8 characters"
        });
    }

    if (mobileNo.length < 11) {
        return res.status(400).send({ 
            success: false,
            error: "Mobile number format invalid"
        });
    }

    return User.findOne({ email })
    .then(existingUser => {

        if (existingUser) {
            throw{ 
                success: false,
                status: 409, 
                message: "Email is already registered"
            };
        }

    return User.create({ 
        firstName,
        lastName,
        email,
        password: bcrypt.hashSync(password, 10),
        mobileNo
    });
})

.then(user => {
    return Cart.create({
        userId: user._id,
        cartItems: [],
        totalPrice: 0
        });
})

.then(() => res.status(201).send({
    success: true,
    message: "User successfully registered"
}))

.catch(error => errorHandler(error, req, res));

}


module.exports.loginUser = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ 
            success: false,
            error: "Email and password must be provided"
        });
    }

    if (!email.includes("@")) {
        return res.status(400).send({ 
            success: false,
            error: "Email format not valid"
        });
    }

    return User.findOne({ email })
    .then(user => {
        if (!user) {
            throw { 
                success: false,
                status: 404, 
                message: "User not found"
            };
        }

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    
    if (!isPasswordCorrect) {
        throw { 
            success: false,
            status: 409, 
            message: "Incorrect password"
        };
    }

    return res.status(200).send({
        success: true,
        message: "User successfully logged in",
        access: auth.createAccessToken(user)
    });
})
    .catch(error => errorHandler(error, req, res));
}



module.exports.getProfile = (req, res) => {
    
    const userId = req.user.id;

    if (req.user.isAdmin) {
        return res.status(400).send({
            success: false,
            error: "Only non-admin can retrieve cart"
        });
    }

   return User.findById(userId)
    .then(user => {
        if (!user) {
            throw { 
                success: false,
                status: 404, 
                message: "User not found"
            };        
        }

        return res.status(200).send({
            success: true,
            user: user
        });
    })
    .catch(error => errorHandler(error, req, res));
}
   

module.exports.setAsAdmin = (req, res) => {
    
    const { userId } = req.params;

    if (!userId) {
        return res.status(404).send({ 
            success: false,
            error: "User ID must be provided"
        });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).send({
        success: false,
        error: "Invalid user ID"
    });
}

    return User.findById(userId)
    .then(user => {
        if (!user) {
            throw { 
                success: false,
                status: 404, 
                message: "User not found"
            };
        }

        if (user.isAdmin) {
            throw { 
                success: false,
                status: 400, 
                message: "User is already an admin"
            };
        }

        user.isAdmin = true;
        return user.save();
    })

    .then(updatedUser => res.status(200).send({
        success: true,
        message: "User has been promoted to admin",
        user: updatedUser
    }))
    .catch(error => errorHandler(error, req, res));

}


module.exports.updatePassword = (req, res) => {

    const userId = req.user.id;
    const { password } = req.body;

    if (req.user.isAdmin) {
        return res.status(400).send({
            success: false,
            error: "Only non-admin can retrieve cart"
        });
    }

    if (!password || password.trim() === "") {
        return res.status(400).send({
            success: false,
            message: "Password is required"
        });
    }

    
    const hashedPassword = bcrypt.hashSync(password, 10)

    
    return User.findByIdAndUpdate(
        userId,
        { password: hashedPassword },
        { new: true }   
        )
    .then(updatedUser => {
        if (updatedUser) {
            res.status(200).send({
                success: true,
                message: "Password reset successfully"
            });
        } else {
            res.status(400).send({
                success: false,
                newPassword: "Password update failed!"
            });
        }
    })
    .catch(error => errorHandler(error, req, res));

}



// end CONTROLLERS HERE ---------------------------------------------