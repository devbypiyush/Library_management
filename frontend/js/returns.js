/* =========================================================
   LIBRARIA - RETURNS MODULE
   ========================================================= */

const ISSUES_API = "http://localhost:5000/api/issues";
const RETURNS_API = "http://localhost:5000/api/returns";

const FINE_PER_DAY = 10;

let issues = [];
let returns = [];

let toastTimer = null;


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    await loadIssues();
    await loadReturns();

    updateStatistics();

    renderReturns();

    /*
       If user came from Issue Books page
       using ?issue_id=123
    */

    const params =
        new URLSearchParams(window.location.search);

    const issueId =
        params.get("issue_id");

    if (issueId) {

        setTimeout(() => {

            openReturnModal();

            const select =
                document.getElementById("issueSelect");

            if (select) {

                select.value = issueId;

                handleIssueChange();

            }

        }, 300);

    }

});


/* =========================================================
   LOAD ISSUES
   ========================================================= */

async function loadIssues() {

    try {

        const response =
            await fetch(ISSUES_API);


        if (!response.ok) {

            throw new Error(
                `Issues API error: ${response.status}`
            );

        }


        const contentType =
            response.headers.get("content-type") || "";


        if (!contentType.includes("application/json")) {

            const text =
                await response.text();

            console.error(
                "Issues API returned:",
                text
            );

            throw new Error(
                "Issues API did not return JSON."
            );

        }


        const data =
            await response.json();


        issues = Array.isArray(data)
            ? data
            : data.issues || data.data || [];


        populateIssueDropdown();


    } catch (error) {

        console.error(
            "Load Issues Error:",
            error
        );


        issues = [];

        populateIssueDropdown();


        showToast(
            error.message ||
            "Unable to load issued books",
            "error"
        );

    }

}


/* =========================================================
   LOAD RETURNS
   ========================================================= */

async function loadReturns() {

    try {

        const response =
            await fetch(RETURNS_API);


        if (!response.ok) {

            throw new Error(
                `Returns API error: ${response.status}`
            );

        }


        const contentType =
            response.headers.get("content-type") || "";


        if (!contentType.includes("application/json")) {

            const text =
                await response.text();

            console.error(
                "Returns API returned:",
                text
            );

            throw new Error(
                "Returns API did not return JSON. Check /api/returns."
            );

        }


        const data =
            await response.json();


        returns = Array.isArray(data)
            ? data
            : data.returns || data.data || [];


    } catch (error) {

        console.error(
            "Load Returns Error:",
            error
        );


        returns = [];


        /*
           Don't block the page if return history
           is empty or API is temporarily unavailable.
        */

        showToast(
            error.message ||
            "Unable to load return history",
            "error"
        );

    }

}


/* =========================================================
   POPULATE ISSUE DROPDOWN
   ========================================================= */

function populateIssueDropdown() {

    const select =
        document.getElementById("issueSelect");


    if (!select) return;


    select.innerHTML = `

        <option value="">
            Select issued transaction
        </option>

    `;


    /*
       Only show books that are currently
       Issued or Overdue.
    */

    const activeIssues =
        issues.filter(issue => {

            const status =
                String(issue.status || "")
                    .toLowerCase();

            return (
                status === "issued" ||
                status === "overdue"
            );

        });


    if (activeIssues.length === 0) {

        const option =
            document.createElement("option");

        option.value = "";

        option.textContent =
            "No books currently issued";

        option.disabled = true;

        select.appendChild(option);

        return;

    }


    activeIssues.forEach(issue => {

        const option =
            document.createElement("option");


        option.value =
            issue.id;


        const memberName =
            issue.member_name ||
            issue.name ||
            "Unknown Member";


        const bookTitle =
            issue.book_title ||
            issue.title ||
            "Unknown Book";


        const transaction =
            getTransactionId(issue);


        option.textContent =
            `${transaction} — ${memberName} — ${bookTitle}`;


        select.appendChild(option);

    });

}


/* =========================================================
   ISSUE CHANGE
   ========================================================= */

