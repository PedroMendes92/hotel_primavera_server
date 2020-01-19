const express = require("express");
const authMiddleware = require('../middlewares/AuthMiddleware');
const adminMiddleware = require('../middlewares/AdminMiddleware');

var User = require('../models/user');

const router = express.Router();

const newDocumentSettings = {
    new: true
}

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", async (req, res)  => {

    try {
        const user = await User.find();
        res.status(200).send({user})
    } catch (e) {
        res.status(400).send({ error: "Error getting user"});
    }
});

router.put("/:userId", async (req, res) => {
    try {
        const modifiedUser = await User.findByIdAndUpdate(
            req.params.userId,
            req.body,
            newDocumentSettings
        );
        res.status(200).send({user: modifiedUser});
    } catch (e) {
        res.status(400).send({ error: "Error updating user"})
    }
});

router.delete("/:userId", async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(
            req.params.userId
        );
        res.status(200).send({user});
    } catch (e) {
        res.status(400).send({ error: "Error deleting user"});
    }
})


module.exports = app => app.use("/admin", router);