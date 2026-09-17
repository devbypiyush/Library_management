/* =========================================================
   LIBRARIA - ISSUE BOOKS
   ========================================================= */

const MEMBERS_API = "http://localhost:5000/api/members";
const BOOKS_API = "http://localhost:5000/api/books";
const ISSUES_API = "http://localhost:5000/api/issues";

let members = [];
let books = [];
let issues = [];

let toastTimer = null;


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

    setDefaultDates();

    await loadMembers();
    await loadBooks();
    await loadIssues();

});


/* =========================================================
   LOAD MEMBERS
   ========================================================= */

async function loadMembers() {

    try {

        const response = await fetch(MEMBERS_API);

        if (!response.ok) {
            throw new Error("Unable to load members");
        }

        const data = await response.json();

        members = Array.isArray(data)
            ? data
            : data.members || data.data || [];

        populateMemberDropdown();

    } catch (error) {

        console.error("Load Members Error:", error);

        showToast(
            "Unable to load members",
            "error"
        );

    }

}


/* =========================================================
   POPULATE MEMBER DROPDOWN
   ========================================================= */

function populateMemberDropdown() {

    const select = document.getElementById("memberSelect");

    if (!select) return;

    select.innerHTML = `
        <option value="">
            Select member
        </option>
    `;

    members.forEach(member => {

        const option = document.createElement("option");

        option.value = member.id;

        option.textContent =
            `${member.member_code} - ${member.name}`;

        select.appendChild(option);

    });

}


/* =========================================================
   LOAD BOOKS
   ========================================================= */

async function loadBooks() {

    try {

        const response = await fetch(BOOKS_API);

        if (!response.ok) {
            throw new Error("Unable to load books");
        }

        const data = await response.json();

        books = Array.isArray(data)
            ? data
            : data.books || data.data || [];

        populateBookDropdown();

    } catch (error) {

        console.error("Load Books Error:", error);

        showToast(
            "Unable to load books",
            "error"
        );

    }

}


/* =========================================================
   POPULATE BOOK DROPDOWN
   ========================================================= */

function populateBookDropdown() {

    const select = document.getElementById("bookSelect");

    if (!select) return;

    select.innerHTML = `
        <option value="">
            Select available book
        </option>
    `;

    books.forEach(book => {

        const option = document.createElement("option");

        option.value = book.id;

        const available =
            Number(book.available_copies || 0);

        option.textContent =
            `${book.title} — ${book.author} (${available} available)`;

        /*
         Disable book if no copies are available
        */

        if (available <= 0) {
            option.disabled = true;
        }

        select.appendChild(option);

    });

}


/* =========================================================
   MEMBER CHANGE
   ========================================================= */

function handleMemberChange() {

    const memberId =
        document.getElementById("memberSelect").value;

    const memberInfo =
        document.getElementById("memberInfo");

    const memberLimitBox =
        document.getElementById("memberLimitBox");

    if (!memberId) {

        if (memberInfo) {
            memberInfo.innerHTML = "";
        }

        if (memberLimitBox) {
            memberLimitBox.style.display = "none";
        }

        return;
    }


    const member =
        members.find(
            m => Number(m.id) === Number(memberId)
        );


    if (!member) return;


    const currentIssues =
        getMemberIssueCount(member.id);

    const issueLimit =
        Number(member.issue_limit || 3);


    /* =========================
       MEMBER INFORMATION
    ========================= */

    if (memberInfo) {

        memberInfo.innerHTML = `

            <div class="selected-info">

                <div class="info-avatar">
                    ${getInitials(member.name)}
                </div>

                <div class="info-content">

                    <strong>
                        ${escapeHTML(member.name)}
                    </strong>

                    <span>
                        ${escapeHTML(member.member_code || "")}
                    </span>

                    <span>
                        ${escapeHTML(member.email || "")}
                    </span>

                </div>

            </div>

        `;

    }


    /* =========================
       ISSUE LIMIT
    ========================= */

    if (memberLimitBox) {

        memberLimitBox.style.display = "block";

        const currentElement =
            document.getElementById("currentIssues");

        if (currentElement) {
            currentElement.textContent =
                `${currentIssues} / ${issueLimit}`;
        }


        const limitBox =
            memberLimitBox.querySelector(".member-limit");

        if (limitBox) {

            if (currentIssues >= issueLimit) {

                limitBox.innerHTML = `

                    <i
                        class="fa-solid fa-triangle-exclamation"
                        style="color:#ef4444;">
                    </i>

                    Issue limit reached.

                    <strong>
                        ${currentIssues} / ${issueLimit}
                    </strong>

                `;

            } else {

                limitBox.innerHTML = `

                    <i
                        class="fa-solid fa-circle-info"
                        style="color:#6366f1;">
                    </i>

                    Current issues:

                    <strong>
                        ${currentIssues} / ${issueLimit}
                    </strong>

                `;

            }

        }

    }

}


