const express = require("express");
const router = express.Router();
const conversationController = require("../controllers/conversationController");
							
const { verify, verifyAdmin, isLoggedIn } = require("../auth")

router.post("/", verify, isLoggedIn, conversationController.createConversation);

router.get("/", verify, isLoggedIn, conversationController.getUserConversations);

router.get("/:conversationId", verify, isLoggedIn, conversationController.getConversationById);

router.delete("/:conversationId", verify, isLoggedIn, conversationController.deleteConversation);

module.exports = router;	