/* =========================================================
   LIBRARIA - BOOK MANAGEMENT
   MySQL API Connected Version
   ========================================================= */

const API_BASE = "http://localhost:5000/api";
const BOOKS_API = `${API_BASE}/books`;
const ISSUES_API = `${API_BASE}/issues`;

let books = [];
let editingBookId = null;


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    loadBooks();
});


/* =========================================================
   LOAD BOOKS FROM MYSQL
   ========================================================= */

async function loadBooks() {

    const tableBody = document.getElementById("bookTable");

    if (!tableBody) {
        console.error("bookTable not found in HTML.");
        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center; padding:40px;">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading books...
            </td>
        </tr>
    `;

    try {

        const response = await fetch(BOOKS_API);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Failed to load books"
            );
        }

        books = Array.isArray(result.data)
            ? result.data
            : [];

        renderBooks();
        updateStatistics();
        loadIssueStatistics();

    } catch (error) {

        console.error("Load Books Error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding:40px;">
                    <i class="fa-solid fa-triangle-exclamation"
                       style="font-size:30px; margin-bottom:10px;"></i>
                    <br>
                    Unable to load books.
                    <br>
                    <small>${escapeHTML(error.message)}</small>
                </td>
            </tr>
        `;

        showToast(
            "Unable to connect to Libraria server.",
            "error"
        );
    }
}


/* =========================================================
   RENDER BOOKS
   ========================================================= */

