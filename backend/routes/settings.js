const express = require("express");
const router = express.Router();

const pool = require("../db");


// =========================================================
// GET SETTINGS
// =========================================================

router.get("/", async (req, res) => {

    try {

        const [rows] = await pool.query(
            "SELECT * FROM settings WHERE id = 1"
        );


        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Settings record not found."
            });

        }


        res.status(200).json({
            success: true,
            settings: rows[0]
        });


    } catch (error) {

        console.error(
            "GET SETTINGS ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to fetch settings.",

            error:
                error.message

        });

    }

});


// =========================================================
// UPDATE SETTINGS
// =========================================================

router.put("/", async (req, res) => {

    try {

        console.log(
            "SETTINGS UPDATE REQUEST:"
        );

        console.log(
            req.body
        );


        const {

            library_name,
            library_email,
            library_phone,
            library_website,
            library_address,

            issue_period,
            max_books_per_member,
            fine_per_day,
            reservation_period,

            due_reminder,
            overdue_notification,
            reservation_notification,
            member_notification

        } = req.body;


        // =================================================
        // VALIDATION
        // =================================================

        if (
            !library_name ||
            library_name.trim() === ""
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Library name is required."

            });

        }


        if (
            Number(issue_period) < 1
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Issue period must be at least 1 day."

            });

        }


        if (
            Number(max_books_per_member) < 1
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Maximum books must be at least 1."

            });

        }


        if (
            Number(fine_per_day) < 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Fine cannot be negative."

            });

        }


        if (
            Number(reservation_period) < 1
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Reservation period must be at least 1 day."

            });

        }


        // =================================================
        // MAKE SURE SETTINGS ROW EXISTS
        // =================================================

        await pool.query(

            `
            INSERT INTO settings (
                id,
                library_name,
                library_email,
                library_phone,
                library_website,
                library_address,
                issue_period,
                max_books_per_member,
                fine_per_day,
                reservation_period,
                due_reminder,
                overdue_notification,
                reservation_notification,
                member_notification
            )

            VALUES (
                1,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )

            ON DUPLICATE KEY UPDATE
                id = id
            `,

            [

                library_name.trim(),

                library_email || null,

                library_phone || null,

                library_website || null,

                library_address || null,

                Number(issue_period),

                Number(max_books_per_member),

                Number(fine_per_day),

                Number(reservation_period),

                Boolean(due_reminder),

                Boolean(overdue_notification),

                Boolean(reservation_notification),

                Boolean(member_notification)

            ]

        );


        // =================================================
        // UPDATE SETTINGS
        // =================================================

        const [result] =
            await pool.query(

                `
                UPDATE settings

                SET

                    library_name = ?,

                    library_email = ?,

                    library_phone = ?,

                    library_website = ?,

                    library_address = ?,

                    issue_period = ?,

                    max_books_per_member = ?,

                    fine_per_day = ?,

                    reservation_period = ?,

                    due_reminder = ?,

                    overdue_notification = ?,

                    reservation_notification = ?,

                    member_notification = ?

                WHERE id = 1
                `,

                [

                    library_name.trim(),

                    library_email || null,

                    library_phone || null,

                    library_website || null,

                    library_address || null,

                    Number(issue_period),

                    Number(max_books_per_member),

                    Number(fine_per_day),

                    Number(reservation_period),

                    Boolean(due_reminder),

                    Boolean(overdue_notification),

                    Boolean(reservation_notification),

                    Boolean(member_notification)

                ]

            );


        console.log(
            "SETTINGS UPDATED:",
            result.affectedRows
        );


        // =================================================
        // GET UPDATED RECORD
        // =================================================

        const [rows] =
            await pool.query(

                "SELECT * FROM settings WHERE id = 1"

            );


        // =================================================
        // RESPONSE
        // =================================================

        res.status(200).json({

            success: true,

            message:
                "Settings updated successfully.",

            settings:
                rows[0]

        });


    } catch (error) {

        console.error(
            "UPDATE SETTINGS ERROR:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to update settings.",

            error:
                error.message

        });

    }

});


module.exports = router;