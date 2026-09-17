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
   GET ALL RESERVATIONS
   GET /api/reservations
========================================================= */

router.get("/", async (req, res) => {

    try {

        const [rows] = await pool.query(`

            SELECT
                r.id,
                r.book_id,
                r.member_id,

                r.reservation_date,
                r.expiry_date,
                r.status,
                r.created_at,

                b.title AS book_title,
                b.author,
                b.isbn,
                b.category,
                b.available_copies,

                m.member_code,
                m.name AS member_name,
                m.email,
                m.phone,
                m.membership_type,
                m.membership_status

            FROM reservations r

            INNER JOIN books b
                ON r.book_id = b.id

            INNER JOIN members m
                ON r.member_id = m.id

            ORDER BY
                r.id DESC

        `);


        /*
           Automatically mark expired pending
           reservations as Expired.
        */

        const today =
            new Date()
                .toISOString()
                .split("T")[0];


        for (const reservation of rows) {

            if (
                reservation.status === "Pending" &&
                reservation.expiry_date &&
                formatDate(reservation.expiry_date) < today
            ) {

                await pool.query(
                    `
                    UPDATE reservations
                    SET status = 'Expired'
                    WHERE id = ?
                    `,
                    [reservation.id]
                );


                reservation.status =
                    "Expired";

            }

        }


        res.json(rows);

    } catch (error) {

        console.error(
            "Get Reservations Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch reservations.",

            error:
                error.message

        });

    }

});


/* =========================================================
   GET SINGLE RESERVATION
   GET /api/reservations/:id
========================================================= */

router.get("/:id", async (req, res) => {

    try {

        const { id } = req.params;


        const [rows] = await pool.query(`

            SELECT
                r.id,
                r.book_id,
                r.member_id,

                r.reservation_date,
                r.expiry_date,
                r.status,
                r.created_at,

                b.title AS book_title,
                b.author,
                b.isbn,
                b.category,
                b.available_copies,

                m.member_code,
                m.name AS member_name,
                m.email,
                m.phone,
                m.membership_type,
                m.membership_status

            FROM reservations r

            INNER JOIN books b
                ON r.book_id = b.id

            INNER JOIN members m
                ON r.member_id = m.id

            WHERE r.id = ?

        `, [id]);


        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Reservation not found."

            });

        }


        res.json(rows[0]);

    } catch (error) {

        console.error(
            "Get Reservation Error:",
            error
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch reservation.",

            error:
                error.message

        });

    }

});


/* =========================================================
   CREATE RESERVATION
   POST /api/reservations
========================================================= */

