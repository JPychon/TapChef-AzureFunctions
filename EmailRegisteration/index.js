const sql = require('mssql');

module.exports = async function (context, req) {
    context.log('HTTP trigger function processed a request.');

    const email = req.body && req.body.email;

    if (!email) {
        context.res = {
            status: 400,
            body: "Please provide an email address."
        };
        return;
    }

    const config = {
        server: process.env.DB_HOST || 'tapchef-promo-server.database.windows.net',
        port: process.env.DB_PORT || 1433,
        user: process.env.DB_USER || 'User',
        password: process.env.DB_PASSWORD || 'Password',
        database: process.env.DB_NAME || 'TapChefPromo',
        options: {
            encrypt: true // Use this if you're on Windows Azure
        }
    };

    try {
        let pool = await sql.connect(config);
        let result = await pool.request()
            .input('input_email', sql.NVarChar, email)
            .query('SELECT Email FROM Users WHERE Email = @input_email');
        
        if (result.recordset.length > 0) {
            context.res = {
                status: 409,
                body: { success: false, exists: true, message: "Email already exists!" }
            };
            return;
        }
        
        await pool.request()
            .input('input_email', sql.NVarChar, email)
            .query('INSERT INTO Users (EMAIL) VALUES (@input_email)');

        context.res = {
            status: 200,
            body: { success: true, message: "Email registered successfully!" }
        };
        
    } catch (err) {
        context.log(err);
        context.res = {
            status: 500,
            body: "Error connecting to the database."
        };
    }
};
