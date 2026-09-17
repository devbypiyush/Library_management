const express = require("express");
const mysql = require("mysql2/promise");
require("dotenv").config();

const router = express.Router();

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


// GET ALL BOOKS
router.get("/", async (req, res) => {

    try {

        const [books] = await pool.query(
            "SELECT * FROM books ORDER BY id DESC"
        );

        res.json({
            success: true,
            count: books.length,
            data: books
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch books",
            error: error.message
        });

    }

});


// GET BOOK BY ID
router.get("/:id", async (req, res) => {

    try {

        const [books] = await pool.query(
            "SELECT * FROM books WHERE id = ?",
            [req.params.id]
        );

        if (books.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Book not found"
            });

        }

        res.json({
            success: true,
            data: books[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch book",
            error: error.message
        });

    }

});


// ADD BOOK
router.post("/", async (req, res) => {

    try {

        const {
            title,
            author,
            isbn,
            category,
            total_copies
        } = req.body;

        if (
            !title ||
            !author ||
            !isbn ||
            !category ||
            total_copies === undefined
        ) {

            return res.status(400).json({
                success: false,
                message: "All book fields are required"
            });

        }

        const copies = Number(total_copies);

        if (!Number.isInteger(copies) || copies < 1) {

            return res.status(400).json({
                success: false,
                message: "Total copies must be a positive integer"
            });

        }

        const [result] = await pool.query(

            `INSERT INTO books
            (title, author, isbn, category, total_copies, available_copies)
            VALUES (?, ?, ?, ?, ?, ?)`,

            [
                title,
                author,
                isbn,
                category,
                copies,
                copies
            ]

        );

        const [book] = await pool.query(
            "SELECT * FROM books WHERE id = ?",
            [result.insertId]
        );

        res.status(201).json({

            success: true,
            message: "Book added successfully",
            data: book[0]

        });

    } catch (error) {

        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                success: false,
                message: "ISBN already exists"
            });

        }

        res.status(500).json({

            success: false,
            message: "Failed to add book",
            error: error.message

        });

    }

});


// UPDATE BOOK
router.put("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            title,
            author,
            isbn,
            category,
            total_copies
        } = req.body;

        const [existing] = await pool.query(
            "SELECT * FROM books WHERE id = ?",
            [id]
        );

        if (existing.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Book not found"
            });

        }

        const oldBook = existing[0];

        const newTotal =
            total_copies !== undefined
                ? Number(total_copies)
                : oldBook.total_copies;

        const issuedCopies =
            oldBook.total_copies -
            oldBook.available_copies;

        if (newTotal < issuedCopies) {

            return res.status(400).json({
                success: false,
                message:
                    `Cannot reduce copies below currently issued copies (${issuedCopies})`
            });

        }

        const newAvailable =
            newTotal - issuedCopies;

        await pool.query(

            `UPDATE books
             SET title = ?,
                 author = ?,
                 isbn = ?,
                 category = ?,
                 total_copies = ?,
                 available_copies = ?
             WHERE id = ?`,

            [
                title || oldBook.title,
                author || oldBook.author,
                isbn || oldBook.isbn,
                category || oldBook.category,
                newTotal,
                newAvailable,
                id
            ]

        );

        const [updated] = await pool.query(
            "SELECT * FROM books WHERE id = ?",
            [id]
        );

        res.json({

            success: true,
            message: "Book updated successfully",
            data: updated[0]

        });

    } catch (error) {

        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                success: false,
                message: "ISBN already exists"
            });

        }

        res.status(500).json({

            success: false,
            message: "Failed to update book",
            error: error.message

        });

    }

});


// DELETE BOOK
router.delete("/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const [activeIssues] = await pool.query(

            `SELECT id
             FROM issues
             WHERE book_id = ?
             AND status IN ('Issued', 'Overdue')
             LIMIT 1`,

            [id]

        );

        if (activeIssues.length > 0) {

            return res.status(400).json({

                success: false,
                message:
                    "Cannot delete book because it is currently issued"

            });

        }

        const [result] = await pool.query(

            "DELETE FROM books WHERE id = ?",
            [id]

        );

        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,
                message: "Book not found"

            });

        }

        res.json({

            success: true,
            message: "Book deleted successfully"

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,
            message: "Failed to delete book",
            error: error.message

        });

    }

});


module.exports = router;