const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");


// =========================================================
// ROUTES
// =========================================================

const booksRoutes = require("./routes/books");
const membersRoutes = require("./routes/members");
const issuesRoutes = require("./routes/issues");
const returnsRoutes = require("./routes/returns");
const reservationsRoutes = require("./routes/reservations");
const reportsRoutes = require("./routes/reports");
const settingsRoutes = require("./routes/settings");


// =========================================================
// EXPRESS APP
// =========================================================

const app = express();


// =========================================================
// MIDDLEWARE
// =========================================================

app.use(cors());

app.use(express.json());


// =========================================================
// API ROUTES
// =========================================================

app.use("/api/books", booksRoutes);

app.use("/api/members", membersRoutes);

app.use("/api/issues", issuesRoutes);

app.use("/api/returns", returnsRoutes);

app.use("/api/reservations", reservationsRoutes);

app.use("/api/reports", reportsRoutes);

app.use("/api/settings", settingsRoutes);


// =========================================================
// HEALTH CHECK
// =========================================================

app.get("/api/health", async (req, res) => {

    try {

        const [result] = await pool.query(
            "SELECT 1 AS connected"
        );


        res.json({

            success: true,

            message:
                "Libraria backend is connected to MySQL",

            database:
                process.env.DB_NAME,

            mysql:
                result[0].connected === 1

        });


    } catch (error) {

        console.error(
            "Database Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Database connection failed",

            error:
                error.message

        });

    }

});


// =========================================================
// ROOT API
// =========================================================

app.get("/", (req, res) => {

    res.json({

        success: true,

        message:
            "Welcome to Libraria Library Management API",

        version:
            "1.0.0",

        status:
            "running"

    });

});


// =========================================================
// 404 HANDLER
// =========================================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        message:
            `Route not found: ${req.method} ${req.originalUrl}`

    });

});


// =========================================================
// GLOBAL ERROR HANDLER
// =========================================================

app.use((err, req, res, next) => {

    console.error(
        "SERVER ERROR:",
        err
    );


    res.status(500).json({

        success: false,

        message:
            "Internal server error",

        error:
            err.message

    });

});


// =========================================================
// SERVER
// =========================================================

const PORT =
    process.env.PORT || 5000;


app.listen(
    PORT,
    () => {

        console.log(`
========================================
       LIBRARIA BACKEND SERVER
========================================

Server running:
http://localhost:${PORT}

Health Check:
http://localhost:${PORT}/api/health

Database:
${process.env.DB_NAME}

Settings API:
http://localhost:${PORT}/api/settings

========================================
        `);

    }
);