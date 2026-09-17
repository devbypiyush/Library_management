const express = require("express");
const router = express.Router();

const mysql = require("mysql2/promise");
require("dotenv").config();

/* =========================================================
   DATABASE CONNECTION
   ========================================================= */

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


/* =========================================================
   GET ALL RETURNS
   ========================================================= */

router.get("/", async (req, res) => {

    try {

        const [rows] = await pool.query(`

            SELECT

                r.id AS return_id,
                r.issue_id,
                r.return_date,
                r.late_days,
                r.fine,

                i.book_id,
                i.member_id,
                i.issue_date,
                i.due_date,
                i.status,

                b.title AS book_title,
                b.author AS author,
                b.isbn AS isbn,

                m.member_code AS member_code,
                m.name AS member_name,
                m.email AS member_email

            FROM returns_log r

            INNER JOIN issues i
                ON r.issue_id = i.id

            INNER JOIN books b
                ON i.book_id = b.id

            INNER JOIN members m
                ON i.member_id = m.id

            ORDER BY r.id DESC

        `);


        res.json(rows);

    } catch (error) {

        console.error(
            "GET RETURNS ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to load return transactions",

            error:
                error.message

        });

    }

});


/* =========================================================
   GET SINGLE RETURN
   ========================================================= */

router.get("/:id", async (req, res) => {

    try {

        const { id } = req.params;


        const [rows] = await pool.query(`

            SELECT

                r.id AS return_id,
                r.issue_id,
                r.return_date,
                r.late_days,
                r.fine,

                i.book_id,
                i.member_id,
                i.issue_date,
                i.due_date,
                i.status,

                b.title AS book_title,
                b.author AS author,
                b.isbn AS isbn,

                m.member_code AS member_code,
                m.name AS member_name,
                m.email AS member_email

            FROM returns_log r

            INNER JOIN issues i
                ON r.issue_id = i.id

            INNER JOIN books b
                ON i.book_id = b.id

            INNER JOIN members m
                ON i.member_id = m.id

            WHERE r.id = ?

        `, [id]);


        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Return transaction not found"

            });

        }


        res.json(rows[0]);

    } catch (error) {

        console.error(
            "GET RETURN ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to load return transaction",

            error:
                error.message

        });

    }

});


/* =========================================================
   RETURN BOOK
   ========================================================= */

router.post("/", async (req, res) => {

    const connection =
        await pool.getConnection();


    try {

        const {
            issue_id,
            return_date
        } = req.body;


        /* =================================================
           VALIDATION
        ================================================= */

        if (!issue_id) {

            return res.status(400).json({

                success: false,

                message:
                    "Issue ID is required"

            });

        }


        const actualReturnDate =
            return_date ||
            new Date()
                .toISOString()
                .split("T")[0];


        await connection.beginTransaction();


        /* =================================================
           GET ISSUE
        ================================================= */

        const [issueRows] =
            await connection.query(`

                SELECT

                    i.id,
                    i.book_id,
                    i.member_id,
                    i.issue_date,
                    i.due_date,
                    i.return_date,
                    i.status,
                    i.fine

                FROM issues i

                WHERE i.id = ?

                FOR UPDATE

            `, [issue_id]);


        if (issueRows.length === 0) {

            await connection.rollback();


            return res.status(404).json({

                success: false,

                message:
                    "Issue transaction not found"

            });

        }


        const issue =
            issueRows[0];


        /* =================================================
           CHECK ALREADY RETURNED
        ================================================= */

        if (
            issue.status === "Returned"
        ) {

            await connection.rollback();


            return res.status(400).json({

                success: false,

                message:
                    "This book has already been returned"

            });

        }


        /* =================================================
           VALIDATE RETURN DATE
        ================================================= */

        if (
            actualReturnDate <
            String(issue.issue_date).substring(0, 10)
        ) {

            await connection.rollback();


            return res.status(400).json({

                success: false,

                message:
                    "Return date cannot be before issue date"

            });

        }


        /* =================================================
           CALCULATE LATE DAYS
        ================================================= */

        const dueDate =
            new Date(
                String(issue.due_date)
                    .substring(0, 10)
            );


        const returnDate =
            new Date(
                actualReturnDate
            );


        dueDate.setHours(
            0, 0, 0, 0
        );


        returnDate.setHours(
            0, 0, 0, 0
        );


        let lateDays = 0;


        if (
            returnDate >
            dueDate
        ) {

            const difference =
                returnDate.getTime() -
                dueDate.getTime();


            lateDays =
                Math.floor(
                    difference /
                    (1000 * 60 * 60 * 24)
                );

        }


        /* =================================================
           CALCULATE FINE
           ₹10 PER LATE DAY
        ================================================= */

        const fine =
            lateDays * 10;


        /* =================================================
           INSERT RETURN LOG
        ================================================= */

        const [returnResult] =
            await connection.query(`

                INSERT INTO returns_log
                (
                    issue_id,
                    return_date,
                    late_days,
                    fine
                )

                VALUES
                (?, ?, ?, ?)

            `, [
                issue_id,
                actualReturnDate,
                lateDays,
                fine
            ]);


        /* =================================================
           UPDATE ISSUE
        ================================================= */

        await connection.query(`

            UPDATE issues

            SET

                return_date = ?,

                status = 'Returned',

                fine = ?

            WHERE id = ?

        `, [
            actualReturnDate,
            fine,
            issue_id
        ]);


        /* =================================================
           INCREASE AVAILABLE BOOKS
        ================================================= */

        await connection.query(`

            UPDATE books

            SET available_copies =
                available_copies + 1

            WHERE id = ?

        `, [
            issue.book_id
        ]);


        /* =================================================
           COMMIT TRANSACTION
        ================================================= */

        await connection.commit();


        /* =================================================
           SUCCESS
        ================================================= */

        res.status(201).json({

            success: true,

            message:
                "Book returned successfully",

            return: {

                id:
                    returnResult.insertId,

                issue_id:
                    Number(issue_id),

                return_date:
                    actualReturnDate,

                late_days:
                    lateDays,

                fine:
                    fine

            }

        });


    } catch (error) {

        await connection.rollback();


        console.error(
            "RETURN BOOK ERROR:",
            error
        );


        /*
           Duplicate return protection.
           returns_log.issue_id is UNIQUE.
        */

        if (
            error.code ===
            "ER_DUP_ENTRY"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "This issue transaction has already been returned"

            });

        }


        res.status(500).json({

            success: false,

            message:
                "Failed to return book",

            error:
                error.message

        });


    } finally {

        connection.release();

    }

});


module.exports = router;