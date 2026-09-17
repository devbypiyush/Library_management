/* =========================================================
   LIBRARIA - MEMBERS MODULE
   ========================================================= */

const MEMBERS_API = "http://localhost:5000/api/members";

let members = [];
let editingMemberId = null;
let toastTimer = null;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadMembers();

    const modal = document.getElementById("memberModal");

    if (modal) {
        modal.addEventListener("click", function (event) {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeModal();
        }
    });

});


/* =========================================================
   LOAD MEMBERS
   ========================================================= */

async function loadMembers() {

    const table = document.getElementById("memberTable");

    if (table) {
        table.innerHTML = `
            <tr>
                <td colspan="9" class="loading-row">
                    <i class="fa-solid fa-spinner fa-spin"></i>
                    <strong>Loading members...</strong>
                </td>
            </tr>
        `;
    }

    try {

        const response = await fetch(MEMBERS_API);

        const contentType =
            response.headers.get("content-type") || "";

        /*
           IMPORTANT:
           Prevents:
           SyntaxError: Unexpected token '<'
        */

        if (!contentType.includes("application/json")) {

            const text = await response.text();

            console.error(
                "Members API returned non-JSON:",
                text.substring(0, 500)
            );

            throw new Error(
                "Members API did not return JSON. Make sure server.js is running on port 5000."
            );
        }

        const result = await response.json();

        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to load members."
            );

        }

        members = Array.isArray(result)
            ? result
            : [];

        renderMembers(members);

        updateStatistics();

    }
    catch (error) {

        console.error(
            "Load Members Error:",
            error
        );

        if (table) {

            table.innerHTML = `
                <tr>
                    <td colspan="9" class="empty-row">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        <strong>
                            Unable to load members
                        </strong>

                        <small>
                            ${escapeHTML(error.message)}
                        </small>

                    </td>
                </tr>
            `;

        }

        showToast(
            error.message ||
            "Unable to load members.",
            "error"
        );

    }

}


/* =========================================================
   RENDER MEMBERS
   ========================================================= */

function renderMembers(data) {

    const table =
        document.getElementById("memberTable");

    if (!table) return;

    if (!data.length) {

        table.innerHTML = `
            <tr>
                <td colspan="9" class="empty-row">

                    <i class="fa-solid fa-users"></i>

                    <strong>
                        No members found
                    </strong>

                    <small>
                        Add your first member using the
                        "Add Member" button.
                    </small>

                </td>
            </tr>
        `;

        updateResultText(0);

        return;
    }


    table.innerHTML = "";


    data.forEach(function (member) {

        const row =
            document.createElement("tr");


        const initials =
            getInitials(member.name);


        const issueCount =
            Number(member.issue_count || 0);


        const overdueCount =
            Number(member.overdue_count || 0);


        const membershipType =
            String(
                member.membership_type || ""
            ).toLowerCase();


        const status =
            String(
                member.membership_status || ""
            ).toLowerCase();


        const expiryClass =
            getExpiryClass(member.expiry_date);


        row.innerHTML = `

            <td>

                <div class="member-info">

                    <div class="avatar">
                        ${escapeHTML(initials)}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(member.name)}
                        </strong>

                        <span>
                            ${escapeHTML(member.member_code)}
                        </span>

                    </div>

                </div>

            </td>


            <td>
                ${escapeHTML(member.email)}
            </td>


            <td>
                ${escapeHTML(member.phone || "-")}
            </td>


            <td>

                <span class="type-badge ${membershipType}">
                    ${escapeHTML(
                        member.membership_type
                    )}
                </span>

            </td>


            <td>
                ${formatDate(member.joined_date)}
            </td>


            <td class="${expiryClass}">
                ${formatDate(member.expiry_date)}
            </td>


            <td>

                <span
                    class="issue-count ${
                        overdueCount > 0
                            ? "overdue"
                            : ""
                    }"
                    title="${
                        overdueCount > 0
                            ? overdueCount +
                              " overdue issue(s)"
                            : "Active issues"
                    }"
                >
                    ${issueCount}
                </span>

            </td>


            <td>

                <span class="status-badge ${status}">
                    ${escapeHTML(
                        member.membership_status
                    )}
                </span>

            </td>


            <td>

                <div class="actions">

                    <button
                        class="action edit"
                        title="Edit Member"
                        onclick="editMember(${member.id})"
                    >

                        <i class="fa-solid fa-pen"></i>

                    </button>


                    <button
                        class="action delete"
                        title="Delete Member"
                        onclick="deleteMember(${member.id})"
                    >

                        <i class="fa-solid fa-trash"></i>

                    </button>

                </div>

            </td>

        `;


        table.appendChild(row);

    });


    updateResultText(data.length);

}


/* =========================================================
   OPEN ADD MEMBER MODAL
   ========================================================= */

