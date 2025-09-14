
const mongoose = require("mongoose")
require("dotenv").config();

exports.connect =() =>{
    mongoode.connect(process.env.MONGODB_URL ,{
        useNewUrlParser :true,
        useUnifiedTopology:true,

    })
    .then(() => console.log("DB CONNECTED SUCESSFULLY"))
    .catch((error) =>{
        console.log("DB CONNECTION FAILED");
        process.exit(1);
    })
};