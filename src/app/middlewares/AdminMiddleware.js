const jwt = require('jsonwebtoken');
const authConfig = require('../../config/auth.json');

const User = require('../models/user');

module.exports = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select("isAdmin");
        if(!user.isAdmin){
            res.status(401).send({error: "Forbiden Acess"}).end();
        }else{
            return next();
        }
    } catch (e) {
        return res.status(400).send({error: 'Admin validation error'});
    }
}