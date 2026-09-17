const MEMBERS_API = "http://localhost:5000/api/members";
const BOOKS_API = "http://localhost:5000/api/books";
const RESERVATIONS_API = "http://localhost:5000/api/reservations";

let members = [];
let books = [];
let reservations = [];

let toastTimer = null;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setDefaultDates();

    loadMembers();
    loadBooks();
    loadReservations();

});


/* =========================================================
   LOAD MEMBERS
========================================================= */

async function loadMembers() {

    try {

        const response = await fetch(MEMBERS_API);

        if (!response.ok) {
            throw new Error(`Members API error: ${response.status}`);
        }

        const data = await response.json();

        members = Array.isArray(data)
            ? data
            : (data.members || data.data || []);

        populateMemberDropdown();

    } catch (error) {

        console.error("Load Members Error:", error);

        showToast(
            "Unable to load members. Make sure the backend is running.",
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

        const memberId = member.id;

        const memberName =
            member.name ||
            "Unknown Member";

        const memberCode =
            member.member_code ||
            member.memberCode ||
            "";

        const status =
            member.membership_status ||
            member.status ||
            "Active";

        const option = document.createElement("option");

        option.value = memberId;

        option.textContent =
            `${memberName} ${memberCode ? `(${memberCode})` : ""}`;

        option.dataset.status = status;

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
            throw new Error(`Books API error: ${response.status}`);
        }

        const data = await response.json();

        books = Array.isArray(data)
            ? data
            : (data.books || data.data || []);

        populateBookDropdown();

    } catch (error) {

        console.error("Load Books Error:", error);

        showToast(
            "Unable to load books. Make sure the backend is running.",
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
            Select book
        </option>
    `;

    books.forEach(book => {

        const availableCopies =
            Number(book.available_copies ?? book.availableCopies ?? 0);

        const option = document.createElement("option");

        option.value = book.id;

        option.textContent =
            `${book.title} — ${book.author}`;

        option.disabled = availableCopies <= 0;

        option.dataset.available = availableCopies;

        select.appendChild(option);

    });

}


/* =========================================================
   LOAD RESERVATIONS
========================================================= */

async function loadReservations() {

    try {

        const response = await fetch(RESERVATIONS_API);

        if (!response.ok) {
            throw new Error(`Reservations API error: ${response.status}`);
        }

        const data = await response.json();

        reservations = Array.isArray(data)
            ? data
            : (data.reservations || data.data || []);

        updateStats();

        renderReservations(reservations);

    } catch (error) {

        console.error("Load Reservations Error:", error);

        const table = document.getElementById("reservationTable");

        if (table) {

            table.innerHTML = `
                <tr class="empty-row">
                    <td colspan="7">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        <strong>
                            Unable to load reservations
                        </strong>

                        <br>

                        <span>
                            Make sure the backend server is running.
                        </span>

                    </td>
                </tr>
            `;

        }

        showToast(
            "Unable to load reservations.",
            "error"
        );

    }

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openModal() {

    const modal = document.getElementById("reservationModal");

    const form = document.getElementById("reservationForm");

    if (!modal) return;

    if (form) {
        form.reset();
    }

    setDefaultDates();

    hideMemberInfo();
    hideBookInfo();

    updateReservationInfo();

    const button =
        document.getElementById("reservationButton");

    if (button) {

        button.disabled = false;

        button.innerHTML = `
            <i class="fa-solid fa-calendar-check"></i>
            Reserve Book
        `;

    }

    modal.classList.add("show");

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeModal() {

    const modal =
        document.getElementById("reservationModal");

    if (modal) {
        modal.classList.remove("show");
    }

}


/* =========================================================
   MEMBER CHANGE
========================================================= */

function handleMemberChange() {

    const select =
        document.getElementById("memberSelect");

    const memberId = Number(select?.value);

    if (!memberId) {

        hideMemberInfo();

        return;
    }

    const member =
        members.find(m => Number(m.id) === memberId);

    if (!member) {

        hideMemberInfo();

        return;
    }

    const status =
        member.membership_status ||
        member.status ||
        "Active";

    const membershipType =
        member.membership_type ||
        member.membershipType ||
        "Member";

    const avatar =
        document.getElementById("memberInfoAvatar");

    const name =
        document.getElementById("memberInfoName");

    const type =
        document.getElementById("memberInfoType");

    const statusElement =
        document.getElementById("memberInfoStatus");

    if (avatar) {
        avatar.textContent =
            getInitials(member.name || "Member");
    }

    if (name) {
        name.textContent =
            member.name || "Unknown Member";
    }

    if (type) {
        type.textContent =
            `${membershipType} • ${member.member_code || ""}`;
    }

    if (statusElement) {

        statusElement.textContent =
            `Status: ${status}`;

        statusElement.style.color =
            status === "Active"
                ? "#10b981"
                : "#ef4444";

    }

    const info =
        document.getElementById("memberInfo");

    if (info) {
        info.style.display = "flex";
    }

}


/* =========================================================
   BOOK CHANGE
========================================================= */

function handleBookChange() {

    const select =
        document.getElementById("bookSelect");

    const bookId = Number(select?.value);

    if (!bookId) {

        hideBookInfo();

        return;
    }

    const book =
        books.find(b => Number(b.id) === bookId);

    if (!book) {

        hideBookInfo();

        return;
    }

    const title =
        document.getElementById("bookInfoTitle");

    const author =
        document.getElementById("bookInfoAuthor");

    const copies =
        document.getElementById("bookInfoCopies");

    const availableCopies =
        Number(
            book.available_copies ??
            book.availableCopies ??
            0
        );

    if (title) {
        title.textContent =
            book.title || "Unknown Book";
    }

    if (author) {
        author.textContent =
            book.author || "Unknown Author";
    }

    if (copies) {

        copies.textContent =
            `Available copies: ${availableCopies}`;

        copies.style.color =
            availableCopies > 0
                ? "#10b981"
                : "#ef4444";

    }

    const info =
        document.getElementById("bookInfo");

    if (info) {
        info.style.display = "flex";
    }

    updateReservationInfo();

}


/* =========================================================
   CREATE RESERVATION
========================================================= */

async function createReservation() {

    const memberSelect =
        document.getElementById("memberSelect");

    const bookSelect =
        document.getElementById("bookSelect");

    const reservationDate =
        document.getElementById("reservationDate");

    const expiryDate =
        document.getElementById("expiryDate");

    const memberId =
        Number(memberSelect?.value);

    const bookId =
        Number(bookSelect?.value);

    const reservationDateValue =
        reservationDate?.value;

    const expiryDateValue =
        expiryDate?.value;


    /* -------------------------
       VALIDATION
    ------------------------- */

    if (!memberId) {

        showToast(
            "Please select a member.",
            "error"
        );

        return;
    }


    if (!bookId) {

        showToast(
            "Please select a book.",
            "error"
        );

        return;
    }


    if (!reservationDateValue) {

        showToast(
            "Please select reservation date.",
            "error"
        );

        return;
    }


    if (!expiryDateValue) {

        showToast(
            "Please select expiry date.",
            "error"
        );

        return;
    }


    const start =
        new Date(reservationDateValue);

    const expiry =
        new Date(expiryDateValue);


    if (expiry < start) {

        showToast(
            "Expiry date cannot be before reservation date.",
            "error"
        );

        return;
    }


    const member =
        members.find(
            m => Number(m.id) === memberId
        );


    if (!member) {

        showToast(
            "Selected member was not found.",
            "error"
        );

        return;
    }


    const memberStatus =
        member.membership_status ||
        member.status ||
        "Active";


    if (memberStatus !== "Active") {

        showToast(
            "Only active members can make reservations.",
            "error"
        );

        return;
    }


    const book =
        books.find(
            b => Number(b.id) === bookId
        );


    if (!book) {

        showToast(
            "Selected book was not found.",
            "error"
        );

        return;
    }


    const availableCopies =
        Number(
            book.available_copies ??
            book.availableCopies ??
            0
        );


    /*
       A reservation is normally useful when the
       book is unavailable.

       However, we don't block reservations here
       because the backend should remain the final
       authority.
    */


    /* -------------------------
       BUTTON LOADING
    ------------------------- */

    const button =
        document.getElementById("reservationButton");

    if (button) {

        button.disabled = true;

        button.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Creating...
        `;

    }


    /* -------------------------
       PAYLOAD
    ------------------------- */

    const payload = {

        book_id: bookId,

        member_id: memberId,

        reservation_date:
            reservationDateValue,

        expiry_date:
            expiryDateValue

    };


    try {

        const response =
            await fetch(
                RESERVATIONS_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(payload)
                }
            );


        const contentType =
            response.headers
                .get("content-type") || "";


        let result;


        if (contentType.includes("application/json")) {

            result =
                await response.json();

        } else {

            const text =
                await response.text();

            throw new Error(
                `Server returned HTML instead of JSON. ${text.substring(0,100)}`
            );

        }


        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                `Server error: ${response.status}`
            );

        }


        showToast(
            "Reservation created successfully.",
            "success"
        );


        closeModal();


        await loadReservations();

        await loadBooks();


    } catch (error) {

        console.error(
            "Create Reservation Error:",
            error
        );


        showToast(
            error.message ||
            "Failed to create reservation.",
            "error"
        );


    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML = `
                <i class="fa-solid fa-calendar-check"></i>
                Reserve Book
            `;

        }

    }

}


