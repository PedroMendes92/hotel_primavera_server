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

const resultObject = () => {
    return {
        status: 200,
        message: ""
    };
}
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
        const updatedUser = await updateTokenExpireDate(userDoc,settings);
        if (updatedUser) {
            return updatedUser;
        }
    }
    console.error("Error in: findOne", settings.query);
    return false;
}

const User = {
    validateBody: (bodyOptions, method) =>{
        const resultObject = {
            result: true,
            message: []
        };
        for(const property of getOptionsAllowed){
            switch (method) {
                case "POST":
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
        let resultObject = {
            result: false,
            message: "User is not Authenticated"
        };
        const query = {
            email: bodyOptions.email,
            token: bodyOptions.token
        };
        const user = await UserModel.findOne(query);
        if(user){
            const isTokenValid = canProceed(user, query);
            if (isTokenValid) {
                resultObject = {
                    result: true,
                    message: ""
                };
            } else {
                resultObject.message = resultObject.message + " - Token expired";
            }
        }
        return resultObject;
    },
    getUser: async (settings) => {
        settings.query = { email: settings.email };
        const user = await findOne(settings);
        if(user){
            return user;
        }
        return false;
    },
    create: async (settings) => {
        const resultObject = {status:200, message:""};
        settings.password = bcrypt.hashSync(settings.password, bcrypt.genSaltSync());
        const newUser = new UserModel( Object.assign(defaultUserSettings, settings));
        const isEmailUsed = await UserModel.findOne({email: settings.email});
        console.log("isEmailUsed", isEmailUsed);
        if(!isEmailUsed ){
            console.log(newUser)
            const savedUser = await newUser.save();
            console.log("savedUser", savedUser);
            if(savedUser){
                resultObject.message = savedUser;
            } else {
                resultObject.status = 500;
                resultObject.message = "Error creating the User."
            }
        } else{
            resultObject.status = 400;
            resultObject.message = `User ${settings.email} already exists!`;
        }
        return resultObject;
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
    login: async (settings) => {
        const resultObject = {status:200, message:""};
        const user = await UserModel.findOne( {email:settings.email} );
        if(user){
            if( bcrypt.compareSync(settings.password, user.password) ) {
                user.token = tokgen.generate();
                const savedUser = await updateTokenExpireDate(user,settings);
                if(savedUser){
                    resultObject.message = savedUser;
                }else{
                    resultObject.status = 500;
                    resultObject.message = "Error in Login!";
                }
            }else{
                resultObject.status = 401;
                resultObject.message = "Wrong password!";
            }
        }else{
            resultObject.status = 400;
            resultObject.message = `User ${settings.email} not found!`;
        }
        return resultObject;
    },
    logout: async (settings) => {
        const resultObject = {status:200, message:""};
        const user = await UserModel.findOne( 
            {email: settings.email}
        );
        if(user){
            user.token = "";
            user.tokenExpireDate = "";
            const savedUser = await user.save();
            if(savedUser){
                resultObject.message = savedUser;
            }else{
                resultObject.status = 500;
                resultObject.message = "Failed to Log out!";
            }
        }else{
            resultObject.status = 400;
            resultObject.message = `User ${settings.email} not found!`;
        }
        return resultObject;
    }
}

module.exports = User;  