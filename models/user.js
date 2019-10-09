const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const moment = require('moment');
const TokenGenerator = require('uuid-token-generator');
const tokgen = new TokenGenerator(256, TokenGenerator.BASE62);

const UserSchema = mongoose.Schema({
    name: String,
    email: String,
    password: String,
    token: String,
    tokenExpireDate: Date,
    phone: Number,
    job: String,
    address: String,
    postalCode: String,
    cc: Number,
    id: Number,
    birthDate: Date,
    expiryDate: Date,
    tax: Number,
    socialSecurity: Number,
    nationality: Number,
    healthNumber: Number
});

const UserModel = mongoose.model("User",UserSchema);

const defaultUserSettings = {
    name: "",
    email: "",
    password: "",
    token: "",
    tokenExpireDate: new Date(),
    phone: 0,
    job: "",
    address: "",
    postalCode: "",
    cc: 0,
    id: 0,
    birthDate: new Date(),
    expiryDate: new Date(),
    tax: 0,
    socialSecurity: 0,
    nationality: 0,
    healthNumber: 0
}

const excludeProperties = [
    "name", "token", "tokenExpireDate"
]

const updateTokenExpireDate = (user) =>{
    return new Promise( (resolve, reject) => {
        user.tokenExpireDate = moment().add(30,"m").toString();
        user.save((err) => {
            if(err) reject(err);
            resolve(user);
        });
    })
}

const canProceed = (user, settings) => {
    return (settings.token === user.token &&
           moment().isBefore(user.tokenExpireDate) );
}

const findOne = (settings) => {
    return new Promise( (resolve, reject) => {
        UserModel.findOne({"name":settings.name}, (err, user) =>{
            if(canProceed(user, settings)){
                updateTokenExpireDate(user,settings)
                .then((user) => resolve(user) )
                .catch((err) => reject(err))
            }else{
                reject("access denied or token expired");
            }
        })
    });
}

const User = {
    get: (settings) => {
        return findOne(settings);
    },
    create: (settings) => {
        settings.password = bcrypt.hashSync(settings.password, bcrypt.genSaltSync());
        const newUser = new UserModel( Object.assign(defaultUserSettings, settings));
        return new Promise((resolve, reject) => {
            newUser.save((err) => {
                if(err){
                    reject(err);
                }else{
                   resolve(newUser);
                }
            });
        });
    },
    update: (settings) => {
        return new Promise((resolve, reject) => {
            findOne(settings)
                .then(user => {
                    const userObject = user.toObject();
                    for (const key in settings) {
                        if (settings.hasOwnProperty(key) &&
                            userObject.hasOwnProperty(key) ) {
                            if( !excludeProperties.includes(key)) {
                                user[key] = settings[key];
                            }
                        }else{
                            reject(`the property ${key} is not vaild`);
                        }
                    }
                    user.save((err) => {
                        if(err) reject(err);
                        resolve(user);
                    });
                })
                .catch(err => reject(err))
        })
    },
    login: (settings) => {
        return new Promise( (resolve, reject) => {
            UserModel.findOne({"name":settings.name}, (err, user) => {
                if(user && bcrypt.compareSync(settings.password, user.password)) {
                    user.token = tokgen.generate();
                    updateTokenExpireDate(user,settings)
                        .then((user) => resolve(user.token) )
                        .catch((err) => reject(err));
                }else{
                    reject("wrong password");
                }
            });
        });
    },
    logout: (settings) => {
        UserModel.findOneAndUpdate( 
            {name: settings.name},
            {
                token: "",
                tokenExpireDate: ""
            } )
    }
}

module.exports = User;  