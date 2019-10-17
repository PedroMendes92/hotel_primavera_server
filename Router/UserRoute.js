var express = require('express')
var router = express.Router();
var User = require('../models/user');

function validateBody(req, res, next){
    const {result, message} = User.validateBody(req.body, req.method);
    if(result){
        next()
    }else{
        res.status(400).send(`Invalid properties: ${message}`);
    }
}

function isAuthenticated(req, res, next){
    User.isAuthenticated(req.body)
    .then(({result,message})=>{
        if(result){
            next()
        }else{
            res.status(401).send("Not logged or login has expired. Suggestion: redirect to login");
        }
    })
}

router.use(validateBody);
router.use(isAuthenticated);

router.post("/", (req,res) => {
    User.get(req.body)
        .then((user) => res.send(user))
        .catch((err) => res.send(err) )
});

module.exports = router;