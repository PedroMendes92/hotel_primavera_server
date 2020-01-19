const express = require("express");
const authMiddleware = require('../middlewares/AuthMiddleware');

var User = require('../models/user');

const router = express.Router();

const newDocumentSettings = {
    new: true
}

router.use(authMiddleware);

router.get("/", async (req, res)  => {

    try {
        const user = await User.findById(req.userId);
        res.status(200).send({user})
    } catch (e) {
        res.status(400).send({ error: "Error getting user"});
    }
});

router.put("/", async (req, res) => {
    try {
        const modifiedUser = await User.findByIdAndUpdate(
            req.userId,
            req.body,
            newDocumentSettings
        );
        res.status(200).send({user: modifiedUser});
    } catch (e) {
        res.status(400).send({ error: "Error updating user"})
    }
});

router.delete("/", async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                deleted: true
            },
            newDocumentSettings
        );
        res.status(200).send({user});
    } catch (e) {
        res.status(400).send({ error: "Error deleting user"});
    }
})


module.exports = app => app.use("/user", router);