/* =========================================================
   LIBRARIA DASHBOARD
   dashboard.js
========================================================= */


/* =========================================================
   API
========================================================= */

const DASHBOARD_API =
    "http://localhost:5000/api/dashboard/stats";

const ISSUES_API =
    "http://localhost:5000/api/issues";

const RETURNS_API =
    "http://localhost:5000/api/returns";

const BOOKS_API =
    "http://localhost:5000/api/books";

const MEMBERS_API =
    "http://localhost:5000/api/members";

const RESERVATIONS_API =
    "http://localhost:5000/api/reservations";


/* =========================================================
   GLOBAL DATA
========================================================= */

let dashboardData = null;

let issues = [];
let returnsData = [];
let books = [];
let members = [];
let reservations = [];

let toastTimer = null;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadDashboard();

    }
);


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        /*
           Try the dedicated dashboard API first.
        */

        const response =
            await fetch(DASHBOARD_API);


        if (!response.ok) {

            throw new Error(
                `Dashboard API error: ${response.status}`
            );

        }


        const data =
            await response.json();


        dashboardData =
            data;


        /*
           Load supporting data for the
           recent activity sections.
        */

        await Promise.allSettled([

            loadIssues(),

            loadReturns(),

            loadBooks(),

            loadMembers(),

            loadReservations()

        ]);


        /*
           Render everything.
        */

        renderDashboardStats();

        renderRecentIssues();

        renderRecentReturns();

        renderActivity();

        renderCategories();


    } catch (error) {

        console.error(
            "Dashboard Load Error:",
            error
        );


        /*
           Even if the dashboard stats endpoint
           is unavailable, try loading the individual
           APIs so the dashboard can still work.
        */

        await loadDashboardFromIndividualAPIs();

    }

}


/* =========================================================
   FALLBACK DASHBOARD DATA
========================================================= */

async function loadDashboardFromIndividualAPIs() {

    try {

        const results =
            await Promise.allSettled([

                loadIssues(),

                loadReturns(),

                loadBooks(),

                loadMembers(),

                loadReservations()

            ]);


        calculateDashboardStats();

        renderDashboardStats();

        renderRecentIssues();

        renderRecentReturns();

        renderActivity();

        renderCategories();


        const hasFailure =
            results.some(
                result =>
                    result.status === "rejected"
            );


        if (hasFailure) {

            showToast(
                "Some dashboard data could not be loaded.",
                "error"
            );

        }

    } catch (error) {

        console.error(
            "Dashboard Fallback Error:",
            error
        );

        showToast(
            "Unable to load dashboard data.",
            "error"
        );

    }

}


/* =========================================================
   LOAD ISSUES
========================================================= */

async function loadIssues() {

    const response =
        await fetch(ISSUES_API);


    if (!response.ok) {

        throw new Error(
            `Issues API error: ${response.status}`
        );

    }


    const data =
        await response.json();


    issues =
        Array.isArray(data)
            ? data
            : (
                data.issues ||
                data.data ||
                []
            );

}


/* =========================================================
   LOAD RETURNS
========================================================= */

async function loadReturns() {

    const response =
        await fetch(RETURNS_API);


    if (!response.ok) {

        throw new Error(
            `Returns API error: ${response.status}`
        );

    }


    const data =
        await response.json();


    returnsData =
        Array.isArray(data)
            ? data
            : (
                data.returns ||
                data.data ||
                []
            );

}


/* =========================================================
   LOAD BOOKS
========================================================= */

async function loadBooks() {

    const response =
        await fetch(BOOKS_API);


    if (!response.ok) {

        throw new Error(
            `Books API error: ${response.status}`
        );

    }


    const data =
        await response.json();


    books =
        Array.isArray(data)
            ? data
            : (
                data.books ||
                data.data ||
                []
            );

}


