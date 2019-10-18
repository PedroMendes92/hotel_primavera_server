const settings = require("./userSettings.json");
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

const {
    defaultUserSettings,
    excludeProperties,
    getOptionsAllowed
} = settings

const updateTokenExpireDate = async (user) =>{
    user.tokenExpireDate = moment().add(30,"m").toString();
    const updatedUser = await user.save();
    if( updatedUser){
        return updatedUser
    }
    console.error("Error in: updateTokenExpireDate", user);
    return false;
}

const canProceed = (user, settings) => {
    console.log("can proceed")
    console.log(settings.token, user.token);
    console.log(moment().isBefore(user.tokenExpireDate))
    return settings.token === user.token &&
           moment().isBefore(user.tokenExpireDate) ;
}


const findOne = async (settings) => {
    const userDoc = await UserModel.findOne(settings.query);
    if(userDoc){
        const isTokenValid = canProceed(userDoc, settings);
        if(isTokenValid){
            const updatedUser = await updateTokenExpireDate(userDoc,settings)
            if(updatedUser){
                return updatedUser
            }
        }
    }
    console.error("Error in: findOne", query);
    return false;
}

const User = {
    validateBody: (bodyOptions, method) =>{
        const resultObject = {
            result: true,
            message: []
        };
        for(const property of getOptionsAllowed){
            console.log("property", property);
            switch (method) {
                case "POST":
                    console.log("POST", getOptionsAllowed, property)
                    if(!bodyOptions.hasOwnProperty(property)){
                        resultObject.result = false;
                        resultObject.message.push(property);
                    }
                    break;
                default:
                    break;
            }
        }
        return resultObject;
    },
    isAuthenticated: async(bodyOptions) =>{
        const resultObject ={
            result: true,
            message: ""
        };
        const query = {
            name: bodyOptions.name,
            token: bodyOptions.token
        }
        const user = await UserModel.findOne(query);
        if(!user){
            resultObject.result = false;
            resultObject.message = "User is not Authenticated "; 
        } 
        return resultObject;
    },
    getUser: async (settings) => {
        settings.query = { name: settings.name };
        const user = await findOne(settings);
        if(user){
            return user;
        }
        return false;
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
    update: async (settings) => {
        const user = await findOne({query: {name:settings.name}, token:settings.token});
        if(user){
            console.log("settings",settings)
            const filteredSettings = Object.entries(settings).filter( setting =>{
                return !excludeProperties.includes(setting[0]);
            });
            filteredSettings.forEach((setting) =>{
                user[setting[0]] = setting[1];
            })
            return await user.save();
        }
        return false;
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