/* =========================================================
   BOOK CHANGE
   ========================================================= */

function handleBookChange() {

    const bookId =
        document.getElementById("bookSelect").value;

    const bookInfo =
        document.getElementById("bookInfo");

    const availabilityBox =
        document.getElementById("availabilityBox");


    if (!bookId) {

        if (bookInfo) {
            bookInfo.innerHTML = "";
        }

        if (availabilityBox) {
            availabilityBox.style.display = "none";
        }

        return;
    }


    const book =
        books.find(
            b => Number(b.id) === Number(bookId)
        );


    if (!book) return;


    const available =
        Number(book.available_copies || 0);


    /* =========================
       BOOK INFORMATION
    ========================= */

    if (bookInfo) {

        bookInfo.innerHTML = `

            <div class="selected-info">

                <div class="info-avatar book-avatar">

                    <i class="fa-solid fa-book"></i>

                </div>

                <div class="info-content">

                    <strong>
                        ${escapeHTML(book.title)}
                    </strong>

                    <span>
                        ${escapeHTML(book.author)}
                    </span>

                    <span>
                        ${escapeHTML(book.category || "General")}
                    </span>

                </div>

                <div class="book-availability">

                    <small>
                        Available
                    </small>

                    <strong>
                        ${available}
                    </strong>

                </div>

            </div>

        `;

    }


    /* =========================
       AVAILABILITY
    ========================= */

    if (availabilityBox) {

        availabilityBox.style.display = "block";

        if (available <= 0) {

            availabilityBox.innerHTML = `

                <div class="member-limit">

                    <i
                        class="fa-solid fa-circle-xmark"
                        style="color:#ef4444;">
                    </i>

                    This book is currently unavailable.

                </div>

            `;

        } else {

            availabilityBox.innerHTML = `

                <div class="member-limit">

                    <i
                        class="fa-solid fa-circle-check"
                        style="color:#10b981;">
                    </i>

                    Book is available for issue.

                </div>

            `;

        }

    }

}


/* =========================================================
   GET MEMBER CURRENT ISSUE COUNT
   ========================================================= */

function getMemberIssueCount(memberId) {

    return issues.filter(issue => {

        const issueMemberId =
            issue.member_id ??
            issue.memberId;

        const status =
            String(issue.status || "").toLowerCase();

        return (
            Number(issueMemberId) === Number(memberId) &&
            (
                status === "issued" ||
                status === "overdue"
            )
        );

    }).length;

}


/* =========================================================
   ISSUE BOOK
   ========================================================= */

