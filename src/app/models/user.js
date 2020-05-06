const settings = require("./userSettings.json");
const mongoose = require("../../db");
const bcrypt = require("bcryptjs");

const UserSchema = mongoose.Schema({
    isAdmin: {
        type: Boolean,
        default: false,
        select: false
    },
    deleted:{
        type:Boolean,
        default: false
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select: false,
        
    },
    createdAt:{
        type: Date,
        default: Date.now()
    },
    phone: Number,
    job: String,
    address: String,
    postalCode: String,
    cc: Number,
    birthDate: Date,
    expiryDate: Date,
    tax: Number,
    socialSecurity: Number,
    nationality: String,
    healthNumber: Number
});

UserSchema.pre('save', async function(next) {
    const hashedPass = await bcrypt.hash(this.password, 10);
    this.password = hashedPass;
    next();
})

const User = mongoose.model( "User", UserSchema );

module.exports = User;  