/* =========================================================
   RENDER RESERVATIONS
========================================================= */

function renderReservations(data) {

    const table =
        document.getElementById("reservationTable");

    if (!table) return;


    if (!data || data.length === 0) {

        table.innerHTML = `
            <tr class="empty-row">

                <td colspan="7">

                    <i class="fa-solid fa-calendar-xmark"></i>

                    <strong>
                        No reservations found
                    </strong>

                    <br>

                    <span>
                        Create a new reservation to get started.
                    </span>

                </td>

            </tr>
        `;

        updateResultText(0);

        return;
    }


    table.innerHTML =
        data.map(
            reservation => {

                const id =
                    reservation.id;

                const memberName =
                    reservation.member_name ||
                    reservation.memberName ||
                    "Unknown Member";

                const memberCode =
                    reservation.member_code ||
                    reservation.memberCode ||
                    "";

                const bookTitle =
                    reservation.book_title ||
                    reservation.bookTitle ||
                    "Unknown Book";

                const author =
                    reservation.author ||
                    "Unknown Author";

                const reservationDate =
                    reservation.reservation_date ||
                    reservation.reservationDate;

                const expiryDate =
                    reservation.expiry_date ||
                    reservation.expiryDate;

                const status =
                    reservation.status ||
                    "Pending";


                const initials =
                    getInitials(memberName);


                const reservationCode =
                    `RES-${String(id).padStart(4,"0")}`;


                const statusClass =
                    getStatusClass(status);


                const actions =
                    getReservationActions(
                        id,
                        status
                    );


                return `

                    <tr>

                        <td>

                            <span class="transaction-id">
                                ${reservationCode}
                            </span>

                        </td>


                        <td>

                            <div class="member-info">

                                <div class="avatar">
                                    ${escapeHTML(initials)}
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
                                ${formatDate(reservationDate)}
                            </span>

                        </td>


                        <td>

                            <span class="date">
                                ${formatDate(expiryDate)}
                            </span>

                        </td>


                        <td>

                            <span class="badge ${statusClass}">
                                ${escapeHTML(status)}
                            </span>

                        </td>


                        <td>

                            <div class="actions">

                                ${actions}

                            </div>

                        </td>

                    </tr>

                `;

            }
        ).join("");


    updateResultText(data.length);

}


