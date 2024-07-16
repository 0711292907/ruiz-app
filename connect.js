const {createPool} = require('mysql2')

const pool = createPool({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
    connectionLimit: 30,
    waitForConnections: true
})

module.exports = pool;