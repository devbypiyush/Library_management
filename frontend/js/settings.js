/* =========================================================
   LIBRARIA - SETTINGS
   ========================================================= */

const API_BASE = "http://localhost:5000/api";

const SETTINGS_API = `${API_BASE}/settings`;
const HEALTH_API = `${API_BASE}/health`;
const OVERDUE_API = `${API_BASE}/system/refresh-overdue`;


/* =========================================================
   SIDEBAR
   ========================================================= */

function toggleSidebar() {

    const sidebar = document.getElementById("sidebar");

    if (!sidebar) return;

    sidebar.classList.toggle("open");
}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer = null;

function showToast(message, type = "success") {

    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");
    const toastIcon = document.getElementById("toastIcon");

    if (!toast || !toastMessage || !toastIcon) return;

    toastMessage.textContent = message;

    if (type === "error") {

        toastIcon.className = "fa-solid fa-xmark";

    } else if (type === "warning") {

        toastIcon.className =
            "fa-solid fa-triangle-exclamation";

    } else {

        toastIcon.className = "fa-solid fa-check";
    }

    toast.classList.add("show");

    if (toastTimer) {
        clearTimeout(toastTimer);
    }

    toastTimer = setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);
}


/* =========================================================
   SETTINGS TABS
   ========================================================= */

function initializeSettingsTabs() {

    const tabs =
        document.querySelectorAll(".settings-tab");

    const panels =
        document.querySelectorAll(".settings-panel");


    tabs.forEach(tab => {

        tab.addEventListener("click", () => {

            const target = tab.dataset.target;

            if (!target) return;


            tabs.forEach(item => {

                item.classList.remove("active");

            });


            panels.forEach(panel => {

                panel.classList.remove("active");

            });


            tab.classList.add("active");


            const targetPanel =
                document.getElementById(target);


            if (targetPanel) {

                targetPanel.classList.add("active");

            }

        });

    });
}


/* =========================================================
   LOAD SETTINGS FROM MYSQL
   ========================================================= */

async function loadSettings() {

    try {

        const response =
            await fetch(
                SETTINGS_API,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        const settings =
            await response.json();


        populateSettings(settings);


    } catch (error) {

        console.error(
            "LOAD SETTINGS ERROR:",
            error
        );


        showToast(
            "Unable to load settings from server.",
            "error"
        );
    }
}


/* =========================================================
   POPULATE SETTINGS UI
   ========================================================= */

function populateSettings(settings) {

    /* -----------------------------------------------------
       LIBRARY PROFILE
       ----------------------------------------------------- */

    setValue(
        "libraryName",
        settings.library_name
    );


    setValue(
        "libraryEmail",
        settings.library_email
    );


    setValue(
        "libraryPhone",
        settings.library_phone
    );


    setValue(
        "libraryWebsite",
        settings.library_website
    );


    setValue(
        "libraryAddress",
        settings.library_address
    );


    /* -----------------------------------------------------
       LIBRARY RULES
       ----------------------------------------------------- */

    setValue(
        "issuePeriod",
        settings.issue_period
    );


    setValue(
        "maxBooks",
        settings.max_books_per_member
    );


    setValue(
        "finePerDay",
        settings.fine_per_day
    );


    setValue(
        "reservationPeriod",
        settings.reservation_period
    );


    /* -----------------------------------------------------
       NOTIFICATIONS
       ----------------------------------------------------- */

    setChecked(
        "dueReminder",
        Boolean(settings.due_reminder)
    );


    setChecked(
        "overdueNotification",
        Boolean(settings.overdue_notification)
    );


    setChecked(
        "reservationNotification",
        Boolean(settings.reservation_notification)
    );


    setChecked(
        "memberNotification",
        Boolean(settings.member_notification)
    );
}


/* =========================================================
   SAVE ALL SETTINGS TO MYSQL
   ========================================================= */

async function saveAllSettings() {

    try {

        const settings = collectSettings();


        const validation =
            validateSettings(settings);


        if (!validation.valid) {

            showToast(
                validation.message,
                "error"
            );

            return false;
        }


        const response =
            await fetch(
                SETTINGS_API,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(settings)
                }
            );


        let data = null;


        try {

            data =
                await response.json();

        } catch (error) {

            data = null;
        }


        if (!response.ok) {

            throw new Error(
                data?.message ||
                `HTTP ${response.status}`
            );
        }


        /*
         * If backend returns the updated settings,
         * update the UI with the actual MySQL values.
         */

        if (data?.settings) {

            populateSettings(
                data.settings
            );
        }


        return true;


    } catch (error) {

        console.error(
            "SAVE SETTINGS ERROR:",
            error
        );


        showToast(
            error.message ||
            "Unable to save settings.",
            "error"
        );


        return false;
    }
}


