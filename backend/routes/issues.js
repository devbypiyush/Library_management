const express = require("express");
const router = express.Router();

const mysql = require("mysql2/promise");
require("dotenv").config();

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
   GET ALL ISSUES
   ========================================================= */

router.get("/", async (req, res) => {

    try {

        const [rows] = await pool.query(`

            SELECT
                i.id,
                i.book_id,
                i.member_id,

                i.issue_date,
                i.due_date,
                i.return_date,

                i.status,
                i.fine,

                b.title AS book_title,
                b.author AS author,
                b.isbn AS isbn,

                m.member_code AS member_code,
                m.name AS member_name,
                m.email AS member_email

            FROM issues i

            INNER JOIN books b
                ON i.book_id = b.id

            INNER JOIN members m
                ON i.member_id = m.id

            ORDER BY i.id DESC

        `);

        res.json(rows);

    } catch (error) {

        console.error("GET ISSUES ERROR:", error);

        res.status(500).json({

            success: false,

            message: "Failed to load issue transactions",

            error: error.message

        });

    }

});


/* =========================================================
   GET SINGLE ISSUE
   ========================================================= */

router.get("/:id", async (req, res) => {

    try {

        const { id } = req.params;


        const [rows] = await pool.query(`

            SELECT
                i.*,

                b.title AS book_title,
                b.author AS author,
                b.isbn AS isbn,

                m.member_code AS member_code,
                m.name AS member_name,
                m.email AS member_email

            FROM issues i

            INNER JOIN books b
                ON i.book_id = b.id

            INNER JOIN members m
                ON i.member_id = m.id

            WHERE i.id = ?

        `, [id]);


        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Issue transaction not found"

            });

        }


        res.json(rows[0]);


    } catch (error) {

        console.error("GET ISSUE ERROR:", error);

        res.status(500).json({

            success: false,

            message: "Failed to load issue",

            error: error.message

        });

    }

});


/* =========================================================
   ISSUE BOOK
   ========================================================= */

router.post("/", async (req, res) => {

    const connection =
        await pool.getConnection();


    try {

        const {
            book_id,
            member_id,
            issue_date,
            due_date
        } = req.body;


        /* =========================
           VALIDATION
        ========================= */

        if (
            !book_id ||
            !member_id ||
            !issue_date ||
            !due_date
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Book, member, issue date and due date are required"

            });

        }


        if (due_date <= issue_date) {

            return res.status(400).json({

                success: false,

                message:
                    "Due date must be after issue date"

            });

        }


        await connection.beginTransaction();


        /* =========================
           CHECK MEMBER
        ========================= */

        const [memberRows] =
            await connection.query(`

                SELECT
                    id,
                    name,
                    member_code,
                    membership_status,
                    issue_limit

                FROM members

                WHERE id = ?

                FOR UPDATE

            `, [book_id ? member_id : member_id]);


        if (memberRows.length === 0) {

            await connection.rollback();

            return res.status(404).json({

                success: false,

                message: "Member not found"

            });

        }


        const member =
            memberRows[0];


        /* =========================
           MEMBER STATUS
        ========================= */

        if (
            member.membership_status !== "Active"
        ) {

            await connection.rollback();

            return res.status(400).json({

                success: false,

                message:
                    "Member membership is not active"

            });

        }


        /* =========================
           CHECK MEMBER ISSUE LIMIT
        ========================= */

        const [memberIssueRows] =
            await connection.query(`

                SELECT COUNT(*) AS issue_count

                FROM issues

                WHERE member_id = ?

                AND status IN ('Issued', 'Overdue')

            `, [member_id]);


        const currentIssues =
            Number(memberIssueRows[0].issue_count);


        const issueLimit =
            Number(member.issue_limit || 3);


        if (currentIssues >= issueLimit) {

            await connection.rollback();

            return res.status(400).json({

                success: false,

                message:
                    `Member has reached the issue limit of ${issueLimit} books`

            });

        }


        /* =========================
           CHECK BOOK
        ========================= */

        const [bookRows] =
            await connection.query(`

                SELECT
                    id,
                    title,
                    author,
                    available_copies,
                    total_copies

                FROM books

                WHERE id = ?

                FOR UPDATE

            `, [book_id]);


        if (bookRows.length === 0) {

            await connection.rollback();

            return res.status(404).json({

                success: false,

                message: "Book not found"

            });

        }


        const book =
            bookRows[0];


        /* =========================
           CHECK AVAILABILITY
        ========================= */

        if (
            Number(book.available_copies) <= 0
        ) {

            await connection.rollback();

            return res.status(400).json({

                success: false,

                message:
                    "No available copies of this book"

            });

        }


        /* =========================
           CREATE ISSUE
        ========================= */

        const [issueResult] =
            await connection.query(`

                INSERT INTO issues
                (
                    book_id,
                    member_id,
                    issue_date,
                    due_date,
                    status,
                    fine
                )

                VALUES
                (?, ?, ?, ?, 'Issued', 0)

            `, [
                book_id,
                member_id,
                issue_date,
                due_date
            ]);


        const issueId =
            issueResult.insertId;


        /* =========================
           DECREASE AVAILABLE COPIES
        ========================= */

        await connection.query(`

            UPDATE books

            SET available_copies =
                available_copies - 1

            WHERE id = ?

        `, [book_id]);


        await connection.commit();


        /* =========================
           SUCCESS RESPONSE
        ========================= */

        res.status(201).json({

            success: true,

            message: "Book issued successfully",

            issue: {

                id: issueId,

                book_id: Number(book_id),

                member_id: Number(member_id),

                issue_date: issue_date,

                due_date: due_date,

                status: "Issued",

                fine: 0

            }

        });


    } catch (error) {

        await connection.rollback();

        console.error(
            "ISSUE BOOK ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to issue book",

            error:
                error.message

        });


    } finally {

        connection.release();

    }

});


module.exports = router;