function openAddModal() {

    editingMemberId = null;


    document.getElementById(
        "modalTitle"
    ).textContent = "Add New Member";


    const form =
        document.getElementById("memberForm");


    if (form) {
        form.reset();
    }


    const today =
        new Date();


    const nextYear =
        new Date(today);


    nextYear.setFullYear(
        today.getFullYear() + 1
    );


    document.getElementById(
        "joinedDate"
    ).value =
        toInputDate(today);


    document.getElementById(
        "expiryDate"
    ).value =
        toInputDate(nextYear);


    document.getElementById(
        "membershipType"
    ).value = "Student";


    document.getElementById(
        "membershipStatus"
    ).value = "Active";


    document.getElementById(
        "issueLimit"
    ).value = 3;


    document.getElementById(
        "memberModal"
    ).classList.add("show");


    setTimeout(function () {

        document.getElementById(
            "memberCode"
        ).focus();

    }, 100);

}


/* =========================================================
   EDIT MEMBER
   ========================================================= */

function editMember(id) {

    const member =
        members.find(function (item) {

            return Number(item.id) ===
                   Number(id);

        });


    if (!member) {

        showToast(
            "Member not found.",
            "error"
        );

        return;

    }


    editingMemberId =
        Number(id);


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit Member";


    document.getElementById(
        "memberCode"
    ).value =
        member.member_code || "";


    document.getElementById(
        "memberName"
    ).value =
        member.name || "";


    document.getElementById(
        "memberEmail"
    ).value =
        member.email || "";


    document.getElementById(
        "memberPhone"
    ).value =
        member.phone || "";


    document.getElementById(
        "membershipType"
    ).value =
        member.membership_type ||
        "Student";


    document.getElementById(
        "membershipStatus"
    ).value =
        member.membership_status ||
        "Active";


    document.getElementById(
        "joinedDate"
    ).value =
        formatInputDate(
            member.joined_date
        );


    document.getElementById(
        "expiryDate"
    ).value =
        formatInputDate(
            member.expiry_date
        );


    document.getElementById(
        "issueLimit"
    ).value =
        member.issue_limit || 3;


    document.getElementById(
        "memberModal"
    ).classList.add("show");

}


/* =========================================================
   SAVE MEMBER
   ========================================================= */

async function saveMember() {

    const form =
        document.getElementById("memberForm");


    if (!form.checkValidity()) {

        form.reportValidity();

        return;

    }


    const memberCode =
        document.getElementById(
            "memberCode"
        ).value.trim();


    const name =
        document.getElementById(
            "memberName"
        ).value.trim();


    const email =
        document.getElementById(
            "memberEmail"
        ).value.trim();


    const phone =
        document.getElementById(
            "memberPhone"
        ).value.trim();


    const membershipType =
        document.getElementById(
            "membershipType"
        ).value;


    const membershipStatus =
        document.getElementById(
            "membershipStatus"
        ).value;


    const joinedDate =
        document.getElementById(
            "joinedDate"
        ).value;


    const expiryDate =
        document.getElementById(
            "expiryDate"
        ).value;


    const issueLimit =
        Number(
            document.getElementById(
                "issueLimit"
            ).value
        );


    if (!memberCode) {

        showToast(
            "Please enter Member ID.",
            "error"
        );

        return;

    }


    if (!name) {

        showToast(
            "Please enter member name.",
            "error"
        );

        return;

    }


    if (!isValidEmail(email)) {

        showToast(
            "Please enter a valid email address.",
            "error"
        );

        return;

    }


    if (!expiryDate) {

        showToast(
            "Please select expiry date.",
            "error"
        );

        return;

    }


    if (expiryDate < joinedDate) {

        showToast(
            "Expiry date cannot be before joined date.",
            "error"
        );

        return;

    }


    if (issueLimit < 1) {

        showToast(
            "Issue limit must be at least 1.",
            "error"
        );

        return;

    }


    const payload = {

        member_code:
            memberCode,

        name:
            name,

        email:
            email,

        phone:
            phone || null,

        membership_type:
            membershipType,

        membership_status:
            membershipStatus,

        joined_date:
            joinedDate,

        expiry_date:
            expiryDate,

        issue_limit:
            issueLimit

    };


    const button =
        document.getElementById(
            "saveButton"
        );


    button.disabled = true;

    button.innerHTML =
        `<i class="fa-solid fa-spinner fa-spin"></i>
         Saving...`;


    try {

        let response;


        if (editingMemberId === null) {

            response =
                await fetch(
                    MEMBERS_API,
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

        }
        else {

            response =
                await fetch(
                    `${MEMBERS_API}/${editingMemberId}`,

                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(payload)
                    }
                );

        }


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (!contentType.includes(
            "application/json"
        )) {

            const text =
                await response.text();

            console.error(
                "Server response:",
                text.substring(0, 500)
            );

            throw new Error(
                "Server returned HTML instead of JSON. Check your backend server."
            );

        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to save member."
            );

        }


        showToast(

            editingMemberId === null

                ? "Member added successfully."

                : "Member updated successfully.",

            "success"

        );


        closeModal();


        await loadMembers();

    }
    catch (error) {

        console.error(
            "Save Member Error:",
            error
        );


        showToast(
            error.message ||
            "Unable to save member.",
            "error"
        );

    }
    finally {

        button.disabled = false;

        button.innerHTML =
            `<i class="fa-solid fa-check"></i>
             Save Member`;

    }

}