function handleIssueChange() {

    const select =
        document.getElementById("issueSelect");


    const issueId =
        select?.value;


    const issueInfo =
        document.getElementById("issueInfo");


    const fineBox =
        document.getElementById("fineBox");


    if (!issueId) {

        if (issueInfo) {
            issueInfo.innerHTML = "";
        }

        if (fineBox) {
            fineBox.style.display = "none";
        }

        return;

    }


    const issue =
        issues.find(
            item =>
                Number(item.id) ===
                Number(issueId)
        );


    if (!issue) {

        showToast(
            "Issue transaction not found",
            "error"
        );

        return;

    }


    const memberName =
        issue.member_name ||
        issue.name ||
        "Unknown Member";


    const memberCode =
        issue.member_code ||
        "";


    const email =
        issue.member_email ||
        issue.email ||
        "";


    const bookTitle =
        issue.book_title ||
        issue.title ||
        "Unknown Book";


    const author =
        issue.author ||
        "";


    const lateDays =
        calculateLateDays(
            issue.due_date
        );


    const fine =
        lateDays * FINE_PER_DAY;


    /* =====================================================
       ISSUE INFORMATION
       ===================================================== */

    if (issueInfo) {

        issueInfo.innerHTML = `

            <div class="selected-info">

                <div class="info-avatar">

                    ${getInitials(memberName)}

                </div>


                <div class="info-content">

                    <strong>
                        ${escapeHTML(memberName)}
                    </strong>

                    <span>
                        ${escapeHTML(memberCode)}
                    </span>

                    ${
                        email
                        ? `
                            <span>
                                ${escapeHTML(email)}
                            </span>
                        `
                        : ""
                    }

                    <span style="margin-top:7px;">

                        <i class="fa-solid fa-book"></i>

                        ${escapeHTML(bookTitle)}

                    </span>

                    ${
                        author
                        ? `
                            <span>
                                ${escapeHTML(author)}
                            </span>
                        `
                        : ""
                    }

                </div>

            </div>

        `;

    }


    /* =====================================================
       FINE INFORMATION
       ===================================================== */

    if (fineBox) {

        fineBox.style.display = "block";


        const fineDueDate =
            document.getElementById("fineDueDate");


        const fineReturnDate =
            document.getElementById("fineReturnDate");


        const lateDaysElement =
            document.getElementById("lateDays");


        const fineAmount =
            document.getElementById("fineAmount");


        if (fineDueDate) {

            fineDueDate.textContent =
                formatDate(issue.due_date);

        }


        if (fineReturnDate) {

            fineReturnDate.textContent =
                formatDate(
                    new Date()
                );

        }


        if (lateDaysElement) {

            lateDaysElement.textContent =
                lateDays;

        }


        if (fineAmount) {

            fineAmount.textContent =
                formatCurrency(fine);

        }


        /*
           Change fine box appearance
           when there is no late fine.
        */

        if (fine === 0) {

            fineBox.style.background =
                "#ecfdf5";

            fineBox.style.borderColor =
                "#a7f3d0";

        } else {

            fineBox.style.background =
                "#fffbeb";

            fineBox.style.borderColor =
                "#fde68a";

        }

    }

}


/* =========================================================
   CALCULATE LATE DAYS
   ========================================================= */

function calculateLateDays(dueDate) {

    if (!dueDate) {
        return 0;
    }


    const today =
        startOfDay(new Date());


    const due =
        startOfDay(
            parseLocalDate(dueDate)
        );


    const difference =
        Math.floor(
            (
                today.getTime() -
                due.getTime()
            ) /
            (1000 * 60 * 60 * 24)
        );


    return Math.max(
        0,
        difference
    );

}


/* =========================================================
   RETURN BOOK
   ========================================================= */

