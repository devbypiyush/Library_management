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
   GET ALL MEMBERS
   ========================================================= */

router.get("/", async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                m.id,
                m.member_code,
                m.name,
                m.email,
                m.phone,
                m.membership_type,
                m.membership_status,
                m.joined_date,
                m.expiry_date,
                m.issue_limit,

                COUNT(
                    CASE
                        WHEN i.status IN ('Issued', 'Overdue')
                        THEN i.id
                    END
                ) AS issue_count,

                COUNT(
                    CASE
                        WHEN i.status = 'Overdue'
                        THEN i.id
                    END
                ) AS overdue_count

            FROM members m

            LEFT JOIN issues i
                ON m.id = i.member_id

            GROUP BY
                m.id,
                m.member_code,
                m.name,
                m.email,
                m.phone,
                m.membership_type,
                m.membership_status,
                m.joined_date,
                m.expiry_date,
                m.issue_limit

            ORDER BY m.id DESC
        `);

        res.json(rows);

    } catch (error) {

        console.error("GET MEMBERS ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load members.",
            error: error.message
        });

    }

});


/* =========================================================
   GET MEMBER BY ID
   ========================================================= */

router.get("/:id", async (req, res) => {

    try {

        const [rows] = await pool.query(
            `SELECT * FROM members WHERE id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: "Member not found."
            });

        }

        res.json(rows[0]);

    } catch (error) {

        console.error("GET MEMBER ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load member.",
            error: error.message
        });

    }

});


/* =========================================================
   ADD MEMBER
   ========================================================= */

router.post("/", async (req, res) => {

    try {

        const {
            member_code,
            name,
            email,
            phone,
            membership_type,
            membership_status,
            joined_date,
            expiry_date,
            issue_limit
        } = req.body;


        if (!member_code || !name || !email || !joined_date || !expiry_date) {

            return res.status(400).json({
                success: false,
                message: "Required member fields are missing."
            });

        }


        const [result] = await pool.query(

            `INSERT INTO members
            (
                member_code,
                name,
                email,
                phone,
                membership_type,
                membership_status,
                joined_date,
                expiry_date,
                issue_limit
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,

            [
                member_code,
                name,
                email,
                phone || null,
                membership_type || "Student",
                membership_status || "Active",
                joined_date,
                expiry_date,
                issue_limit || 3
            ]

        );


        res.status(201).json({

            success: true,
            message: "Member added successfully.",
            id: result.insertId

        });

    } catch (error) {

        console.error("ADD MEMBER ERROR:", error);


        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({

                success: false,
                message: "Member ID or email already exists."

            });

        }


        res.status(500).json({

            success: false,
            message: "Unable to add member.",
            error: error.message

        });

    }

});


/* =========================================================
   UPDATE MEMBER
   ========================================================= */

router.put("/:id", async (req, res) => {

    try {

        const {
            member_code,
            name,
            email,
            phone,
            membership_type,
            membership_status,
            joined_date,
            expiry_date,
            issue_limit
        } = req.body;


        const [result] = await pool.query(

            `UPDATE members

             SET
                member_code = ?,
                name = ?,
                email = ?,
                phone = ?,
                membership_type = ?,
                membership_status = ?,
                joined_date = ?,
                expiry_date = ?,
                issue_limit = ?

             WHERE id = ?`,

            [
                member_code,
                name,
                email,
                phone || null,
                membership_type,
                membership_status,
                joined_date,
                expiry_date,
                issue_limit,
                req.params.id
            ]

        );


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,
                message: "Member not found."

            });

        }


        res.json({

            success: true,
            message: "Member updated successfully."

        });

    } catch (error) {

        console.error("UPDATE MEMBER ERROR:", error);


        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({

                success: false,
                message: "Member ID or email already exists."

            });

        }


        res.status(500).json({

            success: false,
            message: "Unable to update member.",
            error: error.message

        });

    }

});


/* =========================================================
   DELETE MEMBER
   ========================================================= */

router.delete("/:id", async (req, res) => {

    try {

        /* Check for active issues */

        const [activeIssues] = await pool.query(

            `SELECT COUNT(*) AS count
             FROM issues
             WHERE member_id = ?
             AND status IN ('Issued', 'Overdue')`,

            [req.params.id]

        );


        if (Number(activeIssues[0].count) > 0) {

            return res.status(400).json({

                success: false,
                message: "Cannot delete member with active or overdue books."

            });

        }


        const [result] = await pool.query(

            `DELETE FROM members WHERE id = ?`,

            [req.params.id]

        );


        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,
                message: "Member not found."

            });

        }


        res.json({

            success: true,
            message: "Member deleted successfully."

        });

    } catch (error) {

        console.error("DELETE MEMBER ERROR:", error);


        res.status(500).json({

            success: false,
            message: "Unable to delete member.",
            error: error.message

        });

    }

});


module.exports = router;