/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers() {

    const response =
        await fetch(MEMBERS_API);


    if (!response.ok) {

        throw new Error(
            `Members API error: ${response.status}`
        );

    }


    const data =
        await response.json();


    members =
        Array.isArray(data)
            ? data
            : (
                data.members ||
                data.data ||
                []
            );

}


/* =========================================================
   LOAD RESERVATIONS
========================================================= */

async function loadReservations() {

    const response =
        await fetch(RESERVATIONS_API);


    if (!response.ok) {

        throw new Error(
            `Reservations API error: ${response.status}`
        );

    }


    const data =
        await response.json();


    reservations =
        Array.isArray(data)
            ? data
            : (
                data.reservations ||
                data.data ||
                []
            );

}


/* =========================================================
   RENDER DASHBOARD STATS
========================================================= */

function renderDashboardStats() {

    /*
       Support both:

       {
           totalBooks: 10
       }

       and:

       {
           stats: {
               totalBooks: 10
           }
       }
    */

    const stats =
        dashboardData?.stats ||
        dashboardData?.data ||
        dashboardData ||
        {};


    const totalBooks =
        getNumber(
            stats.totalBooks ??
            stats.total_books ??
            stats.books
        );


    const totalMembers =
        getNumber(
            stats.totalMembers ??
            stats.total_members ??
            stats.members
        );


    const issuedBooks =
        getNumber(
            stats.issuedBooks ??
            stats.issued_books ??
            stats.currentlyIssued ??
            stats.currently_issued
        );


    const overdueBooks =
        getNumber(
            stats.overdueBooks ??
            stats.overdue_books ??
            stats.overdue
        );


    const availableBooks =
        getNumber(
            stats.availableBooks ??
            stats.available_books
        );


    const activeMembers =
        getNumber(
            stats.activeMembers ??
            stats.active_members
        );


    const dueSoonBooks =
        getNumber(
            stats.dueSoonBooks ??
            stats.due_soon_books
        );


    const totalFines =
        getNumber(
            stats.totalFines ??
            stats.total_fines ??
            stats.fines
        );


    /*
       If backend did not provide certain values,
       calculate them from loaded data.
    */

    const calculatedTotalBooks =
        totalBooks ||
        books.length;


    const calculatedTotalMembers =
        totalMembers ||
        members.length;


    const calculatedIssuedBooks =
        issuedBooks ||
        issues.filter(
            issue =>
                issue.status === "Issued" ||
                issue.status === "Overdue"
        ).length;


    const calculatedOverdueBooks =
        overdueBooks ||
        issues.filter(
            issue =>
                issue.status === "Overdue" ||
                isOverdue(issue)
        ).length;


    const calculatedAvailableBooks =
        availableBooks ||
        books.reduce(
            (sum, book) =>
                sum +
                Number(
                    book.available_copies ??
                    book.availableCopies ??
                    0
                ),
            0
        );


    const calculatedActiveMembers =
        activeMembers ||
        members.filter(
            member =>
                (
                    member.membership_status ||
                    member.status
                ) === "Active"
        ).length;


    const calculatedDueSoon =
        dueSoonBooks ||
        issues.filter(
            issue =>
                isDueSoon(issue)
        ).length;


    const calculatedFines =
        totalFines ||
        issues.reduce(
            (sum, issue) =>
                sum +
                Number(
                    issue.fine || 0
                ),
            0
        );


    setText(
        "totalBooks",
        calculatedTotalBooks
    );


    setText(
        "bookAvailability",
        `${calculatedAvailableBooks} available`
    );


    setText(
        "totalMembers",
        calculatedTotalMembers
    );


    setText(
        "activeMembers",
        `${calculatedActiveMembers} active`
    );


    setText(
        "issuedBooks",
        calculatedIssuedBooks
    );


    setText(
        "dueSoonBooks",
        `${calculatedDueSoon} due soon`
    );


    setText(
        "overdueBooks",
        calculatedOverdueBooks
    );


    setText(
        "totalFines",
        formatCurrency(calculatedFines) +
        " fine"
    );

}