async function issueBook(event) {

    /*
       Prevent normal form submission
    */

    if (event) {
        event.preventDefault();
    }


    const memberId =
        document.getElementById("memberSelect").value;

    const bookId =
        document.getElementById("bookSelect").value;

    const issueDate =
        document.getElementById("issueDate").value;

    const dueDate =
        document.getElementById("dueDate").value;


    /* =========================
       BASIC VALIDATION
    ========================= */

    if (!memberId) {

        showToast(
            "Please select a member",
            "error"
        );

        return;
    }


    if (!bookId) {

        showToast(
            "Please select a book",
            "error"
        );

        return;
    }


    if (!issueDate) {

        showToast(
            "Please select issue date",
            "error"
        );

        return;
    }


    if (!dueDate) {

        showToast(
            "Please select due date",
            "error"
        );

        return;
    }


    /* =========================
       DATE VALIDATION
    ========================= */

    if (dueDate <= issueDate) {

        showToast(
            "Due date must be after issue date",
            "error"
        );

        return;
    }


    /* =========================
       FIND MEMBER
    ========================= */

    const member =
        members.find(
            m => Number(m.id) === Number(memberId)
        );


    if (!member) {

        showToast(
            "Member not found",
            "error"
        );

        return;
    }


    /* =========================
       MEMBER STATUS
    ========================= */

    if (
        String(member.membership_status)
            .toLowerCase() !== "active"
    ) {

        showToast(
            "This member is not active",
            "error"
        );

        return;
    }


    /* =========================
       MEMBER ISSUE LIMIT
    ========================= */

    const currentIssues =
        getMemberIssueCount(member.id);

    const issueLimit =
        Number(member.issue_limit || 3);


    if (currentIssues >= issueLimit) {

        showToast(
            `Issue limit reached (${issueLimit} books)`,
            "error"
        );

        return;
    }


    /* =========================
       FIND BOOK
    ========================= */

    const book =
        books.find(
            b => Number(b.id) === Number(bookId)
        );


    if (!book) {

        showToast(
            "Book not found",
            "error"
        );

        return;
    }


    /* =========================
       BOOK AVAILABILITY
    ========================= */

    const available =
        Number(book.available_copies || 0);


    if (available <= 0) {

        showToast(
            "No copies of this book are available",
            "error"
        );

        return;
    }


    /* =========================
       BUTTON LOADING
    ========================= */

    const button =
        document.getElementById("issueButton");


    if (button) {

        button.disabled = true;

        button.innerHTML = `

            <i class="fa-solid fa-spinner fa-spin"></i>

            Issuing...

        `;

    }


    try {

        /* =========================
           API REQUEST
        ========================= */

        const response =
            await fetch(ISSUES_API, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    book_id: Number(bookId),

                    member_id: Number(memberId),

                    issue_date: issueDate,

                    due_date: dueDate

                })

            });


        const contentType =
            response.headers.get("content-type") || "";


        let data;


        if (contentType.includes("application/json")) {

            data = await response.json();

        } else {

            const text =
                await response.text();

            console.error(
                "Server returned non-JSON:",
                text
            );

            throw new Error(
                "Server returned HTML instead of JSON. Check /api/issues backend route."
            );

        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                data.error ||
                "Unable to issue book"
            );

        }


        /* =========================
           SUCCESS
        ========================= */

        showToast(
            "Book issued successfully",
            "success"
        );


        /* =========================
           CLOSE MODAL
        ========================= */

        closeModal();


        /* =========================
           REFRESH DATA
        ========================= */

        await loadBooks();

        await loadIssues();


    } catch (error) {

        console.error(
            "Issue Book Error:",
            error
        );

        showToast(
            error.message ||
            "Failed to issue book",
            "error"
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML = `

                <i class="fa-solid fa-check"></i>

                Issue Book

            `;

        }

    }

}


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
                "Issues API did not return JSON. Make sure /api/issues exists."
            );

        }


        const data =
            await response.json();


        issues = Array.isArray(data)
            ? data
            : data.issues || data.data || [];


        updateStatistics();

        renderIssues(issues);


    } catch (error) {

        console.error(
            "Load Issues Error:",
            error
        );


        issues = [];

        updateStatistics();

        renderIssues([]);


        showToast(
            error.message ||
            "Unable to load issue transactions",
            "error"
        );

    }

}


/* =========================================================
   RENDER ISSUES
   ========================================================= */

function renderIssues(data) {

    const table =
        document.getElementById("issueTable");


    if (!table) return;


    if (!data || data.length === 0) {

        table.innerHTML = `

            <tr class="empty-row">

                <td colspan="7">

                    <i class="fa-solid fa-book-open"></i>

                    No issue transactions found.

                </td>

            </tr>

        `;

        updateResultText(0);

        return;

    }


    table.innerHTML =
        data.map(issue => {

            const member =
                findMemberForIssue(issue);

            const book =
                findBookForIssue(issue);


            const memberName =
                issue.member_name ||
                issue.name ||
                member?.name ||
                "Unknown Member";


            const memberCode =
                issue.member_code ||
                member?.member_code ||
                "";


            const bookTitle =
                issue.book_title ||
                issue.title ||
                book?.title ||
                "Unknown Book";


            const author =
                issue.author ||
                book?.author ||
                "";


            const issueId =
                issue.id ||
                "";


            const transactionId =
                issue.transaction_id ||
                issue.transactionId ||
                `ISS-${String(issueId).padStart(4, "0")}`;


            const issueDate =
                formatDate(issue.issue_date);


            const dueDate =
                formatDate(issue.due_date);


            const status =
                getDisplayStatus(issue);


            const statusClass =
                getStatusClass(status);


            const initials =
                getInitials(memberName);


            const isActive =
                status === "Issued" ||
                status === "Due Soon" ||
                status === "Overdue";


            return `

                <tr>

                    <td>

                        <span class="transaction-id">
                            ${escapeHTML(transactionId)}
                        </span>

                    </td>


                    <td>

                        <div class="member-info">

                            <div class="avatar">
                                ${initials}
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

                        <span class="badge ${statusClass}">
                            ${status}
                        </span>

                    </td>


                    <td>

                        <div class="actions">

                            ${
                                isActive
                                ? `
                                    <button
                                        type="button"
                                        class="action-btn return-btn"
                                        title="Return Book"
                                        onclick="goToReturn(${issueId})">

                                        <i class="fa-solid fa-arrow-left"></i>

                                    </button>
                                `
                                : ""
                            }

                        </div>

                    </td>

                </tr>

            `;

        }).join("");


    updateResultText(data.length);

}