/* =========================================================
   COLLECT SETTINGS
   ========================================================= */

function collectSettings() {

    return {

        library_name:
            getValue("libraryName").trim(),

        library_email:
            getValue("libraryEmail").trim(),

        library_phone:
            getValue("libraryPhone").trim(),

        library_website:
            getValue("libraryWebsite").trim(),

        library_address:
            getValue("libraryAddress").trim(),


        issue_period:
            getNumberValue("issuePeriod"),

        max_books_per_member:
            getNumberValue("maxBooks"),

        fine_per_day:
            getNumberValue("finePerDay"),

        reservation_period:
            getNumberValue(
                "reservationPeriod"
            ),


        due_reminder:
            getChecked("dueReminder"),

        overdue_notification:
            getChecked(
                "overdueNotification"
            ),

        reservation_notification:
            getChecked(
                "reservationNotification"
            ),

        member_notification:
            getChecked(
                "memberNotification"
            )
    };
}


/* =========================================================
   VALIDATE SETTINGS
   ========================================================= */

function validateSettings(settings) {

    if (!settings.library_name) {

        return {

            valid: false,

            message:
                "Library name is required."
        };
    }


    if (
        settings.library_email &&
        !isValidEmail(
            settings.library_email
        )
    ) {

        return {

            valid: false,

            message:
                "Please enter a valid library email."
        };
    }


    if (
        settings.issue_period < 1
    ) {

        return {

            valid: false,

            message:
                "Issue period must be at least 1 day."
        };
    }


    if (
        settings.max_books_per_member < 1
    ) {

        return {

            valid: false,

            message:
                "Maximum books must be at least 1."
        };
    }


    if (
        settings.fine_per_day < 0
    ) {

        return {

            valid: false,

            message:
                "Fine per day cannot be negative."
        };
    }


    if (
        settings.reservation_period < 1
    ) {

        return {

            valid: false,

            message:
                "Reservation validity must be at least 1 day."
        };
    }


    return {
        valid: true,
        message: ""
    };
}


/* =========================================================
   SAVE LIBRARY PROFILE
   ========================================================= */

async function saveLibraryProfile() {

    const settings =
        collectSettings();


    const validation =
        validateSettings(settings);


    if (!validation.valid) {

        showToast(
            validation.message,
            "error"
        );

        return;
    }


    const success =
        await saveAllSettings();


    if (success) {

        showToast(
            "Library profile saved successfully."
        );
    }
}


/* =========================================================
   RESET LIBRARY PROFILE
   ========================================================= */

async function resetLibraryForm() {

    const confirmed =
        confirm(
            "Reset the library profile to its default values?"
        );


    if (!confirmed) return;


    setValue(
        "libraryName",
        "Libraria Library"
    );


    setValue(
        "libraryEmail",
        "library@libraria.com"
    );


    setValue(
        "libraryPhone",
        "+91 00000 00000"
    );


    setValue(
        "libraryWebsite",
        ""
    );


    setValue(
        "libraryAddress",
        ""
    );


    const success =
        await saveAllSettings();


    if (success) {

        showToast(
            "Library profile has been reset."
        );
    }
}


/* =========================================================
   SAVE LIBRARY RULES
   ========================================================= */

async function saveLibraryRules() {

    const settings =
        collectSettings();


    const validation =
        validateSettings(settings);


    if (!validation.valid) {

        showToast(
            validation.message,
            "error"
        );

        return;
    }


    const success =
        await saveAllSettings();


    if (success) {

        showToast(
            "Library rules saved successfully."
        );
    }
}


/* =========================================================
   RESET LIBRARY RULES
   ========================================================= */

async function resetRules() {

    const confirmed =
        confirm(
            "Reset all library rules to their default values?"
        );


    if (!confirmed) return;


    setValue(
        "issuePeriod",
        14
    );


    setValue(
        "maxBooks",
        3
    );


    setValue(
        "finePerDay",
        10
    );


    setValue(
        "reservationPeriod",
        3
    );


    const success =
        await saveAllSettings();


    if (success) {

        showToast(
            "Library rules have been reset."
        );
    }
}


/* =========================================================
   SAVE NOTIFICATION SETTINGS
   ========================================================= */

async function saveNotificationSettings() {

    const success =
        await saveAllSettings();


    if (success) {

        showToast(
            "Notification preferences saved successfully."
        );
    }
}


/* =========================================================
   SYSTEM STATUS
   ========================================================= */