/* =========================================================
   CALCULATE STATS
========================================================= */

function calculateDashboardStats() {

    const totalBooks =
        books.length;


    const totalMembers =
        members.length;


    const issuedBooks =
        issues.filter(
            issue =>
                issue.status === "Issued" ||
                issue.status === "Overdue"
        ).length;


    const overdueBooks =
        issues.filter(
            issue =>
                issue.status === "Overdue" ||
                isOverdue(issue)
        ).length;


    const availableBooks =
        books.reduce(
            (sum, book) =>
                sum +
                Number(
                    book.available_copies ??
                    book.availableCopies ??
                    0
                ),
            0
        );


    const activeMembers =
        members.filter(
            member =>
                (
                    member.membership_status ||
                    member.status
                ) === "Active"
        ).length;


    const dueSoonBooks =
        issues.filter(
            issue =>
                isDueSoon(issue)
        ).length;


    const totalFines =
        issues.reduce(
            (sum, issue) =>
                sum +
                Number(
                    issue.fine || 0
                ),
            0
        );


    dashboardData = {

        totalBooks,

        totalMembers,

        issuedBooks,

        overdueBooks,

        availableBooks,

        activeMembers,

        dueSoonBooks,

        totalFines

    };

}


/* =========================================================
   RECENT ISSUES
========================================================= */

