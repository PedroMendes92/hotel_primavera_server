var express = require('express')
var router = express.Router();
var User = require('../models/user');

function validateBody(req, res, next){
    const {result, message} = User.validateBody(req.body, req.method);
    if(result){
        next()
    }else{
        res.status(400).send(`Bad request! take a look to following properties: ${message}`);
    }
}

async function isAuthenticated(req, res, next){
    const {result,message} = await User.isAuthenticated(req.body);
    console.log("is Auth? ", result, message);
    if(result){
        next()
    }else{
        res.status(401).send(message);
    }
}

router.use(validateBody);
router.use(isAuthenticated);

router.post("/", async (req,res) => {
    const user = await User.getUser(req.body);
    if(user){
        res.status(200).send(user).end();
    }else{
        res.status(500).send("500 - Server Error!").end();
    }
});
router.put("/", async(req,res)=>{
    const userModified = await User.update(req.body);
    if(userModified){
        res.status(200).send(userModified).end();
    }else{
        res.status(500).send("500 - Server Error!").end();
    }
    res.status(500).end();
});

module.exports = router;