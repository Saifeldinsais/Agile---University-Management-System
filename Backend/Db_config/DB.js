const mongoose = require("mongoose");

const connectDB = async ()=>{
try{
    await mongoose.connect("mongodb+srv://UMS_User:UMS123456@cluster0.t7vtjiv.mongodb.net/?appName=Cluster0",{dbname : "University_Management_System"});
    console.log("Database Connected ...");

}catch(Error){
    console.log("Error Connecting to Database ...", Error)}
}
module.exports = connectDB;