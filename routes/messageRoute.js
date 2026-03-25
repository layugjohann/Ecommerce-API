const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

const { verify, verifyAdmin, isLoggedIn } = require("../auth")

router.post("/", verify, isLoggedIn, messageController.createMessage);

router.get("/:conversationId", verify, isLoggedIn, messageController.getMessages);

router.patch("/:messageId/read", verify, isLoggedIn, messageController.markAsRead);

module.exports = router	