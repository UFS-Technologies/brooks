var mysql = require("mysql2");
var connection = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "password",
    // database: "igm",
    database: "brooks_db",
        // database: "brooks_new",

    multipleStatements: true,
});

// Remove ONLY_FULL_GROUP_BY from sql_mode on every new connection
connection.on("connection", function (conn) {
    conn.query("SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'");
});

connection.on("connect", function() {
   console.log("Connected to the database");
});
module.exports = connection;

// const mysql = require("mysql2");

// const pool = mysql.createPool({
//     host: "127.0.0.1",   
//     user: "root",
//     password: "password",
//     database: "igm_db",
//     port: 3306,
//     waitForConnections: true,  
//     connectionLimit: 10,
//     queueLimit: 0,
//     connectTimeout: 10000, 
//     multipleStatements: true
// });


// pool.on("connection", function (conn) {
//     console.log("✅ New DB Connection Established");

//     conn.query(
//         "SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'",
//         (err) => {
//             if (err) {
//                 console.error("❌ SQL Mode Error:", err);
//             }
//         }
//     );
// });



// module.exports = pool;