function renderBooks() {

    const tableBody = document.getElementById("bookTable");

    if (!tableBody) {
        return;
    }

    const searchInput =
        document.getElementById("searchInput");

    const categoryFilter =
        document.getElementById("categoryFilter");

    const statusFilter =
        document.getElementById("statusFilter");

    const searchText =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const category =
        categoryFilter
            ? categoryFilter.value.toLowerCase()
            : "all";

    const status =
        statusFilter
            ? statusFilter.value.toLowerCase()
            : "all";


    /* FILTER BOOKS */

    const filteredBooks = books.filter(function (book) {

        const title =
            String(book.title || "").toLowerCase();

        const author =
            String(book.author || "").toLowerCase();

        const isbn =
            String(book.isbn || "").toLowerCase();

        const bookCategory =
            String(book.category || "").toLowerCase();

        const bookStatus =
            getBookStatus(book).key;


        const matchesSearch =
            title.includes(searchText) ||
            author.includes(searchText) ||
            isbn.includes(searchText);


        const matchesCategory =
            category === "all" ||
            category === "" ||
            bookCategory === category;


        const matchesStatus =
            status === "all" ||
            status === "" ||
            bookStatus === status;


        return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
        );
    });


    /* NO RESULTS */

    if (filteredBooks.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="7"
                    style="text-align:center; padding:50px;">

                    <i class="fa-solid fa-book-open"
                       style="font-size:35px;
                              margin-bottom:15px;"></i>

                    <br>

                    <strong>No books found</strong>

                    <br>

                    <small>
                        Try changing your search or filters.
                    </small>

                </td>
            </tr>
        `;

        updateResultText(0);

        return;
    }


    /* CLEAR TABLE */

    tableBody.innerHTML = "";


    /* CREATE ROWS */

    filteredBooks.forEach(function (book, index) {

        const statusInfo =
            getBookStatus(book);

        const coverClass =
            `cover-${(index % 6) + 1}`;

        const icon =
            getCategoryIcon(book.category);


        const row =
            document.createElement("tr");


        row.dataset.id = book.id;

        row.dataset.category =
            String(book.category || "")
                .toLowerCase();

        row.dataset.status =
            statusInfo.key;


        row.innerHTML = `

            <!-- BOOK -->

            <td>

                <div class="book-info">

                    <div class="book-cover ${coverClass}">
                        <i class="fa-solid ${icon}"></i>
                    </div>

                    <div class="book-name">

                        <strong>
                            ${escapeHTML(book.title)}
                        </strong>

                        <span>
                            ${escapeHTML(book.author || "-")}
                        </span>

                    </div>

                </div>

            </td>


            <!-- ISBN -->

            <td class="isbn">

                ${escapeHTML(book.isbn || "-")}

            </td>


            <!-- CATEGORY -->

            <td>

                <span class="badge available">
                    ${escapeHTML(book.category || "-")}
                </span>

            </td>


            <!-- AUTHOR -->

            <td>

                ${escapeHTML(book.author || "-")}

            </td>


            <!-- COPIES -->

            <td>

                ${Number(book.available_copies || 0)}
                /
                ${Number(book.total_copies || 0)}

            </td>


            <!-- STATUS -->

            <td>

                <span class="badge ${statusInfo.key}">
                    ${statusInfo.label}
                </span>

            </td>


            <!-- ACTIONS -->

            <td>

                <div class="actions">

                    <button
                        class="action-btn"
                        onclick="editBook(${book.id})"
                        title="Edit Book">

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        class="action-btn delete-btn"
                        onclick="deleteBook(${book.id})"
                        title="Delete Book">

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            </td>

        `;


        tableBody.appendChild(row);

    });


    updateResultText(filteredBooks.length);
}


/* =========================================================
   BOOK STATUS
   ========================================================= */

function getBookStatus(book) {

    const total =
        Number(book.total_copies || 0);

    const available =
        Number(book.available_copies || 0);


    if (available <= 0) {

        return {
            key: "unavailable",
            label: "Unavailable"
        };
    }


    if (available < total) {

        return {
            key: "borrowed",
            label: "Borrowed"
        };
    }


    return {
        key: "available",
        label: "Available"
    };
}


/* =========================================================
   CATEGORY ICON
   ========================================================= */

function getCategoryIcon(category) {

    const value =
        String(category || "")
            .toLowerCase();


    if (value.includes("technology")) {
        return "fa-code";
    }


    if (value.includes("fiction")) {
        return "fa-feather";
    }


    if (value.includes("business")) {
        return "fa-chart-line";
    }


    if (value.includes("science")) {
        return "fa-atom";
    }


    if (value.includes("history")) {
        return "fa-landmark";
    }


    if (value.includes("biography")) {
        return "fa-user";
    }


    return "fa-book";
}


/* =========================================================
   OPEN ADD MODAL
   ========================================================= */

function openAddModal() {

    editingBookId = null;


    document.getElementById("modalTitle").textContent =
        "Add New Book";


    document.getElementById("bookForm").reset();


    document.getElementById("bookCopies").value = 1;


    const statusField =
        document.getElementById("bookStatus");


    if (statusField) {

        statusField.value = "available";

        statusField.disabled = true;
    }


    document
        .getElementById("bookModal")
        .classList.add("show");
}


/* =========================================================
   EDIT BOOK
   ========================================================= */

function editBook(id) {

    const book =
        books.find(function (item) {

            return Number(item.id) === Number(id);

        });


    if (!book) {

        showToast(
            "Book not found.",
            "error"
        );

        return;
    }


    editingBookId = book.id;


    document.getElementById("modalTitle").textContent =
        "Edit Book";


    document.getElementById("bookTitle").value =
        book.title || "";


    document.getElementById("bookAuthor").value =
        book.author || "";


    document.getElementById("bookISBN").value =
        book.isbn || "";


    const categoryField =
        document.getElementById("bookCategory");


    if (categoryField) {

        categoryField.value =
            String(book.category || "")
                .toLowerCase();
    }


    document.getElementById("bookCopies").value =
        book.total_copies || 1;


    const statusField =
        document.getElementById("bookStatus");


    if (statusField) {

        statusField.value =
            getBookStatus(book).key;

        statusField.disabled = true;
    }


    document
        .getElementById("bookModal")
        .classList.add("show");
}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeModal() {

    const modal =
        document.getElementById("bookModal");


    if (modal) {

        modal.classList.remove("show");
    }


    editingBookId = null;
}


/* =========================================================
   SAVE BOOK
   ========================================================= */

async function saveBook() {

    const form =
        document.getElementById("bookForm");


    if (!form) {

        console.error("bookForm not found.");

        return;
    }


    /* VALIDATION */

    if (!form.checkValidity()) {

        form.reportValidity();

        return;
    }


    const title =
        document
            .getElementById("bookTitle")
            .value
            .trim();


    const author =
        document
            .getElementById("bookAuthor")
            .value
            .trim();


    const isbn =
        document
            .getElementById("bookISBN")
            .value
            .trim();


    const category =
        document
            .getElementById("bookCategory")
            .value;


    const totalCopies =
        Number(
            document
                .getElementById("bookCopies")
                .value
        );


    /* COPY VALIDATION */

    if (totalCopies <= 0) {

        showToast(
            "Copies must be greater than 0.",
            "error"
        );

        return;
    }


    /* BOOK DATA */

    const bookData = {

        title: title,

        author: author,

        isbn: isbn,

        category: formatCategory(category),

        total_copies: totalCopies

    };


    console.log(
        "Sending book data:",
        bookData
    );


    try {

        let response;


        /* =========================
           ADD NEW BOOK
           ========================= */

        if (editingBookId === null) {

            response =
                await fetch(
                    BOOKS_API,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(bookData)
                    }
                );

        }


        /* =========================
           UPDATE BOOK
           ========================= */

        else {

            response =
                await fetch(
                    `${BOOKS_API}/${editingBookId}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(bookData)
                    }
                );
        }


        /* READ RESPONSE */

        const result =
            await response.json();


        console.log(
            "Server response:",
            result
        );


        /* CHECK RESPONSE */

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to save book"
            );
        }


        /* SUCCESS MESSAGE */

        if (editingBookId === null) {

            showToast(
                "Book added successfully.",
                "success"
            );

        } else {

            showToast(
                "Book updated successfully.",
                "success"
            );
        }


        /* CLOSE */

        closeModal();


        /* REFRESH TABLE */

        await loadBooks();

    } catch (error) {

        console.error(
            "Save Book Error:",
            error
        );


        showToast(
            error.message ||
            "Unable to save book.",
            "error"
        );
    }
}