/* =========================================================
   FIND MEMBER
   ========================================================= */

function findMemberForIssue(issue) {

    const memberId =
        issue.member_id ??
        issue.memberId;


    return members.find(
        member =>
            Number(member.id) === Number(memberId)
    );

}


/* =========================================================
   FIND BOOK
   ========================================================= */

function findBookForIssue(issue) {

    const bookId =
        issue.book_id ??
        issue.bookId;


    return books.find(
        book =>
            Number(book.id) === Number(bookId)
    );

}


/* =========================================================
   GET DISPLAY STATUS
   ========================================================= */

function getDisplayStatus(issue) {

    const status =
        String(issue.status || "")
            .toLowerCase();


    if (status === "returned") {
        return "Returned";
    }


    if (status === "overdue") {
        return "Overdue";
    }


    if (
        status === "issued" &&
        isDueSoon(issue.due_date)
    ) {

        return "Due Soon";

    }


    if (status === "issued") {
        return "Issued";
    }


    return capitalize(status || "Unknown");

}


/* =========================================================
   STATUS CLASS
   ========================================================= */

function getStatusClass(status) {

    switch (status) {

        case "Issued":
            return "issued";

        case "Returned":
            return "returned";

        case "Overdue":
            return "overdue";

        case "Due Soon":
            return "due-soon";

        default:
            return "";

    }

}


/* =========================================================
   CHECK DUE SOON
   ========================================================= */

function isDueSoon(dueDate) {

    if (!dueDate) return false;


    const today =
        startOfDay(new Date());


    const due =
        parseLocalDate(dueDate);


    const difference =
        Math.ceil(
            (due - today) /
            (1000 * 60 * 60 * 24)
        );


    return (
        difference >= 0 &&
        difference <= 3
    );

}


/* =========================================================
   UPDATE STATISTICS
   ========================================================= */

function updateStatistics() {

    let issued = 0;
    let returned = 0;
    let dueSoon = 0;
    let overdue = 0;


    issues.forEach(issue => {

        const status =
            String(issue.status || "")
                .toLowerCase();


        if (status === "returned") {

            returned++;

        } else if (status === "overdue") {

            overdue++;

        } else if (
            status === "issued" &&
            isDueSoon(issue.due_date)
        ) {

            dueSoon++;

        } else if (status === "issued") {

            issued++;

        }

    });


    setText(
        "totalIssued",
        issued
    );

    setText(
        "returnedBooks",
        returned
    );

    setText(
        "dueSoon",
        dueSoon
    );

    setText(
        "overdueBooks",
        overdue
    );

}


/* =========================================================
   SEARCH + FILTER
   ========================================================= */

function filterIssues() {

    const searchInput =
        document.getElementById("searchInput");


    const statusFilter =
        document.getElementById("statusFilter");


    const search =
        (searchInput?.value || "")
            .trim()
            .toLowerCase();


    const selectedStatus =
        (
            statusFilter?.value ||
            "all"
        ).toLowerCase();


    const filtered =
        issues.filter(issue => {

            const member =
                findMemberForIssue(issue);

            const book =
                findBookForIssue(issue);


            const memberName =
                issue.member_name ||
                issue.name ||
                member?.name ||
                "";


            const memberCode =
                issue.member_code ||
                member?.member_code ||
                "";


            const bookTitle =
                issue.book_title ||
                issue.title ||
                book?.title ||
                "";


            const transaction =
                issue.transaction_id ||
                `ISS-${String(issue.id || "").padStart(4,"0")}`;


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


            const displayStatus =
                getDisplayStatus(issue)
                    .toLowerCase();


            let matchesStatus = true;


            if (selectedStatus !== "all") {

                matchesStatus =
                    displayStatus === selectedStatus;

            }


            return (
                matchesSearch &&
                matchesStatus
            );

        });


    renderIssues(filtered);

}


