const mongoose = require("mongoose");

const connectDB = async ()=>{
try{
    await mongoose.connect(process.env.MONGO_URI,{dbname : process.env.MONGO_DB});
    console.log("Database Connected ...");

}catch(Error){
    console.log("Error Connecting to Database ...", Error)}
}
module.exports = connectDB;