/* =========================================================
   DELETE BOOK
   ========================================================= */

async function deleteBook(id) {

    const book =
        books.find(function (item) {

            return Number(item.id) === Number(id);

        });


    if (!book) {

        showToast(
            "Book not found.",
            "error"
        );

        return;
    }


    const confirmed =
        confirm(
            `Are you sure you want to delete "${book.title}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${BOOKS_API}/${id}`,
                {
                    method: "DELETE"
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to delete book"
            );
        }


        showToast(
            "Book deleted successfully.",
            "success"
        );


        await loadBooks();

    } catch (error) {

        console.error(
            "Delete Book Error:",
            error
        );


        showToast(
            error.message ||
            "Unable to delete book.",
            "error"
        );
    }
}


/* =========================================================
   SEARCH + FILTER
   ========================================================= */

function filterBooks() {

    renderBooks();
}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {

    let totalCopies = 0;

    let availableCopies = 0;


    books.forEach(function (book) {

        totalCopies +=
            Number(book.total_copies || 0);

        availableCopies +=
            Number(book.available_copies || 0);

    });


    const totalBooks =
        document.getElementById("totalBooks");

    const availableBooks =
        document.getElementById("availableBooks");

    const issuedBooks =
        document.getElementById("issuedBooks");


    if (totalBooks) {

        totalBooks.textContent =
            totalCopies.toLocaleString();
    }


    if (availableBooks) {

        availableBooks.textContent =
            availableCopies.toLocaleString();
    }


    const issuedCopies =
        Math.max(
            totalCopies - availableCopies,
            0
        );


    if (issuedBooks) {

        issuedBooks.textContent =
            issuedCopies.toLocaleString();
    }
}


/* =========================================================
   ISSUE / OVERDUE STATISTICS
   ========================================================= */

async function loadIssueStatistics() {

    try {

        const response =
            await fetch(ISSUES_API);


        if (!response.ok) {
            return;
        }


        const result =
            await response.json();


        const issues =
            Array.isArray(result.data)
                ? result.data
                : [];


        const overdueCount =
            issues.filter(function (issue) {

                return String(
                    issue.status || ""
                ).toLowerCase() === "overdue";

            }).length;


        const overdueBooks =
            document.getElementById(
                "overdueBooks"
            );


        if (overdueBooks) {

            overdueBooks.textContent =
                overdueCount.toLocaleString();
        }

    } catch (error) {

        console.warn(
            "Unable to load overdue statistics:",
            error
        );
    }
}


/* =========================================================
   RESULT TEXT
   ========================================================= */

function updateResultText(count) {

    const resultText =
        document.querySelector(".result-text");


    if (!resultText) {
        return;
    }


    resultText.textContent =
        `Showing ${count} book${count === 1 ? "" : "s"}`;
}


/* =========================================================
   FORMAT CATEGORY
   ========================================================= */

function formatCategory(category) {

    if (!category) {
        return "";
    }


    return category
        .toLowerCase()
        .replace(/\b\w/g, function (letter) {

            return letter.toUpperCase();

        });
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


    if (!toast || !toastMessage) {

        alert(message);

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


    toast.classList.add("show");


    clearTimeout(
        window.librariaToastTimer
    );


    window.librariaToastTimer =
        setTimeout(function () {

            toast.classList.remove("show");

        }, 3000);
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

function toggleSidebar() {

    const sidebar =
        document.getElementById("sidebar");


    if (sidebar) {

        sidebar.classList.toggle("open");
    }
}


/* =========================================================
   MODAL EVENTS
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const modal =
            document.getElementById("bookModal");


        if (
            modal &&
            event.target === modal
        ) {

            closeModal();
        }
    }
);


document.addEventListener(
    "keydown",
    function (event) {

        if (event.key === "Escape") {

            closeModal();
        }
    }
);