/* =========================================================
   MODAL OPEN
   ========================================================= */

function openModal() {

    const modal =
        document.getElementById("issueModal");


    if (!modal) return;


    resetIssueForm();


    modal.classList.add("show");


    setDefaultDates();

}


/* =========================================================
   MODAL CLOSE
   ========================================================= */

function closeModal() {

    const modal =
        document.getElementById("issueModal");


    if (!modal) return;


    modal.classList.remove("show");


    resetIssueForm();

}


/* =========================================================
   RESET FORM
   ========================================================= */

function resetIssueForm() {

    const form =
        document.getElementById("issueForm");


    if (form) {
        form.reset();
    }


    const memberInfo =
        document.getElementById("memberInfo");


    const bookInfo =
        document.getElementById("bookInfo");


    const memberLimitBox =
        document.getElementById("memberLimitBox");


    const availabilityBox =
        document.getElementById("availabilityBox");


    if (memberInfo) {
        memberInfo.innerHTML = "";
    }


    if (bookInfo) {
        bookInfo.innerHTML = "";
    }


    if (memberLimitBox) {
        memberLimitBox.style.display = "none";
    }


    if (availabilityBox) {
        availabilityBox.style.display = "none";
    }


    setDefaultDates();

}


/* =========================================================
   DEFAULT DATES
   ========================================================= */

function setDefaultDates() {

    const issueDate =
        document.getElementById("issueDate");


    const dueDate =
        document.getElementById("dueDate");


    if (!issueDate || !dueDate) return;


    const today =
        new Date();


    const due =
        new Date(today);


    due.setDate(
        due.getDate() + 14
    );


    issueDate.value =
        formatInputDate(today);


    dueDate.value =
        formatInputDate(due);


    issueDate.min =
        formatInputDate(today);


    dueDate.min =
        formatInputDate(today);

}


/* =========================================================
   UPDATE DUE DATE
   ========================================================= */

function updateDueDate() {

    const issueDate =
        document.getElementById("issueDate");


    const dueDate =
        document.getElementById("dueDate");


    if (!issueDate || !dueDate) return;


    if (!issueDate.value) return;


    const issue =
        parseLocalDate(issueDate.value);


    const due =
        new Date(issue);


    due.setDate(
        due.getDate() + 14
    );


    dueDate.min =
        formatInputDate(issue);


    /*
       Only automatically change the due date
       if the existing date is before issue date.
    */

    if (
        !dueDate.value ||
        dueDate.value <= issueDate.value
    ) {

        dueDate.value =
            formatInputDate(due);

    }

}


/* =========================================================
   RETURN PAGE
   ========================================================= */

function goToReturn(issueId) {

    if (!issueId) return;


    /*
       Returns page can read this value later.
    */

    window.location.href =
        `returns.html?issue_id=${encodeURIComponent(issueId)}`;

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

function showToast(message, type = "success") {

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


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(() => {

            toast.classList.remove("show");

        }, 3000);

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


    if (isNaN(date.getTime())) {
        return value;
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
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    return `${year}-${month}-${day}`;

}


/* =========================================================
   LOCAL DATE PARSER
   ========================================================= */

function parseLocalDate(value) {

    if (value instanceof Date) {
        return new Date(value);
    }


    if (!value) {
        return new Date(NaN);
    }


    const clean =
        String(value)
            .substring(0, 10);


    const parts =
        clean.split("-");


    if (parts.length === 3) {

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


    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();

}


/* =========================================================
   CAPITALIZE
   ========================================================= */

function capitalize(value) {

    if (!value) return "";


    return String(value)
        .charAt(0)
        .toUpperCase() +
        String(value)
            .slice(1)
            .toLowerCase();

}


/* =========================================================
   SET TEXT
   ========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {
        element.textContent = value;
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
        `Showing ${count} issue transaction${count === 1 ? "" : "s"}`;

}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
   ========================================================= */

document.addEventListener("click", function(event) {

    const modal =
        document.getElementById("issueModal");


    if (!modal) return;


    if (
        event.target === modal
    ) {

        closeModal();

    }

});


/* =========================================================
   ESC KEY CLOSE MODAL
   ========================================================= */

document.addEventListener("keydown", function(event) {

    if (event.key !== "Escape") {
        return;
    }


    const modal =
        document.getElementById("issueModal");


    if (
        modal &&
        modal.classList.contains("show")
    ) {

        closeModal();

    }

});