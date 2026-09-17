const express = require("express");
const router = express.Router();
const pool = require("../db");


/* =========================================================
   GET REPORT OVERVIEW
   ========================================================= */

router.get("/overview", async (req, res) => {

    try {

        const [[books]] = await pool.query(`
            SELECT
                COUNT(*) AS titles,
                COALESCE(SUM(total_copies), 0) AS total_copies,
                COALESCE(SUM(available_copies), 0) AS available_copies,
                COALESCE(
                    SUM(total_copies - available_copies),
                    0
                ) AS issued_copies
            FROM books
        `);


        const [[members]] = await pool.query(`
            SELECT
                COUNT(*) AS total_members,
                SUM(
                    membership_status = 'Active'
                ) AS active_members,
                SUM(
                    membership_status = 'Suspended'
                ) AS suspended_members,
                SUM(
                    membership_status = 'Expired'
                ) AS expired_members
            FROM members
        `);


        const [[issues]] = await pool.query(`
            SELECT
                COUNT(*) AS total_issues,
                SUM(status = 'Issued') AS issued,
                SUM(status = 'Returned') AS returned,
                SUM(status = 'Overdue') AS overdue
            FROM issues
        `);


        const [[fines]] = await pool.query(`
            SELECT
                COALESCE(SUM(fine), 0) AS total_fines,
                COUNT(
                    CASE
                        WHEN fine > 0 THEN 1
                    END
                ) AS fined_returns
            FROM returns_log
        `);


        res.json({
            success: true,
            data: {
                books,
                members,
                issues,
                fines
            }
        });

    } catch (error) {

        console.error(
            "Overview report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to generate overview report."
        });

    }

});


/* =========================================================
   GET BOOK REPORT
   ========================================================= */

router.get("/books", async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                id,
                title,
                author,
                isbn,
                category,
                total_copies,
                available_copies,
                (
                    total_copies - available_copies
                ) AS issued_copies,
                CASE
                    WHEN available_copies = 0
                        THEN 'Unavailable'
                    WHEN available_copies <=
                         total_copies * 0.25
                        THEN 'Low Stock'
                    ELSE 'Available'
                END AS availability_status
            FROM books
            ORDER BY title ASC
        `);


        res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(
            "Book report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to generate book report."
        });

    }

});


/* =========================================================
   GET CATEGORY REPORT
   ========================================================= */

router.get("/categories", async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                category,
                COUNT(*) AS title_count,
                COALESCE(
                    SUM(total_copies),
                    0
                ) AS total_copies,
                COALESCE(
                    SUM(available_copies),
                    0
                ) AS available_copies,
                COALESCE(
                    SUM(
                        total_copies -
                        available_copies
                    ),
                    0
                ) AS issued_copies
            FROM books
            GROUP BY category
            ORDER BY total_copies DESC
        `);


        res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(
            "Category report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to generate category report."
        });

    }

});


/* =========================================================
   GET ISSUE REPORT
   ========================================================= */

router.get("/issues", async (req, res) => {

    try {

        const {
            from,
            to,
            status
        } = req.query;


        let sql = `
            SELECT
                i.id,
                i.book_id,
                i.member_id,
                b.title AS book_title,
                b.author,
                m.name AS member_name,
                m.member_code,
                m.membership_type,
                i.issue_date,
                i.due_date,
                i.return_date,
                i.status,
                i.fine
            FROM issues i

            INNER JOIN books b
                ON i.book_id = b.id

            INNER JOIN members m
                ON i.member_id = m.id

            WHERE 1 = 1
        `;


        const params = [];


        if (from) {

            sql += `
                AND i.issue_date >= ?
            `;

            params.push(from);

        }


        if (to) {

            sql += `
                AND i.issue_date <= ?
            `;

            params.push(to);

        }


        if (
            status &&
            status !== "all"
        ) {

            sql += `
                AND i.status = ?
            `;

            params.push(status);

        }


        sql += `
            ORDER BY i.issue_date DESC,
                     i.id DESC
        `;


        const [rows] =
            await pool.query(
                sql,
                params
            );


        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {

        console.error(
            "Issue report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to generate issue report."
        });

    }

});


/* =========================================================
   GET RETURN REPORT
   ========================================================= */

router.get("/returns", async (req, res) => {

    try {

        const {
            from,
            to
        } = req.query;


        let sql = `
            SELECT
                r.id,
                r.issue_id,
                r.return_date,
                r.late_days,
                r.fine,

                i.book_id,
                i.member_id,

                b.title AS book_title,
                b.author,

                m.name AS member_name,
                m.member_code

            FROM returns_log r

            INNER JOIN issues i
                ON r.issue_id = i.id

            INNER JOIN books b
                ON i.book_id = b.id

            INNER JOIN members m
                ON i.member_id = m.id

            WHERE 1 = 1
        `;


        const params = [];


        if (from) {

            sql += `
                AND r.return_date >= ?
            `;

            params.push(from);

        }


        if (to) {

            sql += `
                AND r.return_date <= ?
            `;

            params.push(to);

        }


        sql += `
            ORDER BY r.return_date DESC,
                     r.id DESC
        `;


        const [rows] =
            await pool.query(
                sql,
                params
            );


        res.json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {

        console.error(
            "Return report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to generate return report."
        });

    }

});