async function checkSystemStatus(
    showMessage = true
) {

    const apiStatus =
        document.getElementById(
            "apiStatus"
        );

    const databaseStatus =
        document.getElementById(
            "databaseStatus"
        );


    setStatus(
        apiStatus,
        "Checking...",
        "checking"
    );


    setStatus(
        databaseStatus,
        "Checking...",
        "checking"
    );


    try {

        const response =
            await fetch(
                HEALTH_API,
                {
                    method: "GET",
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );
        }


        setStatus(
            apiStatus,
            "Online",
            "online"
        );


        setStatus(
            databaseStatus,
            "Connected",
            "online"
        );


        if (showMessage) {

            showToast(
                "Libraria API and database are connected."
            );
        }


        return true;


    } catch (error) {

        console.error(
            "SYSTEM STATUS ERROR:",
            error
        );


        setStatus(
            apiStatus,
            "Offline",
            "offline"
        );


        setStatus(
            databaseStatus,
            "Unavailable",
            "offline"
        );


        if (showMessage) {

            showToast(
                "Unable to connect to Libraria API.",
                "error"
            );
        }


        return false;
    }
}


/* =========================================================
   SET STATUS
   ========================================================= */

function setStatus(
    element,
    text,
    status
) {

    if (!element) return;


    let dotColor =
        "#10b981";


    if (status === "offline") {

        dotColor =
            "#ef4444";

    } else if (status === "checking") {

        dotColor =
            "#f59e0b";
    }


    element.innerHTML = `

        <span
            class="status-dot"
            style="background:${dotColor};">
        </span>

        ${text}

    `;
}


/* =========================================================
   REFRESH OVERDUE
   ========================================================= */

async function refreshOverdue() {

    const confirmed =
        confirm(
            "Refresh overdue book statuses now?"
        );


    if (!confirmed) return;


    try {

        showToast(
            "Refreshing overdue statuses...",
            "warning"
        );


        const response =
            await fetch(
                OVERDUE_API,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json"
                    }
                }
            );


        let data = null;


        try {

            data =
                await response.json();

        } catch (error) {

            data = null;
        }


        if (!response.ok) {

            throw new Error(
                data?.message ||
                `HTTP ${response.status}`
            );
        }


        const count =
            data?.updated ??
            data?.updatedCount ??
            data?.affectedRows;


        if (
            typeof count === "number"
        ) {

            showToast(
                `${count} overdue record(s) refreshed successfully.`
            );

        } else {

            showToast(
                "Overdue statuses refreshed successfully."
            );
        }


    } catch (error) {

        console.error(
            "REFRESH OVERDUE ERROR:",
            error
        );


        showToast(
            error.message ||
            "Unable to refresh overdue statuses.",
            "error"
        );
    }
}


/* =========================================================
   CLEAR LOCAL SETTINGS
   ========================================================= */

function clearLocalSettings() {

    const confirmed =
        confirm(
            "Clear locally stored Libraria settings from this browser?"
        );


    if (!confirmed) return;


    localStorage.removeItem(
        "librariaSettings"
    );


    showToast(
        "Local settings cleared successfully."
    );


    /*
     * Reload from MySQL.
     */

    loadSettings();
}


/* =========================================================
   HELPER FUNCTIONS
   ========================================================= */

function getValue(id) {

    const element =
        document.getElementById(id);


    if (!element) return "";


    return element.value;
}


function setValue(id, value) {

    const element =
        document.getElementById(id);


    if (!element) return;


    element.value =
        value ?? "";
}


function getNumberValue(id) {

    const value =
        Number(
            getValue(id)
        );


    if (Number.isNaN(value)) {

        return 0;
    }


    return value;
}


function getChecked(id) {

    const element =
        document.getElementById(id);


    if (!element) return false;


    return element.checked;
}


function setChecked(id, value) {

    const element =
        document.getElementById(id);


    if (!element) return;


    element.checked =
        Boolean(value);
}


function isValidEmail(email) {

    if (!email) return true;


    const pattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    return pattern.test(email);
}


/* =========================================================
   MOBILE SIDEBAR
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const sidebar =
            document.getElementById(
                "sidebar"
            );

        const menuButton =
            document.querySelector(
                ".mobile-menu"
            );


        if (
            !sidebar ||
            !menuButton
        ) {
            return;
        }


        if (
            window.innerWidth <= 850 &&
            sidebar.classList.contains("open") &&
            !sidebar.contains(event.target) &&
            !menuButton.contains(event.target)
        ) {

            sidebar.classList.remove(
                "open"
            );
        }

    }
);


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        initializeSettingsTabs();

        /*
         * Load settings directly from MySQL.
         */
        await loadSettings();

        /*
         * Check backend/database.
         */
        await checkSystemStatus(false);

    }
);