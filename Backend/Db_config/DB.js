// const mongoose = require("mongoose");

// const connectDB = async ()=>{
// try{
//     await mongoose.connect(process.env.MONGO_URI,{dbname :process.env.MONGO_DB});
//     console.log("Database Connected ...");

// }catch(Error){
//     console.log("Error Connecting to Database ...", Error)}
// }
// module.exports = connectDB;




const mysql = require("mysql2");
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DBNAME
}).promise();

module.exports = pool;