/* =========================================================
   RESERVATION ACTIONS
========================================================= */

function getReservationActions(id, status) {

    if (status === "Pending") {

        return `

            <button
                type="button"
                class="action-btn fulfill"
                title="Fulfill Reservation"
                onclick="updateReservationStatus(${id}, 'Fulfilled')">

                <i class="fa-solid fa-check"></i>

            </button>


            <button
                type="button"
                class="action-btn cancel"
                title="Cancel Reservation"
                onclick="updateReservationStatus(${id}, 'Cancelled')">

                <i class="fa-solid fa-xmark"></i>

            </button>

        `;

    }


    return `

        <button
            type="button"
            class="action-btn"
            title="View Reservation"
            onclick="viewReservation(${id})">

            <i class="fa-solid fa-eye"></i>

        </button>

    `;

}


/* =========================================================
   UPDATE RESERVATION STATUS
========================================================= */

async function updateReservationStatus(
    reservationId,
    status
) {

    const actionText =
        status === "Fulfilled"
            ? "fulfill"
            : "cancel";


    const confirmed =
        confirm(
            `Are you sure you want to ${actionText} this reservation?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${RESERVATIONS_API}/${reservationId}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            status: status
                        })
                }
            );


        const contentType =
            response.headers
                .get("content-type") || "";


        let result;


        if (contentType.includes("application/json")) {

            result =
                await response.json();

        } else {

            const text =
                await response.text();

            throw new Error(
                `Server returned HTML instead of JSON. ${text.substring(0,100)}`
            );

        }


        if (!response.ok) {

            throw new Error(
                result.message ||
                result.error ||
                `Server error: ${response.status}`
            );

        }


        showToast(
            `Reservation ${status.toLowerCase()} successfully.`,
            "success"
        );


        await loadReservations();


    } catch (error) {

        console.error(
            "Update Reservation Error:",
            error
        );


        showToast(
            error.message ||
            "Failed to update reservation.",
            "error"
        );

    }

}


/* =========================================================
   VIEW RESERVATION
========================================================= */

function viewReservation(id) {

    const reservation =
        reservations.find(
            r => Number(r.id) === Number(id)
        );


    if (!reservation) {

        showToast(
            "Reservation not found.",
            "error"
        );

        return;
    }


    const memberName =
        reservation.member_name ||
        reservation.memberName ||
        "Unknown Member";


    const bookTitle =
        reservation.book_title ||
        reservation.bookTitle ||
        "Unknown Book";


    const status =
        reservation.status ||
        "Pending";


    alert(
        `Reservation RES-${String(id).padStart(4,"0")}\n\n` +

        `Member: ${memberName}\n` +

        `Book: ${bookTitle}\n` +

        `Reserved On: ${formatDate(
            reservation.reservation_date ||
            reservation.reservationDate
        )}\n` +

        `Expiry: ${formatDate(
            reservation.expiry_date ||
            reservation.expiryDate
        )}\n` +

        `Status: ${status}`
    );

}


/* =========================================================
   FILTER RESERVATIONS
========================================================= */

function filterReservations() {

    const searchInput =
        document.getElementById("searchInput");

    const statusFilter =
        document.getElementById("statusFilter");


    const search =
        (searchInput?.value || "")
            .trim()
            .toLowerCase();


    const selectedStatus =
        statusFilter?.value || "all";


    const filtered =
        reservations.filter(
            reservation => {

                const memberName =
                    (
                        reservation.member_name ||
                        reservation.memberName ||
                        ""
                    ).toLowerCase();


                const memberCode =
                    (
                        reservation.member_code ||
                        reservation.memberCode ||
                        ""
                    ).toLowerCase();


                const bookTitle =
                    (
                        reservation.book_title ||
                        reservation.bookTitle ||
                        ""
                    ).toLowerCase();


                const author =
                    (
                        reservation.author ||
                        ""
                    ).toLowerCase();


                const reservationId =
                    String(
                        reservation.id || ""
                    ).toLowerCase();


                const status =
                    reservation.status ||
                    "";


                const matchesSearch =
                    !search ||

                    memberName.includes(search) ||

                    memberCode.includes(search) ||

                    bookTitle.includes(search) ||

                    author.includes(search) ||

                    reservationId.includes(search);


                const matchesStatus =
                    selectedStatus === "all" ||

                    status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );


    renderReservations(filtered);

}


/* =========================================================
   UPDATE STATISTICS
========================================================= */

function updateStats() {

    const total =
        reservations.length;


    const pending =
        reservations.filter(
            r => r.status === "Pending"
        ).length;


    const fulfilled =
        reservations.filter(
            r => r.status === "Fulfilled"
        ).length;


    const expired =
        reservations.filter(
            r =>
                r.status === "Expired" ||
                r.status === "Cancelled"
        ).length;


    setText(
        "totalReservations",
        total
    );


    setText(
        "pendingReservations",
        pending
    );


    setText(
        "fulfilledReservations",
        fulfilled
    );


    setText(
        "expiredReservations",
        expired
    );

}


/* =========================================================
   DEFAULT DATES
========================================================= */

function setDefaultDates() {

    const reservationDate =
        document.getElementById("reservationDate");

    const expiryDate =
        document.getElementById("expiryDate");


    const today =
        new Date();


    const todayString =
        formatInputDate(today);


    const defaultExpiry =
        new Date(today);


    /*
       Default reservation expiry:
       7 days from reservation date.
    */

    defaultExpiry.setDate(
        defaultExpiry.getDate() + 7
    );


    if (reservationDate) {

        reservationDate.value =
            todayString;

        reservationDate.min =
            todayString;

    }


    if (expiryDate) {

        expiryDate.value =
            formatInputDate(defaultExpiry);

        expiryDate.min =
            todayString;

    }


    updateReservationInfo();

}


/* =========================================================
   DATE CHANGE
========================================================= */

document.addEventListener(
    "change",
    event => {

        if (
            event.target.id ===
            "reservationDate"
        ) {

            updateExpiryMinimum();

            updateReservationInfo();

        }


        if (
            event.target.id ===
            "expiryDate"
        ) {

            updateReservationInfo();

        }

    }
);


/* =========================================================
   UPDATE EXPIRY MINIMUM
========================================================= */

function updateExpiryMinimum() {

    const reservationDate =
        document.getElementById("reservationDate");

    const expiryDate =
        document.getElementById("expiryDate");


    if (
        !reservationDate ||
        !expiryDate ||
        !reservationDate.value
    ) {
        return;
    }


    expiryDate.min =
        reservationDate.value;


    if (
        expiryDate.value &&
        expiryDate.value <
        reservationDate.value
    ) {

        expiryDate.value =
            reservationDate.value;

    }

}


/* =========================================================
   RESERVATION INFORMATION
========================================================= */

function updateReservationInfo() {

    const reservationDate =
        document.getElementById("reservationDate");

    const expiryDate =
        document.getElementById("expiryDate");


    const periodElement =
        document.getElementById(
            "reservationPeriod"
        );


    const availabilityElement =
        document.getElementById(
            "reservationAvailability"
        );


    if (
        reservationDate?.value &&
        expiryDate?.value
    ) {

        const start =
            new Date(
                reservationDate.value
            );


        const end =
            new Date(
                expiryDate.value
            );


        const difference =
            end.getTime() -
            start.getTime();


        const days =
            Math.ceil(
                difference /
                (1000 * 60 * 60 * 24)
            );


        if (periodElement) {

            periodElement.textContent =
                days >= 0
                    ? `${days} day${days === 1 ? "" : "s"}`
                    : "Invalid";

        }

    }


    const bookSelect =
        document.getElementById("bookSelect");


    const bookId =
        Number(bookSelect?.value);


    if (!bookId) {

        if (availabilityElement) {

            availabilityElement.textContent =
                "Select a book";

        }

        return;
    }


    const book =
        books.find(
            b => Number(b.id) === bookId
        );


    if (!book) return;


    const available =
        Number(
            book.available_copies ??
            book.availableCopies ??
            0
        );


    if (availabilityElement) {

        availabilityElement.textContent =
            available > 0
                ? `${available} available`
                : "Currently unavailable";


        availabilityElement.style.color =
            available > 0
                ? "#10b981"
                : "#ef4444";

    }

}


/* =========================================================
   HIDE MEMBER INFO
========================================================= */

function hideMemberInfo() {

    const info =
        document.getElementById("memberInfo");

    if (info) {
        info.style.display = "none";
    }

}


/* =========================================================
   HIDE BOOK INFO
========================================================= */

function hideBookInfo() {

    const info =
        document.getElementById("bookInfo");

    if (info) {
        info.style.display = "none";
    }

}


/* =========================================================
   STATUS CLASS
========================================================= */

function getStatusClass(status) {

    switch (status) {

        case "Pending":
            return "pending";

        case "Fulfilled":
            return "fulfilled";

        case "Cancelled":
            return "cancelled";

        case "Expired":
            return "expired";

        default:
            return "pending";

    }

}


/* =========================================================
   RESULT TEXT
========================================================= */

function updateResultText(count) {

    const result =
        document.getElementById("resultText");

    if (!result) return;


    result.textContent =
        `Showing ${count} reservation${count === 1 ? "" : "s"}`;

}


/* =========================================================
   SET TEXT
========================================================= */

function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value;

    }

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
        document.getElementById(
            "toastMessage"
        );


    if (!toast || !toastMessage) {
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


    clearTimeout(toastTimer);


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove("show");

            },
            3000
        );

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
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    event => {

        const modal =
            document.getElementById(
                "reservationModal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeModal();

        }

    }
);


/* =========================================================
   ESC KEY
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key === "Escape") {

            closeModal();

        }

    }
);


/* =========================================================
   FORMAT DATE FOR INPUT
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
   FORMAT DATE FOR DISPLAY
========================================================= */

function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (Number.isNaN(date.getTime())) {

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


    if (parts.length === 1) {

        return parts[0]
            .substring(0, 2)
            .toUpperCase();

    }


    return (
        parts[0][0] +
        parts[parts.length - 1][0]
    ).toUpperCase();

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