async function returnBook() {

    const select =
        document.getElementById("issueSelect");


    const issueId =
        select?.value;


    if (!issueId) {

        showToast(
            "Please select an issued book",
            "error"
        );

        return;

    }


    const issue =
        issues.find(
            item =>
                Number(item.id) ===
                Number(issueId)
        );


    if (!issue) {

        showToast(
            "Issue transaction not found",
            "error"
        );

        return;

    }


    const status =
        String(issue.status || "")
            .toLowerCase();


    if (
        status === "returned"
    ) {

        showToast(
            "This book has already been returned",
            "error"
        );

        return;

    }


    const returnButton =
        document.getElementById("returnButton");


    if (returnButton) {

        returnButton.disabled = true;

        returnButton.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Returning...

        `;

    }


    const returnDate =
        formatInputDate(
            new Date()
        );


    try {

        /* =================================================
           API REQUEST
        ================================================= */

        const response =
            await fetch(
                RETURNS_API,
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        issue_id:
                            Number(issueId),

                        return_date:
                            returnDate

                    })

                }
            );


        const contentType =
            response.headers.get("content-type") || "";


        let data;


        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const text =
                await response.text();

            console.error(
                "Return API response:",
                text
            );

            throw new Error(
                "Server returned HTML instead of JSON. Check /api/returns."
            );

        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Unable to return book"
            );

        }


        /* =================================================
           SUCCESS
        ================================================= */

        const fine =
            Number(
                data.fine ??
                data.return?.fine ??
                calculateLateDays(issue.due_date) *
                FINE_PER_DAY
            );


        showToast(
            `Book returned successfully. Fine: ${formatCurrency(fine)}`,
            "success"
        );


        closeReturnModal();


        /*
           Reload everything
        */

        await loadIssues();

        await loadReturns();


        updateStatistics();

        renderReturns();


        /*
           Refresh URL so issue_id
           doesn't reopen the modal.
        */

        if (
            window.history &&
            window.history.replaceState
        ) {

            window.history.replaceState(
                {},
                document.title,
                window.location.pathname
            );

        }


    } catch (error) {

        console.error(
            "Return Book Error:",
            error
        );


        showToast(
            error.message ||
            "Failed to return book",
            "error"
        );


    } finally {

        if (returnButton) {

            returnButton.disabled = false;

            returnButton.innerHTML = `

                <i class="fa-solid fa-check"></i>

                Confirm Return

            `;

        }

    }

}


/* =========================================================
   RENDER RETURN TABLE
   ========================================================= */

function renderReturns(data = null) {

    const table =
        document.getElementById("returnTable");


    if (!table) return;


    let rows = [];


    /*
       Combine returned issues with
       return history.
    */

    if (
        returns &&
        returns.length > 0
    ) {

        rows =
            returns.map(item => {

                return normalizeReturn(item);

            });

    } else {

        /*
           If there is no return history,
           show returned issues if available.
        */

        rows =
            issues
                .filter(issue => {

                    return String(
                        issue.status || ""
                    ).toLowerCase() === "returned";

                })
                .map(issue => {

                    return normalizeReturn(issue);

                });

    }


    if (data !== null) {
        rows = data;
    }


    if (rows.length === 0) {

        table.innerHTML = `

            <tr class="empty-row">

                <td colspan="8">

                    <i class="fa-solid fa-rotate-left"></i>

                    No return transactions found.

                </td>

            </tr>

        `;

        updateResultText(0);

        return;

    }


    table.innerHTML =
        rows.map(item => {

            const transaction =
                getTransactionId(item);


            const memberName =
                item.member_name ||
                item.name ||
                "Unknown Member";


            const memberCode =
                item.member_code ||
                "";


            const bookTitle =
                item.book_title ||
                item.title ||
                "Unknown Book";


            const author =
                item.author ||
                "";


            const issueDate =
                formatDate(
                    item.issue_date
                );


            const dueDate =
                formatDate(
                    item.due_date
                );


            const returnDate =
                formatDate(
                    item.return_date
                );


            const lateDays =
                Number(
                    item.late_days || 0
                );


            const fine =
                Number(
                    item.fine || 0
                );


            let status =
                "Returned";


            if (lateDays > 0) {
                status = "Late Return";
            }


            const statusClass =
                lateDays > 0
                    ? "pending"
                    : "returned";


            return `

                <tr>

                    <td>

                        <span class="transaction-id">

                            ${escapeHTML(transaction)}

                        </span>

                    </td>


                    <td>

                        <div class="member-info">

                            <div class="avatar">

                                ${getInitials(memberName)}

                            </div>

                            <div class="member-name">

                                <strong>

                                    ${escapeHTML(memberName)}

                                </strong>

                                <span>

                                    ${escapeHTML(memberCode)}

                                </span>

                            </div>

                        </div>

                    </td>


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

                        <span class="date">

                            ${issueDate}

                        </span>

                    </td>


                    <td>

                        <span class="date">

                            ${dueDate}

                        </span>

                    </td>


                    <td>

                        <span class="date">

                            ${returnDate}

                        </span>

                    </td>


                    <td>

                        ${
                            fine > 0
                            ? `
                                <span class="fine">

                                    ${formatCurrency(fine)}

                                </span>
                            `
                            : `
                                <span class="no-fine">

                                    No Fine

                                </span>
                            `
                        }

                    </td>


                    <td>

                        <span class="badge ${statusClass}">

                            ${status}

                        </span>

                    </td>

                </tr>

            `;

        }).join("");


    updateResultText(
        rows.length
    );

}


/* =========================================================
   NORMALIZE RETURN DATA
   ========================================================= */

function normalizeReturn(item) {

    /*
       Some APIs return:
       return_log + issue data

       Others may return:
       issue directly.

       This function keeps the frontend
       compatible with both.
    */

    const issueId =
        item.issue_id ||
        item.id;


    const originalIssue =
        issues.find(
            issue =>
                Number(issue.id) ===
                Number(issueId)
        );


    return {

        ...originalIssue,

        ...item,

        issue_id:
            item.issue_id ||
            originalIssue?.id,

        book_id:
            item.book_id ||
            originalIssue?.book_id,

        member_id:
            item.member_id ||
            originalIssue?.member_id,

        book_title:
            item.book_title ||
            originalIssue?.book_title,

        member_name:
            item.member_name ||
            originalIssue?.member_name,

        member_code:
            item.member_code ||
            originalIssue?.member_code,

        author:
            item.author ||
            originalIssue?.author,

        issue_date:
            item.issue_date ||
            originalIssue?.issue_date,

        due_date:
            item.due_date ||
            originalIssue?.due_date,

        return_date:
            item.return_date ||
            item.returnDate,

        fine:
            item.fine || 0,

        late_days:
            item.late_days || 0

    };

}


/* =========================================================
   SEARCH + FILTER
   ========================================================= */

function filterReturns() {

    const searchInput =
        document.getElementById("searchInput");


    const statusFilter =
        document.getElementById("statusFilter");


    const search =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const selectedStatus =
        (
            statusFilter?.value ||
            "all"
        ).toLowerCase();


    let rows = [];


    if (
        returns &&
        returns.length > 0
    ) {

        rows =
            returns.map(
                normalizeReturn
            );

    } else {

        rows =
            issues
                .filter(issue => {

                    return String(
                        issue.status || ""
                    ).toLowerCase() === "returned";

                })
                .map(
                    normalizeReturn
                );

    }


    const filtered =
        rows.filter(item => {

            const memberName =
                item.member_name ||
                item.name ||
                "";


            const memberCode =
                item.member_code ||
                "";


            const bookTitle =
                item.book_title ||
                item.title ||
                "";


            const transaction =
                getTransactionId(item);


            const searchText =
                `
                ${memberName}
                ${memberCode}
                ${bookTitle}
                ${transaction}
                `.toLowerCase();


            const matchesSearch =
                !search ||
                searchText.includes(search);


            const lateDays =
                Number(
                    item.late_days || 0
                );


            let matchesStatus = true;


            if (
                selectedStatus === "returned"
            ) {

                matchesStatus =
                    lateDays === 0;

            }


            if (
                selectedStatus === "late"
            ) {

                matchesStatus =
                    lateDays > 0;

            }


            if (
                selectedStatus === "pending"
            ) {

                matchesStatus = false;

            }


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    renderReturns(filtered);

}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {

    /*
       Pending returns =
       Issued + Overdue books
    */

    const pending =
        issues.filter(issue => {

            const status =
                String(issue.status || "")
                    .toLowerCase();

            return (
                status === "issued" ||
                status === "overdue"
            );

        }).length;


    /*
       Today's returned books
    */

    const today =
        formatInputDate(
            new Date()
        );


    const returnedToday =
        returns.filter(item => {

            return String(
                item.return_date || ""
            ).substring(0,10) === today;

        }).length;


    /*
       Late returns
    */

    const lateReturns =
        returns.filter(item => {

            return Number(
                item.late_days || 0
            ) > 0;

        }).length;


    /*
       Total fines
    */

    const totalFines =
        returns.reduce(
            (sum, item) => {

                return (
                    sum +
                    Number(
                        item.fine || 0
                    )
                );

            },
            0
        );


    setText(
        "pendingReturns",
        pending
    );


    setText(
        "returnedToday",
        returnedToday
    );


    setText(
        "lateReturns",
        lateReturns
    );


    setText(
        "totalFines",
        formatCurrency(totalFines)
    );

}


/* =========================================================
   OPEN RETURN MODAL
   ========================================================= */

function openReturnModal() {

    const modal =
        document.getElementById("returnModal");


    if (!modal) return;


    modal.classList.add("show");


    populateIssueDropdown();


    clearReturnInfo();

}


/* =========================================================
   CLOSE RETURN MODAL
   ========================================================= */

function closeReturnModal() {

    const modal =
        document.getElementById("returnModal");


    if (!modal) return;


    modal.classList.remove("show");


    clearReturnInfo();

}


/* =========================================================
   CLEAR MODAL
   ========================================================= */

function clearReturnInfo() {

    const form =
        document.getElementById("returnForm");


    if (form) {
        form.reset();
    }


    const issueInfo =
        document.getElementById("issueInfo");


    const fineBox =
        document.getElementById("fineBox");


    if (issueInfo) {
        issueInfo.innerHTML = "";
    }


    if (fineBox) {
        fineBox.style.display = "none";

        fineBox.style.background =
            "#fffbeb";

        fineBox.style.borderColor =
            "#fde68a";
    }

}


/* =========================================================
   SIDEBAR
   ========================================================= */

function toggleSidebar() {

    const sidebar =
        document.getElementById("sidebar");


    if (!sidebar) return;


    sidebar.classList.toggle("open");

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toast =
        document.getElementById("toast");


    const toastMessage =
        document.getElementById("toastMessage");


    if (!toast || !toastMessage) return;


    toastMessage.textContent =
        message;


    const icon =
        toast.querySelector("i");


    if (icon) {

        if (type === "error") {

            icon.className =
                "fa-solid fa-circle-exclamation";

            icon.style.color =
                "#ef4444";

        } else {

            icon.className =
                "fa-solid fa-circle-check";

            icon.style.color =
                "#34d399";

        }

    }


    toast.classList.add("show");


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3500);

}


/* =========================================================
   TRANSACTION ID
   ========================================================= */

function getTransactionId(issue) {

    if (
        issue.transaction_id
    ) {

        return issue.transaction_id;

    }


    if (
        issue.transactionId
    ) {

        return issue.transactionId;

    }


    const id =
        issue.issue_id ||
        issue.id ||
        "";


    return `ISS-${String(id).padStart(4,"0")}`;

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        parseLocalDate(value);


    if (
        isNaN(
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
   INPUT DATE FORMAT
   ========================================================= */

function formatInputDate(date) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2,"0");


    const day =
        String(
            date.getDate()
        ).padStart(2,"0");


    return `${year}-${month}-${day}`;

}


/* =========================================================
   DATE PARSER
   ========================================================= */

function parseLocalDate(value) {

    if (
        value instanceof Date
    ) {

        return new Date(value);

    }


    if (!value) {

        return new Date(NaN);

    }


    const clean =
        String(value)
            .substring(0,10);


    const parts =
        clean.split("-");


    if (
        parts.length === 3
    ) {

        return new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );

    }


    return new Date(value);

}


/* =========================================================
   START OF DAY
   ========================================================= */

function startOfDay(date) {

    const result =
        new Date(date);


    result.setHours(
        0,
        0,
        0,
        0
    );


    return result;

}


/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(name) {

    if (!name) {
        return "?";
    }


    const words =
        String(name)
            .trim()
            .split(/\s+/);


    if (
        words.length === 1
    ) {

        return words[0]
            .substring(0,2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[
            words.length - 1
        ][0]
    ).toUpperCase();

}


/* =========================================================
   CURRENCY
   ========================================================= */

function formatCurrency(amount) {

    return "₹" +
        Number(amount || 0)
            .toLocaleString(
                "en-IN",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2
                }
            );

}


/* =========================================================
   SET TEXT
   ========================================================= */

function setText(
    id,
    value
) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


/* =========================================================
   RESULT TEXT
   ========================================================= */

function updateResultText(count) {

    const element =
        document.getElementById("resultText");


    if (!element) return;


    element.textContent =
        `Showing ${count} return transaction${count === 1 ? "" : "s"}`;

}


/* =========================================================
   CAPITALIZE
   ========================================================= */

function capitalize(value) {

    if (!value) {
        return "";
    }


    return String(value)
        .charAt(0)
        .toUpperCase() +
        String(value)
            .slice(1)
            .toLowerCase();

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

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
   CLICK OUTSIDE MODAL
   ========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const modal =
            document.getElementById(
                "returnModal"
            );


        if (!modal) return;


        if (
            event.target === modal
        ) {

            closeReturnModal();

        }

    }
);


/* =========================================================
   ESCAPE KEY
   ========================================================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key !== "Escape"
        ) {

            return;

        }


        const modal =
            document.getElementById(
                "returnModal"
            );


        if (
            modal &&
            modal.classList.contains(
                "show"
            )
        ) {

            closeReturnModal();

        }

    }
);