/* =========================================================
   GET MEMBER REPORT
   ========================================================= */

router.get("/members", async (req, res) => {

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

                COUNT(i.id)
                    AS total_issues,

                SUM(
                    i.status = 'Returned'
                ) AS returned_books,

                SUM(
                    i.status = 'Issued'
                ) AS currently_issued,

                SUM(
                    i.status = 'Overdue'
                ) AS overdue_books,

                COALESCE(
                    SUM(i.fine),
                    0
                ) AS total_fine

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

            ORDER BY total_issues DESC

        `);


        res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(
            "Member report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to generate member report."
        });

    }

});


/* =========================================================
   GET FINE REPORT
   ========================================================= */

router.get("/fines", async (req, res) => {

    try {

        const {
            from,
            to
        } = req.query;


        let sql = `

            SELECT

                r.id,
                r.issue_id,

                m.name AS member_name,
                m.member_code,

                b.title AS book_title,

                r.return_date,
                r.late_days,
                r.fine

            FROM returns_log r

            INNER JOIN issues i
                ON r.issue_id = i.id

            INNER JOIN members m
                ON i.member_id = m.id

            INNER JOIN books b
                ON i.book_id = b.id

            WHERE r.fine > 0

        `;


        const params = [];


        if (from) {

            sql += `
                AND r.return_date >= ?
            `;

            params.push(from);

        }


        if (to) {

            sql += `
                AND r.return_date <= ?
            `;

            params.push(to);

        }


        sql += `
            ORDER BY r.fine DESC,
                     r.return_date DESC
        `;


        const [rows] =
            await pool.query(
                sql,
                params
            );


        const totalFine =
            rows.reduce(
                (sum, row) =>
                    sum +
                    Number(row.fine || 0),
                0
            );


        res.json({
            success: true,
            count: rows.length,
            total_fine: totalFine,
            data: rows
        });

    } catch (error) {

        console.error(
            "Fine report error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to generate fine report."
        });

    }

});


/* =========================================================
   GET MOST BORROWED BOOKS
   ========================================================= */

router.get("/most-borrowed", async (req, res) => {

    try {

        const [rows] = await pool.query(`

            SELECT

                b.id,
                b.title,
                b.author,
                b.category,

                COUNT(i.id)
                    AS issue_count

            FROM books b

            LEFT JOIN issues i
                ON b.id = i.book_id

            GROUP BY
                b.id,
                b.title,
                b.author,
                b.category

            ORDER BY issue_count DESC

            LIMIT 10

        `);


        res.json({
            success: true,
            data: rows
        });

    } catch (error) {

        console.error(
            "Most borrowed report error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to generate most borrowed report."
        });

    }

});


/* =========================================================
   GET DASHBOARD REPORT SUMMARY
   ========================================================= */

router.get("/summary", async (req, res) => {

    try {

        const [
            [monthlyIssues]
        ] = await pool.query(`

            SELECT

                DATE_FORMAT(
                    issue_date,
                    '%Y-%m'
                ) AS month,

                COUNT(*) AS issue_count

            FROM issues

            WHERE issue_date >=
                DATE_SUB(
                    CURDATE(),
                    INTERVAL 6 MONTH
                )

            GROUP BY month

            ORDER BY month ASC

        `);


        const [
            [monthlyReturns]
        ] = await pool.query(`

            SELECT

                DATE_FORMAT(
                    return_date,
                    '%Y-%m'
                ) AS month,

                COUNT(*) AS return_count,

                COALESCE(
                    SUM(fine),
                    0
                ) AS fine_amount

            FROM returns_log

            WHERE return_date >=
                DATE_SUB(
                    CURDATE(),
                    INTERVAL 6 MONTH
                )

            GROUP BY month

            ORDER BY month ASC

        `);


        const [
            [reservations]
        ] = await pool.query(`

            SELECT

                COUNT(*) AS total,

                SUM(
                    status = 'Pending'
                ) AS pending,

                SUM(
                    status = 'Fulfilled'
                ) AS fulfilled,

                SUM(
                    status = 'Cancelled'
                ) AS cancelled,

                SUM(
                    status = 'Expired'
                ) AS expired

            FROM reservations

        `);


        res.json({
            success: true,
            data: {
                monthlyIssues,
                monthlyReturns,
                reservations
            }
        });

    } catch (error) {

        console.error(
            "Summary report error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to generate summary report."
        });

    }

});


module.exports = router;