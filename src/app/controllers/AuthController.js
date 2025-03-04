const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const authConfig = require('../../config/auth.json');
var User = require('../models/user');

const router = express.Router();

function generateJWT(params = {}){
    return jwt.sign(params, authConfig.secret, {
        expiresIn: 84600
    });

}

router.post("/register", async (req, res)  => {
    try {
        const {email} = req.body

        if(await User.findOne({email})){
            return res.status(400).send({error: 'User already exists'});
        }

        const user = await User.create(req.body);
        user.password = undefined;
        res.status(200).send({
            user,
            token: generateJWT({id: user.id})
        });
    } catch (e) {
        res.status(400).send( { error: "Registration failed"} );
    }
});

router.post("/authenticate", async (req, res) => {
    const {email, password} = req.body;
    try {
        const user = await User.findOne({email}).select('password');
        if(!user){
            return res.status(400).send({error: 'User not found'});
        }
        
        if(!await bcrypt.compare(password, user.password)){
            return res.status(400).send({error: 'Invalid Password'});
        }

        user.password = undefined;
        
        const token = generateJWT({id: user.id});

        res.status(200).send({
            user,
            token: generateJWT({id: user.id})
        });

    } catch (e) {
        res.status(400).send( { error: "Authentication failed"} );
    }
});

module.exports = app => app.use("/auth", router);