/* =========================================================
   DELETE MEMBER
   ========================================================= */

async function deleteMember(id) {

    const member =
        members.find(function (item) {

            return Number(item.id) ===
                   Number(id);

        });


    if (!member) {

        showToast(
            "Member not found.",
            "error"
        );

        return;

    }


    const confirmed =
        confirm(
            `Are you sure you want to delete "${member.name}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${MEMBERS_API}/${id}`,
                {
                    method: "DELETE"
                }
            );


        const contentType =
            response.headers.get(
                "content-type"
            ) || "";


        if (!contentType.includes(
            "application/json"
        )) {

            const text =
                await response.text();

            console.error(
                text.substring(0, 500)
            );

            throw new Error(
                "Server returned an unexpected response."
            );

        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to delete member."
            );

        }


        showToast(
            "Member deleted successfully.",
            "success"
        );


        await loadMembers();

    }
    catch (error) {

        console.error(
            "Delete Member Error:",
            error
        );


        showToast(
            error.message ||
            "Unable to delete member.",
            "error"
        );

    }

}


/* =========================================================
   SEARCH + FILTER
   ========================================================= */

function filterMembers() {

    const search =
        document.getElementById(
            "searchInput"
        ).value
         .trim()
         .toLowerCase();


    const membershipType =
        document.getElementById(
            "membershipFilter"
        ).value;


    const status =
        document.getElementById(
            "statusFilter"
        ).value;


    const filtered =
        members.filter(function (member) {

            const searchableText = `

                ${member.name || ""}

                ${member.email || ""}

                ${member.member_code || ""}

                ${member.phone || ""}

            `.toLowerCase();


            const searchMatch =
                searchableText.includes(
                    search
                );


            const typeMatch =
                membershipType === "all" ||
                member.membership_type ===
                    membershipType;


            const statusMatch =
                status === "all" ||
                member.membership_status ===
                    status;


            return (
                searchMatch &&
                typeMatch &&
                statusMatch
            );

        });


    renderMembers(filtered);

}


/* =========================================================
   STATISTICS
   ========================================================= */

function updateStatistics() {

    const total =
        members.length;


    const active =
        members.filter(function (member) {

            return member.membership_status ===
                   "Active";

        }).length;


    const suspended =
        members.filter(function (member) {

            return member.membership_status ===
                   "Suspended";

        }).length;


    const expired =
        members.filter(function (member) {

            return member.membership_status ===
                   "Expired";

        }).length;


    document.getElementById(
        "totalMembers"
    ).textContent = total;


    document.getElementById(
        "activeMembers"
    ).textContent = active;


    document.getElementById(
        "suspendedMembers"
    ).textContent = suspended;


    document.getElementById(
        "expiredMembers"
    ).textContent = expired;

}


/* =========================================================
   CLOSE MODAL
   ========================================================= */

function closeModal() {

    const modal =
        document.getElementById(
            "memberModal"
        );


    if (modal) {

        modal.classList.remove(
            "show"
        );

    }


    editingMemberId = null;

}


/* =========================================================
   SIDEBAR
   ========================================================= */

function toggleSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );


    if (sidebar) {

        sidebar.classList.toggle(
            "open"
        );

    }

}


/* =========================================================
   DATE FUNCTIONS
   ========================================================= */

function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(
            `${String(value).slice(0, 10)}T00:00:00`
        );


    if (Number.isNaN(
        date.getTime()
    )) {

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


function formatInputDate(value) {

    if (!value) {
        return "";
    }

    return String(value).slice(
        0,
        10
    );

}


function toInputDate(date) {

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
   EXPIRY STATUS
   ========================================================= */

function getExpiryClass(value) {

    if (!value) {
        return "";
    }


    const expiry =
        new Date(
            `${String(value).slice(0, 10)}T00:00:00`
        );


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const days =
        Math.ceil(
            (
                expiry - today
            ) / 86400000
        );


    if (days < 0) {

        return "expired-date";

    }


    if (days <= 30) {

        return "warning-date";

    }


    return "";

}


/* =========================================================
   INITIALS
   ========================================================= */

function getInitials(name) {

    if (!name) {
        return "NA";
    }


    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(function (part) {

            return part
                .charAt(0)
                .toUpperCase();

        })
        .join("");

}


/* =========================================================
   EMAIL VALIDATION
   ========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(email);

}


/* =========================================================
   RESULT TEXT
   ========================================================= */

function updateResultText(count) {

    const result =
        document.getElementById(
            "resultText"
        );


    if (!result) {
        return;
    }


    result.textContent =
        `Showing ${count} member${
            count === 1 ? "" : "s"
        }`;

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")

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


    if (!toast || !toastMessage) {

        alert(message);

        return;

    }


    const icon =
        toast.querySelector("i");


    toastMessage.textContent =
        message;


    toast.className =
        `toast show ${type}`;


    if (icon) {

        icon.className =
            type === "error"

                ? "fa-solid fa-circle-exclamation"

                : "fa-solid fa-circle-check";

    }


    clearTimeout(
        toastTimer
    );


    toastTimer =
        setTimeout(function () {

            toast.classList.remove(
                "show"
            );

        }, 3500);

}