function renderRecentIssues() {

    const container =
        document.getElementById(
            "recentIssues"
        );


    if (!container) return;


    if (!issues.length) {

        container.innerHTML = `

            <tr>

                <td colspan="4">

                    <div class="empty-state">

                        <i class="fa-solid fa-book-open"></i>

                        <p>
                            No issue transactions found.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    const recent =
        [...issues]
            .sort(
                (a,b) =>
                    getTimestamp(
                        b.issue_date ||
                        b.issueDate ||
                        b.created_at
                    )
                    -
                    getTimestamp(
                        a.issue_date ||
                        a.issueDate ||
                        a.created_at
                    )
            )
            .slice(0,5);


    container.innerHTML =
        recent.map(
            issue => {

                const bookTitle =
                    issue.book_title ||
                    issue.bookTitle ||
                    issue.title ||
                    "Unknown Book";


                const author =
                    issue.author ||
                    "Unknown Author";


                const memberName =
                    issue.member_name ||
                    issue.memberName ||
                    issue.name ||
                    "Unknown Member";


                const dueDate =
                    issue.due_date ||
                    issue.dueDate;


                const status =
                    getIssueStatus(issue);


                return `

                    <tr>

                        <td>

                            <div class="book-info">

                                <div class="book-icon">

                                    <i class="fa-solid fa-book"></i>

                                </div>

                                <div class="book-name">

                                    <strong>
                                        ${escapeHTML(bookTitle)}
                                    </strong>

                                    <span>
                                        ${escapeHTML(author)}
                                    </span>

                                </div>

                            </div>

                        </td>


                        <td>

                            <div class="member-info">

                                <div class="avatar">

                                    ${escapeHTML(
                                        getInitials(memberName)
                                    )}

                                </div>

                                <div class="member-name">

                                    <strong>
                                        ${escapeHTML(memberName)}
                                    </strong>

                                    <span>
                                        Member
                                    </span>

                                </div>

                            </div>

                        </td>


                        <td>

                            <span class="date">

                                ${formatDate(dueDate)}

                            </span>

                        </td>


                        <td>

                            <span class="badge ${getIssueBadgeClass(status)}">

                                ${escapeHTML(status)}

                            </span>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =========================================================
   RECENT RETURNS
========================================================= */

function renderRecentReturns() {

    const container =
        document.getElementById(
            "recentReturns"
        );


    if (!container) return;


    if (!returnsData.length) {

        container.innerHTML = `

            <tr>

                <td colspan="4">

                    <div class="empty-state">

                        <i class="fa-solid fa-arrow-left"></i>

                        <p>
                            No return transactions found.
                        </p>

                    </div>

                </td>

            </tr>

        `;

        return;

    }


    const recent =
        [...returnsData]
            .sort(
                (a,b) =>
                    getTimestamp(
                        b.return_date ||
                        b.returnDate ||
                        b.created_at
                    )
                    -
                    getTimestamp(
                        a.return_date ||
                        a.returnDate ||
                        a.created_at
                    )
            )
            .slice(0,5);


    container.innerHTML =
        recent.map(
            item => {

                const bookTitle =
                    item.book_title ||
                    item.bookTitle ||
                    item.title ||
                    "Unknown Book";


                const author =
                    item.author ||
                    "Unknown Author";


                const memberName =
                    item.member_name ||
                    item.memberName ||
                    item.name ||
                    "Unknown Member";


                const returnDate =
                    item.return_date ||
                    item.returnDate;


                const fine =
                    Number(
                        item.fine || 0
                    );


                return `

                    <tr>

                        <td>

                            <div class="book-info">

                                <div class="book-icon">

                                    <i class="fa-solid fa-book"></i>

                                </div>

                                <div class="book-name">

                                    <strong>
                                        ${escapeHTML(bookTitle)}
                                    </strong>

                                    <span>
                                        ${escapeHTML(author)}
                                    </span>

                                </div>

                            </div>

                        </td>


                        <td>

                            <div class="member-info">

                                <div class="avatar">

                                    ${escapeHTML(
                                        getInitials(memberName)
                                    )}

                                </div>

                                <div class="member-name">

                                    <strong>
                                        ${escapeHTML(memberName)}
                                    </strong>

                                    <span>
                                        Member
                                    </span>

                                </div>

                            </div>

                        </td>


                        <td>

                            <span class="date">

                                ${formatDate(returnDate)}

                            </span>

                        </td>


                        <td>

                            <strong>

                                ${formatCurrency(fine)}

                            </strong>

                        </td>

                    </tr>

                `;

            }
        ).join("");

}


/* =========================================================
   ACTIVITY
========================================================= */

function renderActivity() {

    const container =
        document.getElementById(
            "activityList"
        );


    if (!container) return;


    const activities = [];


    /* -------------------------
       ISSUE ACTIVITY
    ------------------------- */

    issues.forEach(
        issue => {

            activities.push({

                type: "issue",

                title:
                    "Book issued",

                description:
                    `${issue.book_title || issue.bookTitle || issue.title || "Book"} issued to ${issue.member_name || issue.memberName || "member"}`,

                date:
                    issue.issue_date ||
                    issue.issueDate ||
                    issue.created_at

            });

        }
    );


    /* -------------------------
       RETURN ACTIVITY
    ------------------------- */

    returnsData.forEach(
        item => {

            activities.push({

                type: "return",

                title:
                    "Book returned",

                description:
                    `${item.book_title || item.bookTitle || item.title || "Book"} returned by ${item.member_name || item.memberName || "member"}`,

                date:
                    item.return_date ||
                    item.returnDate ||
                    item.created_at

            });

        }
    );


    /* -------------------------
       RESERVATION ACTIVITY
    ------------------------- */

    reservations.forEach(
        reservation => {

            activities.push({

                type:
                    "reservation",

                title:
                    "Book reserved",

                description:
                    `${reservation.book_title || reservation.bookTitle || "Book"} reserved by ${reservation.member_name || reservation.memberName || "member"}`,

                date:
                    reservation.reservation_date ||
                    reservation.reservationDate ||
                    reservation.created_at

            });

        }
    );


    /*
       Sort newest first.
    */

    activities.sort(
        (a,b) =>
            getTimestamp(b.date) -
            getTimestamp(a.date)
    );


    const recent =
        activities.slice(0,6);


    if (!recent.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-clock"></i>

                <p>
                    No recent activity.
                </p>

            </div>

        `;

        return;

    }


    container.innerHTML =
        recent.map(
            activity => {

                const config =
                    getActivityConfig(
                        activity.type
                    );


                return `

                    <div class="activity-item">

                        <div
                            class="activity-icon ${config.className}">

                            <i class="${config.icon}"></i>

                        </div>


                        <div class="activity-content">

                            <strong>
                                ${escapeHTML(
                                    activity.title
                                )}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    activity.description
                                )}
                            </span>

                        </div>


                        <div class="activity-time">

                            ${timeAgo(
                                activity.date
                            )}

                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================================
   CATEGORY DISTRIBUTION
========================================================= */

function renderCategories() {

    const container =
        document.getElementById(
            "categoryList"
        );


    if (!container) return;


    if (!books.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-layer-group"></i>

                <p>
                    No books available.
                </p>

            </div>

        `;

        return;

    }


    const categoryCounts = {};


    books.forEach(
        book => {

            const category =
                book.category ||
                "Other";


            categoryCounts[category] =
                (
                    categoryCounts[category] ||
                    0
                ) + 1;

        }
    );


    const total =
        books.length;


    const categories =
        Object.entries(
            categoryCounts
        )
        .sort(
            (a,b) =>
                b[1] - a[1]
        )
        .slice(0,6);


    container.innerHTML =
        categories.map(
            ([category,count]) => {

                const percentage =
                    Math.round(
                        (
                            count /
                            total
                        ) * 100
                    );


                return `

                    <div class="category-item">

                        <div class="category-top">

                            <span>
                                ${escapeHTML(category)}
                            </span>

                            <strong>
                                ${count} books
                            </strong>

                        </div>


                        <div class="progress">

                            <div
                                class="progress-bar"
                                style="width:${percentage}%">

                            </div>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =========================================================
   REFRESH DASHBOARD
========================================================= */

async function refreshDashboard() {

    const button =
        document.querySelector(
            ".refresh-btn"
        );


    const icon =
        button?.querySelector("i");


    if (button) {

        button.disabled = true;

    }


    if (icon) {

        icon.classList.add(
            "fa-spin"
        );

    }


    try {

        await loadDashboard();


        showToast(
            "Dashboard refreshed successfully.",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Failed to refresh dashboard.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled = false;

        }


        if (icon) {

            icon.classList.remove(
                "fa-spin"
            );

        }

    }

}


/* =========================================================
   SIDEBAR
========================================================= */

function toggleSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    if (!sidebar) return;


    sidebar.classList.toggle(
        "open"
    );

}


/* =========================================================
   ISSUE STATUS
========================================================= */

function getIssueStatus(issue) {

    if (
        issue.status ===
        "Returned"
    ) {

        return "Returned";

    }


    if (
        issue.status ===
        "Overdue" ||
        isOverdue(issue)
    ) {

        return "Overdue";

    }


    if (
        isDueSoon(issue)
    ) {

        return "Due Soon";

    }


    return "Issued";

}


/* =========================================================
   ISSUE BADGE CLASS
========================================================= */

function getIssueBadgeClass(status) {

    switch (status) {

        case "Returned":
            return "returned";

        case "Overdue":
            return "overdue";

        case "Due Soon":
            return "pending";

        default:
            return "issued";

    }

}


/* =========================================================
   CHECK OVERDUE
========================================================= */

function isOverdue(issue) {

    if (
        issue.status ===
        "Returned"
    ) {

        return false;

    }


    const dueDate =
        issue.due_date ||
        issue.dueDate;


    if (!dueDate) {

        return false;

    }


    const due =
        new Date(dueDate);


    const today =
        new Date();


    today.setHours(
        0,0,0,0
    );


    due.setHours(
        0,0,0,0
    );


    return due < today;

}


/* =========================================================
   CHECK DUE SOON
========================================================= */

function isDueSoon(issue) {

    if (
        issue.status ===
        "Returned"
    ) {

        return false;

    }


    const dueDate =
        issue.due_date ||
        issue.dueDate;


    if (!dueDate) {

        return false;

    }


    const due =
        new Date(dueDate);


    const today =
        new Date();


    today.setHours(
        0,0,0,0
    );


    due.setHours(
        0,0,0,0
    );


    const difference =
        Math.ceil(
            (
                due.getTime() -
                today.getTime()
            ) /
            (
                1000 *
                60 *
                60 *
                24
            )
        );


    return (
        difference >= 0 &&
        difference <= 3
    );

}


/* =========================================================
   ACTIVITY CONFIG
========================================================= */

function getActivityConfig(type) {

    switch(type) {

        case "return":

            return {

                icon:
                    "fa-solid fa-arrow-left",

                className:
                    "green"

            };


        case "reservation":

            return {

                icon:
                    "fa-solid fa-calendar-check",

                className:
                    "orange"

            };


        case "issue":

        default:

            return {

                icon:
                    "fa-solid fa-arrow-right",

                className:
                    "purple"

            };

    }

}


/* =========================================================
   TIME AGO
========================================================= */

function timeAgo(value) {

    if (!value) {

        return "-";

    }


    const timestamp =
        getTimestamp(value);


    if (!timestamp) {

        return "-";

    }


    const difference =
        Date.now() -
        timestamp;


    const minutes =
        Math.floor(
            difference /
            60000
        );


    if (minutes < 1) {

        return "Just now";

    }


    if (minutes < 60) {

        return `${minutes}m ago`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return `${hours}h ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (days < 30) {

        return `${days}d ago`;

    }


    const months =
        Math.floor(
            days / 30
        );


    return `${months}mo ago`;

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

    if (!value) {

        return "-";

    }


    /*
       Handle MySQL date strings safely.
    */

    let date;


    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

        const parts =
            value.split("-");


        date =
            new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2])
            );

    } else {

        date =
            new Date(value);

    }


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(value) {

    const amount =
        Number(value || 0);


    return amount.toLocaleString(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2
        }
    );

}


/* =========================================================
   TIMESTAMP
========================================================= */

function getTimestamp(value) {

    if (!value) {

        return 0;

    }


    if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {

        const parts =
            value.split("-");


        return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        ).getTime();

    }


    const timestamp =
        new Date(value).getTime();


    return Number.isNaN(timestamp)
        ? 0
        : timestamp;

}


/* =========================================================
   GET INITIALS
========================================================= */

function getInitials(name) {

    if (!name) {

        return "NA";

    }


    const parts =
        name
            .trim()
            .split(/\s+/);


    if (
        parts.length === 1
    ) {

        return parts[0]
            .substring(0,2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[
            parts.length - 1
        ][0]
    ).toUpperCase();

}


/* =========================================================
   GET NUMBER
========================================================= */

function getNumber(value) {

    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {

        return 0;

    }


    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(id,value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById(
            "toast"
        );


    const toastMessage =
        document.getElementById(
            "toastMessage"
        );


    if (
        !toast ||
        !toastMessage
    ) {

        return;

    }


    toastMessage.textContent =
        message;


    const icon =
        toast.querySelector("i");


    if (icon) {

        if (type === "error") {

            icon.className =
                "fa-solid fa-circle-exclamation";

        } else {

            icon.className =
                "fa-solid fa-circle-check";

        }

    }


    toast.classList.add(
        "show"
    );


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );

}


/* =========================================================
   CLOSE SIDEBAR WHEN CLICKING MAIN AREA
========================================================= */

document.addEventListener(
    "click",
    event => {

        const sidebar =
            document.getElementById(
                "sidebar"
            );


        if (
            !sidebar ||
            !sidebar.classList.contains(
                "open"
            )
        ) {

            return;

        }


        const clickedInsideSidebar =
            sidebar.contains(
                event.target
            );


        const mobileButton =
            event.target.closest(
                ".mobile-menu"
            );


        if (
            !clickedInsideSidebar &&
            !mobileButton
        ) {

            sidebar.classList.remove(
                "open"
            );

        }

    }
);