router.post("/", async (req, res) => {

    const connection =
        await pool.getConnection();


    try {

        const {
            book_id,
            member_id,
            reservation_date,
            expiry_date
        } = req.body;


        /* -----------------------------------------
           BASIC VALIDATION
        ----------------------------------------- */

        if (
            !book_id ||
            !member_id ||
            !reservation_date ||
            !expiry_date
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Book, member, reservation date and expiry date are required."

            });

        }


        /* -----------------------------------------
           DATE VALIDATION
        ----------------------------------------- */

        if (
            new Date(expiry_date) <
            new Date(reservation_date)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Expiry date cannot be before reservation date."

            });

        }


        await connection.beginTransaction();


        /* -----------------------------------------
           CHECK MEMBER
        ----------------------------------------- */

        const [memberRows] =
            await connection.query(
                `
                SELECT
                    id,
                    name,
                    member_code,
                    membership_status,
                    issue_limit

                FROM members

                WHERE id = ?

                FOR UPDATE
                `,
                [member_id]
            );


        if (memberRows.length === 0) {

            await connection.rollback();

            return res.status(404).json({

                success: false,

                message:
                    "Member not found."

            });

        }


        const member =
            memberRows[0];


        /* -----------------------------------------
           MEMBER STATUS
        ----------------------------------------- */

        if (
            member.membership_status !==
            "Active"
        ) {

            await connection.rollback();

            return res.status(400).json({

                success: false,

                message:
                    "Only active members can make reservations."

            });

        }


        /* -----------------------------------------
           CHECK BOOK
        ----------------------------------------- */

        const [bookRows] =
            await connection.query(
                `
                SELECT
                    id,
                    title,
                    author,
                    available_copies

                FROM books

                WHERE id = ?

                FOR UPDATE
                `,
                [book_id]
            );


        if (bookRows.length === 0) {

            await connection.rollback();

            return res.status(404).json({

                success: false,

                message:
                    "Book not found."

            });

        }


        const book =
            bookRows[0];


        /* -----------------------------------------
           CHECK DUPLICATE PENDING RESERVATION
        ----------------------------------------- */

        const [duplicateRows] =
            await connection.query(
                `
                SELECT id

                FROM reservations

                WHERE book_id = ?

                AND member_id = ?

                AND status = 'Pending'

                LIMIT 1
                `,
                [
                    book_id,
                    member_id
                ]
            );


        if (duplicateRows.length > 0) {

            await connection.rollback();

            return res.status(409).json({

                success: false,

                message:
                    "This member already has a pending reservation for this book."

            });

        }


        /* -----------------------------------------
           INSERT RESERVATION
        ----------------------------------------- */

        const [result] =
            await connection.query(
                `
                INSERT INTO reservations
                (
                    book_id,
                    member_id,
                    reservation_date,
                    expiry_date,
                    status
                )

                VALUES
                (
                    ?,
                    ?,
                    ?,
                    ?,
                    'Pending'
                )
                `,
                [
                    book_id,
                    member_id,
                    reservation_date,
                    expiry_date
                ]
            );


        await connection.commit();


        res.status(201).json({

            success: true,

            message:
                "Reservation created successfully.",

            reservation_id:
                result.insertId,

            reservation: {

                id:
                    result.insertId,

                book_id:
                    book_id,

                member_id:
                    member_id,

                reservation_date:
                    reservation_date,

                expiry_date:
                    expiry_date,

                status:
                    "Pending"

            }

        });

    } catch (error) {

        await connection.rollback();


        console.error(
            "Create Reservation Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to create reservation.",

            error:
                error.message

        });

    } finally {

        connection.release();

    }

});


/* =========================================================
   UPDATE RESERVATION STATUS
   PUT /api/reservations/:id/status
========================================================= */

router.put("/:id/status", async (req, res) => {

    try {

        const { id } =
            req.params;

        const { status } =
            req.body;


        /* -----------------------------------------
           VALID STATUS VALUES
        ----------------------------------------- */

        const allowedStatuses = [
            "Pending",
            "Fulfilled",
            "Cancelled",
            "Expired"
        ];


        if (
            !allowedStatuses.includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid reservation status."

            });

        }


        /* -----------------------------------------
           CHECK RESERVATION
        ----------------------------------------- */

        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    status

                FROM reservations

                WHERE id = ?
                `,
                [id]
            );


        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Reservation not found."

            });

        }


        /* -----------------------------------------
           PREVENT CHANGING COMPLETED RESERVATION
        ----------------------------------------- */

        if (
            (
                rows[0].status === "Cancelled" ||
                rows[0].status === "Expired"
            ) &&
            status !== rows[0].status
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Reservation is already ${rows[0].status}.`

            });

        }


        /* -----------------------------------------
           UPDATE
        ----------------------------------------- */

        await pool.query(
            `
            UPDATE reservations

            SET status = ?

            WHERE id = ?
            `,
            [
                status,
                id
            ]
        );


        res.json({

            success: true,

            message:
                "Reservation status updated successfully.",

            id:
                Number(id),

            status:
                status

        });

    } catch (error) {

        console.error(
            "Update Reservation Status Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to update reservation status.",

            error:
                error.message

        });

    }

});


/* =========================================================
   DELETE RESERVATION
   DELETE /api/reservations/:id
========================================================= */

router.delete("/:id", async (req, res) => {

    try {

        const { id } =
            req.params;


        const [rows] =
            await pool.query(
                `
                SELECT
                    id,
                    status

                FROM reservations

                WHERE id = ?
                `,
                [id]
            );


        if (rows.length === 0) {

            return res.status(404).json({

                success: false,

                message:
                    "Reservation not found."

            });

        }


        await pool.query(
            `
            DELETE FROM reservations

            WHERE id = ?
            `,
            [id]
        );


        res.json({

            success: true,

            message:
                "Reservation deleted successfully."

        });

    } catch (error) {

        console.error(
            "Delete Reservation Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to delete reservation.",

            error:
                error.message

        });

    }

});


/* =========================================================
   DATE HELPER
========================================================= */

function formatDate(value) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


/* =========================================================
   EXPORT ROUTER
========================================================= */

module.exports = router;