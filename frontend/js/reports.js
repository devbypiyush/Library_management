// ============================================================
// LIBRARIA - REPORTS
// ============================================================

const API_BASE = "http://localhost:5000/api";

const REPORT_APIS = {
    overview: `${API_BASE}/reports/overview`,
    books: `${API_BASE}/reports/books`,
    categories: `${API_BASE}/reports/categories`,
    issues: `${API_BASE}/reports/issues`,
    returns: `${API_BASE}/reports/returns`,
    members: `${API_BASE}/reports/members`,
    fines: `${API_BASE}/reports/fines`,
    mostBorrowed: `${API_BASE}/reports/most-borrowed`,
    summary: `${API_BASE}/reports/summary`
};

let reportData = {
    overview: null,
    books: [],
    categories: [],
    issues: [],
    returns: [],
    members: [],
    fines: [],
    mostBorrowed: [],
    summary: null
};


// ============================================================
// PAGE LOAD
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    setDefaultDates();

    loadReports();

    const reportType = document.getElementById("reportType");
    const fromDate = document.getElementById("fromDate");
    const toDate = document.getElementById("toDate");

    if (reportType) {
        reportType.addEventListener("change", loadReports);
    }

    if (fromDate) {
        fromDate.addEventListener("change", loadReports);
    }

    if (toDate) {
        toDate.addEventListener("change", loadReports);
    }
});


// ============================================================
// LOAD ALL REPORTS
// ============================================================

async function loadReports() {

    showLoadingState();

    try {

        const fromDate =
            document.getElementById("fromDate")?.value || "";

        const toDate =
            document.getElementById("toDate")?.value || "";

        const query = new URLSearchParams();

        if (fromDate) {
            query.append("from", fromDate);
        }

        if (toDate) {
            query.append("to", toDate);
        }

        const queryString = query.toString();

        const suffix =
            queryString ? `?${queryString}` : "";

        const results = await Promise.allSettled([

            fetchJSON(REPORT_APIS.overview + suffix),

            fetchJSON(REPORT_APIS.books + suffix),

            fetchJSON(REPORT_APIS.categories + suffix),

            fetchJSON(REPORT_APIS.issues + suffix),

            fetchJSON(REPORT_APIS.returns + suffix),

            fetchJSON(REPORT_APIS.members + suffix),

            fetchJSON(REPORT_APIS.fines + suffix),

            fetchJSON(REPORT_APIS.mostBorrowed + suffix),

            fetchJSON(REPORT_APIS.summary + suffix)

        ]);

        reportData.overview =
            getResult(results[0]);

        reportData.books =
            normalizeArray(getResult(results[1]));

        reportData.categories =
            normalizeArray(getResult(results[2]));

        reportData.issues =
            normalizeArray(getResult(results[3]));

        reportData.returns =
            normalizeArray(getResult(results[4]));

        reportData.members =
            normalizeArray(getResult(results[5]));

        reportData.fines =
            normalizeArray(getResult(results[6]));

        reportData.mostBorrowed =
            normalizeArray(getResult(results[7]));

        reportData.summary =
            getResult(results[8]);


        renderOverview();

        renderIssueReport();

        renderCategoryReport();

        renderMemberReport();

        renderFineReport();

        renderMostBorrowed();

        renderMonthlyAnalytics();

        renderActivityChart();

    } catch (error) {

        console.error(
            "Reports loading error:",
            error
        );

        showToast(
            "Unable to load reports. Please make sure the backend is running.",
            "error"
        );
    }
}


// ============================================================
// FETCH HELPER
// ============================================================

async function fetchJSON(url) {

    const response = await fetch(url);

    const contentType =
        response.headers.get("content-type") || "";

    if (!response.ok) {

        throw new Error(
            `Request failed: ${response.status} ${response.statusText}`
        );
    }

    if (!contentType.includes("application/json")) {

        const text = await response.text();

        throw new Error(
            `Server returned non-JSON response: ${text.substring(0, 100)}`
        );
    }

    return await response.json();
}


// ============================================================
// RESULT HELPERS
// ============================================================

function getResult(result) {

    if (result.status === "fulfilled") {
        return result.value;
    }

    console.warn(
        "Report API failed:",
        result.reason
    );

    return null;
}


function normalizeArray(data) {

    if (!data) {
        return [];
    }

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    if (Array.isArray(data.rows)) {
        return data.rows;
    }

    if (Array.isArray(data.results)) {
        return data.results;
    }

    return [];
}


// ============================================================
// OVERVIEW
// ============================================================

function renderOverview() {

    const overview =
        reportData.overview || {};

    const totalBooks =
        getNumber(
            overview.totalBooks ??
            overview.total_books ??
            overview.books
        );

    const totalMembers =
        getNumber(
            overview.totalMembers ??
            overview.total_members ??
            overview.members
        );

    const totalIssued =
        getNumber(
            overview.totalIssued ??
            overview.total_issued ??
            overview.issuedBooks ??
            overview.issued_books
        );

    const totalFines =
        getNumber(
            overview.totalFines ??
            overview.total_fines ??
            overview.fines
        );

    setText(
        "totalBooks",
        totalBooks
    );

    setText(
        "totalMembers",
        totalMembers
    );

    setText(
        "totalIssued",
        totalIssued
    );

    setText(
        "totalFines",
        formatCurrency(totalFines)
    );
}


// ============================================================
// ISSUE REPORT
// ============================================================

function renderIssueReport() {

    const table =
        document.getElementById(
            "issueReportTable"
        );

    if (!table) {
        return;
    }

    if (!reportData.issues.length) {

        table.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    No issue records found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        reportData.issues.map(
            (item, index) => {

                const book =
                    item.book_title ||
                    item.bookTitle ||
                    item.title ||
                    item.book ||
                    "—";

                const member =
                    item.member_name ||
                    item.memberName ||
                    item.name ||
                    item.member ||
                    "—";

                const issueDate =
                    item.issue_date ||
                    item.issueDate ||
                    "—";

                const dueDate =
                    item.due_date ||
                    item.dueDate ||
                    "—";

                const returnDate =
                    item.return_date ||
                    item.returnDate ||
                    "—";

                const status =
                    item.status ||
                    "—";

                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeHTML(book)}
                        </td>

                        <td>
                            ${escapeHTML(member)}
                        </td>

                        <td>
                            ${formatDate(issueDate)}
                        </td>

                        <td>
                            ${formatDate(dueDate)}
                        </td>

                        <td>
                            ${formatDate(returnDate)}
                        </td>

                        <td>

                            <span
                                class="status-badge ${getStatusClass(status)}">

                                ${escapeHTML(status)}

                            </span>

                        </td>

                    </tr>
                `;
            }
        ).join("");
}


// ============================================================
// CATEGORY REPORT
// ============================================================

function renderCategoryReport() {

    const container =
        document.getElementById(
            "categoryReport"
        );

    if (!container) {
        return;
    }

    if (!reportData.categories.length) {

        container.innerHTML = `
            <div class="empty-state">
                No category data available.
            </div>
        `;

        return;
    }

    const maxValue =
        Math.max(
            ...reportData.categories.map(
                item =>
                    getNumber(
                        item.count ??
                        item.total ??
                        item.books ??
                        item.book_count
                    )
            ),
            1
        );

    container.innerHTML =
        reportData.categories.map(
            item => {

                const name =
                    item.category ||
                    item.name ||
                    "Unknown";

                const count =
                    getNumber(
                        item.count ??
                        item.total ??
                        item.books ??
                        item.book_count
                    );

                const percentage =
                    Math.round(
                        (count / maxValue) * 100
                    );

                return `
                    <div class="category-item">

                        <div class="category-info">

                            <span>
                                ${escapeHTML(name)}
                            </span>

                            <strong>
                                ${count}
                            </strong>

                        </div>

                        <div class="category-bar">

                            <div
                                class="category-progress"
                                style="width:${percentage}%">
                            </div>

                        </div>

                    </div>
                `;
            }
        ).join("");
}


// ============================================================
// MEMBER REPORT
// ============================================================

function renderMemberReport() {

    const table =
        document.getElementById(
            "memberReportTable"
        );

    if (!table) {
        return;
    }

    if (!reportData.members.length) {

        table.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    No member data found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        reportData.members.map(
            (item, index) => {

                const name =
                    item.name ||
                    item.member_name ||
                    item.memberName ||
                    "—";

                const email =
                    item.email ||
                    "—";

                const type =
                    item.membership_type ||
                    item.membershipType ||
                    item.type ||
                    "—";

                const status =
                    item.membership_status ||
                    item.membershipStatus ||
                    item.status ||
                    "—";

                const issued =
                    item.issued ??
                    item.issued_books ??
                    item.issuedBooks ??
                    0;

                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeHTML(name)}
                        </td>

                        <td>
                            ${escapeHTML(email)}
                        </td>

                        <td>
                            ${escapeHTML(type)}
                        </td>

                        <td>

                            <span
                                class="status-badge ${getStatusClass(status)}">

                                ${escapeHTML(status)}

                            </span>

                        </td>

                        <td>
                            ${issued}
                        </td>

                    </tr>
                `;
            }
        ).join("");
}


// ============================================================
// FINE REPORT
// ============================================================

function renderFineReport() {

    const table =
        document.getElementById(
            "fineReportTable"
        );

    if (!table) {
        return;
    }

    if (!reportData.fines.length) {

        table.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    No fine records found.
                </td>
            </tr>
        `;

        return;
    }

    table.innerHTML =
        reportData.fines.map(
            (item, index) => {

                const member =
                    item.member_name ||
                    item.memberName ||
                    item.name ||
                    "—";

                const book =
                    item.book_title ||
                    item.bookTitle ||
                    item.title ||
                    "—";

                const lateDays =
                    item.late_days ??
                    item.lateDays ??
                    0;

                const fine =
                    item.fine ??
                    item.fine_amount ??
                    item.fineAmount ??
                    0;

                return `
                    <tr>

                        <td>
                            ${index + 1}
                        </td>

                        <td>
                            ${escapeHTML(member)}
                        </td>

                        <td>
                            ${escapeHTML(book)}
                        </td>

                        <td>
                            ${lateDays}
                        </td>

                        <td>
                            ${formatCurrency(fine)}
                        </td>

                    </tr>
                `;
            }
        ).join("");
}


// ============================================================
// MOST BORROWED BOOKS
// ============================================================

function renderMostBorrowed() {

    const container =
        document.getElementById(
            "mostBorrowedReport"
        );

    if (!container) {
        return;
    }

    if (!reportData.mostBorrowed.length) {

        container.innerHTML = `
            <div class="report-empty-state">

                <i class="fa-solid fa-chart-column"></i>

                <p>
                    No borrowing data available
                </p>

            </div>
        `;

        injectMostBorrowedStyles();

        return;
    }

    // Show maximum 10 books
    const books =
        reportData.mostBorrowed.slice(0, 10);

    const maxBorrowCount =
        Math.max(
            ...books.map(
                item =>
                    getNumber(
                        item.borrow_count ??
                        item.borrowCount ??
                        item.total_borrowed ??
                        item.totalBorrowed ??
                        item.count ??
                        0
                    )
            ),
            1
        );

    container.innerHTML =
        books.map(
            (item, index) => {

                const title =
                    item.title ||
                    item.book_title ||
                    item.bookTitle ||
                    "Unknown Book";

                const author =
                    item.author ||
                    item.book_author ||
                    item.bookAuthor ||
                    "Unknown Author";

                const borrowCount =
                    getNumber(
                        item.borrow_count ??
                        item.borrowCount ??
                        item.total_borrowed ??
                        item.totalBorrowed ??
                        item.count ??
                        0
                    );

                const percentage =
                    borrowCount > 0
                        ? Math.max(
                            Math.round(
                                (borrowCount /
                                    maxBorrowCount) * 100
                            ),
                            6
                        )
                        : 0;

                let rankClass = "";

                if (index === 0) {
                    rankClass = "rank-gold";
                }
                else if (index === 1) {
                    rankClass = "rank-silver";
                }
                else if (index === 2) {
                    rankClass = "rank-bronze";
                }

                return `
                    <div class="borrowed-book-row">

                        <div
                            class="borrowed-rank ${rankClass}">

                            ${index + 1}

                        </div>


                        <div
                            class="borrowed-book-main">

                            <div
                                class="borrowed-book-title">

                                ${escapeHTML(title)}

                            </div>


                            <div
                                class="borrowed-book-author">

                                <i
                                    class="fa-solid fa-user-pen">
                                </i>

                                ${escapeHTML(author)}

                            </div>


                            <div
                                class="borrowed-progress">

                                <div
                                    class="borrowed-progress-fill"
                                    style="width:${percentage}%;">
                                </div>

                            </div>

                        </div>


                        <div
                            class="borrowed-count">

                            <strong>
                                ${borrowCount}
                            </strong>

                            <span>
                                ${borrowCount === 1
                        ? "Borrow"
                        : "Borrows"
                    }
                            </span>

                        </div>

                    </div>
                `;
            }
        ).join("");

    injectMostBorrowedStyles();
}


// ============================================================
// MOST BORROWED STYLES
// ============================================================

function injectMostBorrowedStyles() {

    if (
        document.getElementById(
            "mostBorrowedStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "mostBorrowedStyles";

    style.textContent = `

        #mostBorrowedReport {
            width: 100%;
        }


        .borrowed-book-row {

            display: flex;

            align-items: center;

            gap: 18px;

            padding: 16px 4px;

            border-bottom:
                1px solid #f1f3f7;

            transition:
                background 0.2s ease,
                padding 0.2s ease;
        }


        .borrowed-book-row:last-child {
            border-bottom: none;
        }


        .borrowed-book-row:hover {

            background: #fafbff;

            border-radius: 10px;

            padding-left: 10px;

            padding-right: 10px;
        }


        /* RANK */

        .borrowed-rank {

            width: 38px;

            height: 38px;

            min-width: 38px;

            display: flex;

            align-items: center;

            justify-content: center;

            border-radius: 10px;

            background: #f3f4f6;

            color: #6b7280;

            font-size: 14px;

            font-weight: 700;
        }


        .rank-gold {

            background: #fef3c7;

            color: #d97706;
        }


        .rank-silver {

            background: #f1f5f9;

            color: #64748b;
        }


        .rank-bronze {

            background: #ffedd5;

            color: #c2410c;
        }


        /* BOOK INFO */

        .borrowed-book-main {

            flex: 1;

            min-width: 0;
        }


        .borrowed-book-title {

            font-size: 15px;

            font-weight: 700;

            line-height: 1.35;

            color: #111827;

            white-space: nowrap;

            overflow: hidden;

            text-overflow: ellipsis;

            margin-bottom: 5px;
        }


        .borrowed-book-author {

            display: flex;

            align-items: center;

            gap: 6px;

            font-size: 12px;

            color: #6b7280;

            margin-bottom: 10px;
        }


        .borrowed-book-author i {

            font-size: 10px;

            color: #9ca3af;
        }


        /* PROGRESS BAR */

        .borrowed-progress {

            width: 100%;

            height: 6px;

            background: #eef0f5;

            border-radius: 20px;

            overflow: hidden;
        }


        .borrowed-progress-fill {

            height: 100%;

            background:
                linear-gradient(
                    90deg,
                    #6366f1,
                    #818cf8
                );

            border-radius: 20px;

            transition:
                width 0.6s ease;
        }


        /* BORROW COUNT */

        .borrowed-count {

            min-width: 72px;

            display: flex;

            flex-direction: column;

            align-items: flex-end;

            line-height: 1.2;
        }


        .borrowed-count strong {

            font-size: 17px;

            font-weight: 700;

            color: #111827;
        }


        .borrowed-count span {

            margin-top: 4px;

            font-size: 11px;

            color: #9ca3af;
        }


        /* EMPTY STATE */

        .report-empty-state {

            min-height: 180px;

            display: flex;

            flex-direction: column;

            align-items: center;

            justify-content: center;

            color: #9ca3af;
        }


        .report-empty-state i {

            font-size: 30px;

            margin-bottom: 12px;
        }


        .report-empty-state p {

            margin: 0;

            font-size: 14px;
        }


        /* MOBILE */

        @media (max-width: 650px) {

            .borrowed-book-row {
                gap: 10px;
            }


            .borrowed-rank {

                width: 32px;

                height: 32px;

                min-width: 32px;

                font-size: 12px;
            }


            .borrowed-book-title {
                font-size: 14px;
            }


            .borrowed-count {
                min-width: 55px;
            }


            .borrowed-count strong {
                font-size: 15px;
            }

        }

    `;

    document.head.appendChild(style);
}


// ============================================================
// MONTHLY ANALYTICS
// ============================================================

function renderMonthlyAnalytics() {

    const container =
        document.getElementById(
            "monthlyAnalytics"
        );

    if (!container) {
        return;
    }

    const summary =
        reportData.summary;

    let monthlyData = [];

    if (summary) {

        if (
            Array.isArray(
                summary.monthly
            )
        ) {
            monthlyData =
                summary.monthly;
        }

        if (
            Array.isArray(
                summary.monthlyAnalytics
            )
        ) {
            monthlyData =
                summary.monthlyAnalytics;
        }

        if (
            Array.isArray(
                summary.monthly_analytics
            )
        ) {
            monthlyData =
                summary.monthly_analytics;
        }
    }

    if (!monthlyData.length) {

        container.innerHTML = `
            <div class="empty-state">
                No monthly analytics available.
            </div>
        `;

        return;
    }

    container.innerHTML =
        monthlyData.map(
            item => {

                const month =
                    item.month ||
                    item.month_name ||
                    item.monthName ||
                    item.label ||
                    "—";

                const issues =
                    item.issues ??
                    item.total_issues ??
                    item.totalIssues ??
                    0;

                const returns =
                    item.returns ??
                    item.total_returns ??
                    item.totalReturns ??
                    0;

                return `
                    <div class="monthly-row">

                        <span>
                            ${escapeHTML(
                    String(month)
                )}
                        </span>

                        <span>
                            Issues:
                            <strong>
                                ${issues}
                            </strong>
                        </span>

                        <span>
                            Returns:
                            <strong>
                                ${returns}
                            </strong>
                        </span>

                    </div>
                `;
            }
        ).join("");
}


// ============================================================
// ACTIVITY CHART
// ============================================================

function renderActivityChart() {

    const container =
        document.getElementById(
            "activityChart"
        );

    if (!container) {
        return;
    }

    const summary =
        reportData.summary;

    let issues = 0;

    let returns = 0;


    if (summary) {

        issues =
            getNumber(
                summary.issues ??
                summary.totalIssues ??
                summary.total_issues ??
                summary.issueCount ??
                summary.issue_count
            );

        returns =
            getNumber(
                summary.returns ??
                summary.totalReturns ??
                summary.total_returns ??
                summary.returnCount ??
                summary.return_count
            );


        if (summary.activity) {

            issues =
                getNumber(
                    summary.activity.issues ??
                    summary.activity.totalIssues ??
                    summary.activity.total_issues ??
                    issues
                );

            returns =
                getNumber(
                    summary.activity.returns ??
                    summary.activity.totalReturns ??
                    summary.activity.total_returns ??
                    returns
                );
        }


        if (
            summary.data &&
            !Array.isArray(summary.data)
        ) {

            issues =
                getNumber(
                    summary.data.issues ??
                    summary.data.totalIssues ??
                    summary.data.total_issues ??
                    issues
                );

            returns =
                getNumber(
                    summary.data.returns ??
                    summary.data.totalReturns ??
                    summary.data.total_returns ??
                    returns
                );
        }
    }


    if (
        issues === 0 &&
        reportData.issues.length
    ) {
        issues =
            reportData.issues.length;
    }


    if (
        returns === 0 &&
        reportData.returns.length
    ) {
        returns =
            reportData.returns.length;
    }


    const maxValue =
        Math.max(
            issues,
            returns,
            1
        );


    const issueHeight =
        issues > 0
            ? Math.max(
                Math.round(
                    (issues / maxValue) * 100
                ),
                4
            )
            : 0;


    const returnHeight =
        returns > 0
            ? Math.max(
                Math.round(
                    (returns / maxValue) * 100
                ),
                4
            )
            : 0;


    container.innerHTML = `

        <div class="activity-chart-wrapper">

            <div class="chart-summary">

                <div
                    class="chart-summary-item">

                    <span
                        class="chart-dot issue-dot">
                    </span>

                    <span>
                        Issues
                    </span>

                    <strong>
                        ${issues}
                    </strong>

                </div>


                <div
                    class="chart-summary-item">

                    <span
                        class="chart-dot return-dot">
                    </span>

                    <span>
                        Returns
                    </span>

                    <strong>
                        ${returns}
                    </strong>

                </div>

            </div>


            <div class="activity-chart">

                <div class="chart-y-axis">

                    <span>
                        ${maxValue}
                    </span>

                    <span>
                        ${Math.round(
        maxValue * 0.75
    )}
                    </span>

                    <span>
                        ${Math.round(
        maxValue * 0.5
    )}
                    </span>

                    <span>
                        ${Math.round(
        maxValue * 0.25
    )}
                    </span>

                    <span>
                        0
                    </span>

                </div>


                <div class="chart-area">

                    <div class="chart-grid">

                        <div></div>

                        <div></div>

                        <div></div>

                        <div></div>

                        <div></div>

                    </div>


                    <div class="chart-bars">

                        <div class="chart-column">

                            <div class="chart-value">
                                ${issues}
                            </div>

                            <div
                                class="chart-bar issue-bar"
                                style="height:${issueHeight}%;">
                            </div>

                            <div class="chart-label">
                                Issues
                            </div>

                        </div>


                        <div class="chart-column">

                            <div class="chart-value">
                                ${returns}
                            </div>

                            <div
                                class="chart-bar return-bar"
                                style="height:${returnHeight}%;">
                            </div>

                            <div class="chart-label">
                                Returns
                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    `;

    injectActivityChartStyles();
}


// ============================================================
// ACTIVITY CHART STYLES
// ============================================================

function injectActivityChartStyles() {

    if (
        document.getElementById(
            "activityChartStyles"
        )
    ) {
        return;
    }

    const style =
        document.createElement("style");

    style.id =
        "activityChartStyles";

    style.textContent = `

        .activity-chart-wrapper {

            width: 100%;

            padding: 10px 0;
        }


        .chart-summary {

            display: flex;

            gap: 30px;

            margin-bottom: 20px;

            flex-wrap: wrap;
        }


        .chart-summary-item {

            display: flex;

            align-items: center;

            gap: 8px;

            font-size: 14px;

            color: #6b7280;
        }


        .chart-summary-item strong {

            color: #111827;

            margin-left: 4px;
        }


        .chart-dot {

            width: 9px;

            height: 9px;

            border-radius: 50%;

            display: inline-block;
        }


        .issue-dot {
            background: #6366f1;
        }


        .return-dot {
            background: #10b981;
        }


        .activity-chart {

            width: 100%;

            min-height: 300px;

            display: flex;
        }


        .chart-y-axis {

            width: 45px;

            height: 240px;

            display: flex;

            flex-direction: column;

            justify-content: space-between;

            align-items: flex-end;

            padding-right: 10px;

            font-size: 11px;

            color: #9ca3af;
        }


        .chart-area {

            position: relative;

            flex: 1;

            height: 300px;
        }


        .chart-grid {

            position: absolute;

            left: 0;

            right: 0;

            top: 0;

            height: 240px;

            display: flex;

            flex-direction: column;

            justify-content: space-between;
        }


        .chart-grid div {

            width: 100%;

            border-top:
                1px dashed #e5e7eb;
        }


        .chart-bars {

            position: absolute;

            left: 0;

            right: 0;

            top: 0;

            height: 240px;

            display: flex;

            justify-content: center;

            align-items: flex-end;

            gap: 80px;
        }


        .chart-column {

            width: 90px;

            height: 240px;

            position: relative;

            display: flex;

            align-items: center;

            justify-content: flex-end;

            flex-direction: column;
        }


        .chart-bar {

            width: 55px;

            min-height: 0;

            border-radius:
                8px 8px 0 0;

            transition:
                height 0.5s ease;
        }


        .issue-bar {
            background: #6366f1;
        }


        .return-bar {
            background: #10b981;
        }


        .chart-value {

            font-size: 13px;

            font-weight: 700;

            color: #111827;

            margin-bottom: 6px;
        }


        .chart-label {

            position: absolute;

            top: 260px;

            font-size: 13px;

            font-weight: 600;

            color: #6b7280;
        }


        @media (max-width: 600px) {

            .chart-bars {
                gap: 30px;
            }

            .chart-column {
                width: 70px;
            }

            .chart-bar {
                width: 45px;
            }

        }

    `;

    document.head.appendChild(style);
}


// ============================================================
// QUICK REPORTS
// ============================================================

function quickReport(type) {

    const reportType =
        document.getElementById(
            "reportType"
        );

    if (reportType) {
        reportType.value = type;
    }

    loadReports();
}


// ============================================================
// RESET FILTERS
// ============================================================

function resetFilters() {

    const reportType =
        document.getElementById(
            "reportType"
        );

    const fromDate =
        document.getElementById(
            "fromDate"
        );

    const toDate =
        document.getElementById(
            "toDate"
        );

    if (reportType) {
        reportType.value = "all";
    }

    if (fromDate) {
        fromDate.value = "";
    }

    if (toDate) {
        toDate.value = "";
    }

    setDefaultDates();

    loadReports();
}


// ============================================================
// DEFAULT DATES
// ============================================================

function setDefaultDates() {

    const fromDate =
        document.getElementById(
            "fromDate"
        );

    const toDate =
        document.getElementById(
            "toDate"
        );

    if (!fromDate || !toDate) {
        return;
    }

    const today =
        new Date();

    const thirtyDaysAgo =
        new Date();

    thirtyDaysAgo.setDate(
        today.getDate() - 30
    );

    fromDate.value =
        toInputDate(thirtyDaysAgo);

    toDate.value =
        toInputDate(today);
}


// ============================================================
// LIBRARIA PROFESSIONAL EXPORT SYSTEM
// ============================================================

let exportReportType = "all";


// ============================================================
// OPEN EXPORT MODAL
// ============================================================

function openExportModal(type = "all") {

    exportReportType = type;

    const modal =
        document.getElementById("exportModal");

    if (!modal) {
        console.error("Export modal not found.");
        return;
    }

    updateExportModalInfo();

    modal.classList.add("show");
}


// ============================================================
// CLOSE EXPORT MODAL
// ============================================================

function closeExportModal() {

    const modal =
        document.getElementById("exportModal");

    if (modal) {
        modal.classList.remove("show");
    }
}


// ============================================================
// UPDATE EXPORT MODAL INFORMATION
// ============================================================

function updateExportModalInfo() {

    const reportName =
        document.getElementById("exportReportName");

    const dateRange =
        document.getElementById("exportDateRange");


    const reportNames = {

        all: "Complete Library Report",

        overview: "Library Overview Report",

        issues: "Book Issue Report",

        returns: "Return Report",

        books: "Book Inventory Report",

        members: "Member Report",

        fines: "Fine Collection Report",

        categories: "Category Report",

        "most-borrowed":
            "Most Borrowed Books Report"
    };


    if (reportName) {

        reportName.textContent =
            reportNames[exportReportType] ||
            "Complete Library Report";
    }


    const fromDate =
        document.getElementById("fromDate")?.value;

    const toDate =
        document.getElementById("toDate")?.value;


    if (dateRange) {

        if (fromDate && toDate) {

            dateRange.textContent =
                `${formatDate(fromDate)} - ${formatDate(toDate)}`;

        } else {

            dateRange.textContent =
                "Current Period";
        }
    }
}


// ============================================================
// PDF EXPORT
// ============================================================

function exportPDF() {

    console.log(
        "Libraria PDF export started..."
    );


    // --------------------------------------------------------
    // CHECK PDF LIBRARY
    // --------------------------------------------------------

    if (
        typeof window.jspdf === "undefined" ||
        typeof window.jspdf.jsPDF !== "function"
    ) {

        showToast(
            "PDF library is not loaded. Please refresh the page.",
            "error"
        );

        console.error(
            "jsPDF is not loaded."
        );

        return;
    }


    const jsPDF =
        window.jspdf.jsPDF;


    const doc =
        new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });


    // --------------------------------------------------------
    // REPORT INFORMATION
    // --------------------------------------------------------

    const reportTitle =
        getExportReportTitle(
            exportReportType
        );


    const fromDate =
        document.getElementById(
            "fromDate"
        )?.value || "";


    const toDate =
        document.getElementById(
            "toDate"
        )?.value || "";


    const generatedDate =
        new Date().toLocaleString(
            "en-IN"
        );


    const pageWidth =
        doc.internal.pageSize.getWidth();


    const pageHeight =
        doc.internal.pageSize.getHeight();


    const margin = 15;


    // --------------------------------------------------------
    // HEADER
    // --------------------------------------------------------

    doc.setFillColor(
        79,
        70,
        229
    );


    doc.rect(
        0,
        0,
        pageWidth,
        38,
        "F"
    );


    // Logo box

    doc.setFillColor(
        255,
        255,
        255
    );


    doc.roundedRect(
        margin,
        9,
        20,
        20,
        4,
        4,
        "F"
    );


    doc.setTextColor(
        79,
        70,
        229
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        14
    );


    doc.text(
        "L",
        margin + 7,
        22
    );


    // Libraria

    doc.setTextColor(
        255,
        255,
        255
    );


    doc.setFontSize(
        21
    );


    doc.text(
        "Libraria",
        margin + 27,
        17
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        8
    );


    doc.text(
        "LIBRARY MANAGEMENT SYSTEM",
        margin + 27,
        24
    );


    // --------------------------------------------------------
    // REPORT TITLE
    // --------------------------------------------------------

    doc.setTextColor(
        17,
        24,
        39
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        18
    );


    doc.text(
        reportTitle,
        margin,
        52
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        9
    );


    doc.setTextColor(
        107,
        114,
        128
    );


    if (fromDate && toDate) {

        doc.text(
            `Period: ${formatDate(fromDate)} - ${formatDate(toDate)}`,
            margin,
            59
        );

    } else {

        doc.text(
            "Period: Current Period",
            margin,
            59
        );
    }


    doc.text(
        `Generated: ${generatedDate}`,
        pageWidth - margin,
        59,
        {
            align: "right"
        }
    );


    // --------------------------------------------------------
    // SUMMARY CARDS
    // --------------------------------------------------------

    const overview =
        reportData.overview || {};


    const totalBooks =
        getNumber(
            overview.totalBooks ??
            overview.total_books ??
            overview.books ??
            reportData.books.length
        );


    const totalMembers =
        getNumber(
            overview.totalMembers ??
            overview.total_members ??
            overview.members ??
            reportData.members.length
        );


    const totalIssued =
        getNumber(
            overview.totalIssued ??
            overview.total_issued ??
            overview.issuedBooks ??
            overview.issued_books ??
            reportData.issues.length
        );


    const totalFines =
        getNumber(
            overview.totalFines ??
            overview.total_fines ??
            overview.fines ??
            0
        );


    const summaryCards = [

        {
            label: "TOTAL BOOKS",
            value: totalBooks
        },

        {
            label: "TOTAL MEMBERS",
            value: totalMembers
        },

        {
            label: "BOOKS ISSUED",
            value: totalIssued
        },

        {
            label: "TOTAL FINES",
            value:
                formatCurrency(
                    totalFines
                )
        }

    ];


    const cardGap = 4;


    const cardWidth =
        (
            pageWidth -
            margin * 2 -
            cardGap * 3
        ) / 4;


    summaryCards.forEach(
        (card, index) => {

            const x =
                margin +
                index *
                (cardWidth + cardGap);


            doc.setFillColor(
                248,
                250,
                252
            );


            doc.roundedRect(
                x,
                68,
                cardWidth,
                25,
                3,
                3,
                "F"
            );


            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.setFontSize(
                7
            );


            doc.setTextColor(
                156,
                163,
                175
            );


            doc.text(
                card.label,
                x + 5,
                76
            );


            doc.setFontSize(
                13
            );


            doc.setTextColor(
                17,
                24,
                39
            );


            doc.text(
                String(card.value),
                x + 5,
                87
            );
        }
    );


    // --------------------------------------------------------
    // TABLE DATA
    // --------------------------------------------------------

    const tableData =
        getPDFTableData(
            exportReportType
        );


    let tableStartY = 103;


    // --------------------------------------------------------
    // AUTO TABLE
    // --------------------------------------------------------

    if (
        tableData &&
        tableData.body &&
        tableData.body.length
    ) {

        if (
            typeof doc.autoTable === "function"
        ) {

            doc.autoTable({

                startY: tableStartY,

                head: [
                    tableData.headers
                ],

                body:
                    tableData.body,

                margin: {

                    top: 15,

                    right: margin,

                    bottom: 22,

                    left: margin
                },

                theme: "grid",

                styles: {

                    font:
                        "helvetica",

                    fontSize: 8,

                    cellPadding: 3,

                    textColor: [
                        55,
                        65,
                        81
                    ],

                    lineColor: [
                        229,
                        231,
                        235
                    ],

                    lineWidth: 0.2
                },

                headStyles: {

                    fillColor: [
                        79,
                        70,
                        229
                    ],

                    textColor: [
                        255,
                        255,
                        255
                    ],

                    fontStyle:
                        "bold",

                    fontSize: 8
                },

                alternateRowStyles: {

                    fillColor: [
                        249,
                        250,
                        251
                    ]
                },

                didDrawPage:
                    function () {

                        drawPDFFooter(
                            doc
                        );
                    }
            });

        } else {

            // Fallback if AutoTable does not load

            drawManualPDFTable(
                doc,
                tableData.headers,
                tableData.body,
                tableStartY
            );
        }

    } else {

        doc.setFillColor(
            249,
            250,
            251
        );


        doc.roundedRect(
            margin,
            tableStartY,
            pageWidth -
            margin * 2,
            35,
            4,
            4,
            "F"
        );


        doc.setTextColor(
            107,
            114,
            128
        );


        doc.setFontSize(
            10
        );


        doc.text(
            "No data available for this report.",
            pageWidth / 2,
            tableStartY + 20,
            {
                align: "center"
            }
        );


        drawPDFFooter(
            doc
        );
    }


    // --------------------------------------------------------
    // DOWNLOAD
    // --------------------------------------------------------

    const filename =
        createExportFilename(
            exportReportType,
            "pdf"
        );


    doc.save(
        filename
    );


    closeExportModal();


    showToast(
        "Professional PDF downloaded successfully.",
        "success"
    );


    console.log(
        "PDF downloaded:",
        filename
    );
}


// ============================================================
// PDF TABLE DATA
// ============================================================

function getPDFTableData(type) {

    switch (type) {


        // ====================================================
        // ISSUES
        // ====================================================

        case "issues":

            return {

                headers: [
                    "#",
                    "Book",
                    "Member",
                    "Issue Date",
                    "Due Date",
                    "Status"
                ],

                body:
                    reportData.issues.map(
                        (item, index) => [

                            index + 1,

                            item.book_title ||
                            item.bookTitle ||
                            item.title ||
                            "—",

                            item.member_name ||
                            item.memberName ||
                            item.name ||
                            "—",

                            formatDate(
                                item.issue_date ||
                                item.issueDate
                            ),

                            formatDate(
                                item.due_date ||
                                item.dueDate
                            ),

                            item.status ||
                            "—"
                        ]
                    )
            };


        // ====================================================
        // RETURNS
        // ====================================================

        case "returns":

            return {

                headers: [
                    "#",
                    "Book",
                    "Member",
                    "Return Date",
                    "Late Days",
                    "Fine"
                ],

                body:
                    reportData.returns.map(
                        (item, index) => [

                            index + 1,

                            item.book_title ||
                            item.bookTitle ||
                            item.title ||
                            "—",

                            item.member_name ||
                            item.memberName ||
                            item.name ||
                            "—",

                            formatDate(
                                item.return_date ||
                                item.returnDate
                            ),

                            item.late_days ??
                            item.lateDays ??
                            0,

                            formatCurrency(
                                item.fine ??
                                item.fine_amount ??
                                item.fineAmount ??
                                0
                            )
                        ]
                    )
            };


        // ====================================================
        // BOOKS
        // ====================================================

        case "books":

            return {

                headers: [
                    "#",
                    "Title",
                    "Author",
                    "ISBN",
                    "Category",
                    "Total",
                    "Available"
                ],

                body:
                    reportData.books.map(
                        (item, index) => [

                            index + 1,

                            item.title ||
                            "—",

                            item.author ||
                            "—",

                            item.isbn ||
                            "—",

                            item.category ||
                            "—",

                            item.total_copies ??
                            item.totalCopies ??
                            0,

                            item.available_copies ??
                            item.availableCopies ??
                            0
                        ]
                    )
            };


        // ====================================================
        // MEMBERS
        // ====================================================

        case "members":

            return {

                headers: [
                    "#",
                    "Member",
                    "Email",
                    "Membership",
                    "Status",
                    "Issues"
                ],

                body:
                    reportData.members.map(
                        (item, index) => [

                            index + 1,

                            item.name ||
                            item.member_name ||
                            "—",

                            item.email ||
                            "—",

                            item.membership_type ||
                            item.membershipType ||
                            item.type ||
                            "—",

                            item.membership_status ||
                            item.membershipStatus ||
                            item.status ||
                            "—",

                            item.total_issues ??
                            item.totalIssues ??
                            item.issued ??
                            item.issued_books ??
                            item.issuedBooks ??
                            0
                        ]
                    )
            };


        // ====================================================
        // FINES
        // ====================================================

        case "fines":

            return {

                headers: [
                    "#",
                    "Member",
                    "Book",
                    "Return Date",
                    "Late Days",
                    "Fine"
                ],

                body:
                    reportData.fines.map(
                        (item, index) => [

                            index + 1,

                            item.member_name ||
                            item.memberName ||
                            item.name ||
                            "—",

                            item.book_title ||
                            item.bookTitle ||
                            item.title ||
                            "—",

                            formatDate(
                                item.return_date ||
                                item.returnDate
                            ),

                            item.late_days ??
                            item.lateDays ??
                            0,

                            formatCurrency(
                                item.fine ??
                                item.fine_amount ??
                                item.fineAmount ??
                                0
                            )
                        ]
                    )
            };


        // ====================================================
        // CATEGORIES
        // ====================================================

        case "categories":

            return {

                headers: [
                    "#",
                    "Category",
                    "Books"
                ],

                body:
                    reportData.categories.map(
                        (item, index) => [

                            index + 1,

                            item.category ||
                            item.name ||
                            "—",

                            item.count ??
                            item.total ??
                            item.books ??
                            item.book_count ??
                            item.bookCount ??
                            0
                        ]
                    )
            };


        // ====================================================
        // MOST BORROWED
        // ====================================================

        case "most-borrowed":

            return {

                headers: [
                    "Rank",
                    "Book",
                    "Author",
                    "Borrowings"
                ],

                body:
                    reportData
                        .mostBorrowed
                        .slice(0, 10)
                        .map(
                            (item, index) => [

                                index + 1,

                                item.title ||
                                item.book_title ||
                                item.bookTitle ||
                                "—",

                                item.author ||
                                item.book_author ||
                                item.bookAuthor ||
                                "—",

                                item.borrow_count ??
                                item.borrowCount ??
                                item.total_borrowed ??
                                item.totalBorrowed ??
                                item.count ??
                                0
                            ]
                        )
            };


        // ====================================================
        // COMPLETE REPORT
        // ====================================================

        default:

            return {

                headers: [
                    "Report",
                    "Records"
                ],

                body: [

                    [
                        "Books",
                        reportData.books.length
                    ],

                    [
                        "Members",
                        reportData.members.length
                    ],

                    [
                        "Book Issues",
                        reportData.issues.length
                    ],

                    [
                        "Returns",
                        reportData.returns.length
                    ],

                    [
                        "Fine Records",
                        reportData.fines.length
                    ],

                    [
                        "Categories",
                        reportData.categories.length
                    ],

                    [
                        "Most Borrowed Books",
                        reportData.mostBorrowed.length
                    ]
                ]
            };
    }
}


// ============================================================
// MANUAL PDF TABLE FALLBACK
// ============================================================

function drawManualPDFTable(
    doc,
    headers,
    rows,
    startY
) {

    const pageWidth =
        doc.internal.pageSize.getWidth();

    const pageHeight =
        doc.internal.pageSize.getHeight();

    const margin = 15;

    const usableWidth =
        pageWidth -
        margin * 2;

    const columnWidth =
        usableWidth /
        headers.length;

    let y = startY;


    // Header

    doc.setFillColor(
        79,
        70,
        229
    );


    doc.rect(
        margin,
        y,
        usableWidth,
        9,
        "F"
    );


    doc.setTextColor(
        255,
        255,
        255
    );


    doc.setFont(
        "helvetica",
        "bold"
    );


    doc.setFontSize(
        7
    );


    headers.forEach(
        (header, index) => {

            doc.text(
                String(header),
                margin +
                index *
                columnWidth +
                2,
                y + 6
            );
        }
    );


    y += 9;


    // Rows

    doc.setFont(
        "helvetica",
        "normal"
    );


    rows.forEach(
        (row, rowIndex) => {

            if (
                y >
                pageHeight - 25
            ) {

                drawPDFFooter(
                    doc
                );

                doc.addPage();

                y = 20;


                doc.setFillColor(
                    79,
                    70,
                    229
                );


                doc.rect(
                    margin,
                    y,
                    usableWidth,
                    9,
                    "F"
                );


                doc.setTextColor(
                    255,
                    255,
                    255
                );


                headers.forEach(
                    (header, index) => {

                        doc.text(
                            String(header),
                            margin +
                            index *
                            columnWidth +
                            2,
                            y + 6
                        );
                    }
                );


                y += 9;
            }


            if (
                rowIndex % 2 === 0
            ) {

                doc.setFillColor(
                    249,
                    250,
                    251
                );

            } else {

                doc.setFillColor(
                    255,
                    255,
                    255
                );
            }


            doc.rect(
                margin,
                y,
                usableWidth,
                8,
                "F"
            );


            doc.setTextColor(
                55,
                65,
                81
            );


            row.forEach(
                (value, index) => {

                    let text =
                        String(
                            value ??
                            ""
                        );


                    if (
                        text.length > 24
                    ) {

                        text =
                            text.substring(
                                0,
                                21
                            ) + "...";
                    }


                    doc.text(
                        text,
                        margin +
                        index *
                        columnWidth +
                        2,
                        y + 5.5
                    );
                }
            );


            y += 8;
        }
    );


    drawPDFFooter(
        doc
    );
}


// ============================================================
// PDF FOOTER
// ============================================================

function drawPDFFooter(doc) {

    const pageWidth =
        doc.internal.pageSize.getWidth();

    const pageHeight =
        doc.internal.pageSize.getHeight();


    doc.setDrawColor(
        229,
        231,
        235
    );


    doc.line(
        15,
        pageHeight - 15,
        pageWidth - 15,
        pageHeight - 15
    );


    doc.setFont(
        "helvetica",
        "normal"
    );


    doc.setFontSize(
        7
    );


    doc.setTextColor(
        156,
        163,
        175
    );


    doc.text(
        "Libraria Library Management System",
        15,
        pageHeight - 9
    );


    doc.text(
        `Page ${doc.internal.getNumberOfPages()}`,
        pageWidth - 15,
        pageHeight - 9,
        {
            align: "right"
        }
    );
}


// ============================================================
// CSV EXPORT
// ============================================================

function exportCSV() {

    console.log(
        "Libraria CSV export started..."
    );


    const rows =
        getCSVData(
            exportReportType
        );


    if (
        !rows ||
        !rows.length
    ) {

        showToast(
            "There is no data available to export.",
            "error"
        );

        return;
    }


    const csv =
        convertToCSV(
            rows
        );


    /*
     * UTF-8 BOM
     * Makes Excel display
     * Unicode/Indian text correctly.
     */

    const csvContent =
        "\uFEFF" + csv;


    const blob =
        new Blob(
            [csvContent],
            {
                type:
                    "text/csv;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        createExportFilename(
            exportReportType,
            "csv"
        );


    link.style.display =
        "none";


    document.body.appendChild(
        link
    );


    link.click();


    document.body.removeChild(
        link
    );


    setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );


    closeExportModal();


    showToast(
        "CSV downloaded successfully.",
        "success"
    );


    console.log(
        "CSV downloaded successfully."
    );
}


// ============================================================
// CSV DATA
// ============================================================

function getCSVData(type) {

    switch (type) {

        case "issues":

            return reportData.issues;


        case "returns":

            return reportData.returns;


        case "books":

            return reportData.books;


        case "members":

            return reportData.members;


        case "fines":

            return reportData.fines;


        case "categories":

            return reportData.categories;


        case "most-borrowed":

            return reportData.mostBorrowed;


        case "overview":

        case "all":

        default:

            return [

                {
                    Report:
                        "Books",

                    Records:
                        reportData.books.length
                },

                {
                    Report:
                        "Members",

                    Records:
                        reportData.members.length
                },

                {
                    Report:
                        "Book Issues",

                    Records:
                        reportData.issues.length
                },

                {
                    Report:
                        "Returns",

                    Records:
                        reportData.returns.length
                },

                {
                    Report:
                        "Fine Records",

                    Records:
                        reportData.fines.length
                },

                {
                    Report:
                        "Categories",

                    Records:
                        reportData.categories.length
                },

                {
                    Report:
                        "Most Borrowed Books",

                    Records:
                        reportData.mostBorrowed.length
                }
            ];
    }
}


// ============================================================
// CSV CONVERTER
// ============================================================

function convertToCSV(data) {

    if (
        !data ||
        !data.length
    ) {
        return "";
    }


    const headers =
        Object.keys(
            data[0]
        );


    const lines = [];


    // Header

    lines.push(

        headers
            .map(
                header =>
                    `"${escapeCSV(
                        formatCSVHeader(
                            header
                        )
                    )}"`
            )
            .join(",")
    );


    // Data

    data.forEach(
        row => {

            const line =
                headers
                    .map(
                        header => {

                            return `"${escapeCSV(
                                row[header]
                            )}"`;

                        }
                    )
                    .join(",");


            lines.push(
                line
            );
        }
    );


    return lines.join(
        "\r\n"
    );
}


// ============================================================
// CSV HEADER FORMATTER
// ============================================================

function formatCSVHeader(
    header
) {

    return String(header)

        .replace(
            /_/g,
            " "
        )

        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );
}


// ============================================================
// CSV ESCAPE
// ============================================================

function escapeCSV(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)

        .replace(
            /"/g,
            '""'
        )

        .replace(
            /\r?\n/g,
            " "
        );
}


// ============================================================
// QUICK EXPORT
// ============================================================

function exportSpecificReport(type) {

    exportReportType =
        type;


    updateExportModalInfo();


    /*
     * Quick export directly downloads
     * CSV for the selected report.
     */

    exportCSV();
}


// ============================================================
// EXPORT REPORT TITLE
// ============================================================

function getExportReportTitle(type) {

    const names = {

        all:
            "Complete Library Report",

        overview:
            "Library Overview Report",

        issues:
            "Book Issue Report",

        returns:
            "Return Report",

        books:
            "Book Inventory Report",

        members:
            "Member Report",

        fines:
            "Fine Collection Report",

        categories:
            "Category Report",

        "most-borrowed":
            "Most Borrowed Books Report"
    };


    return names[type] ||
        "Complete Library Report";
}


// ============================================================
// EXPORT FILE NAME
// ============================================================

function createExportFilename(
    type,
    extension
) {

    const names = {

        all:
            "Complete-Library-Report",

        overview:
            "Library-Overview-Report",

        issues:
            "Book-Issue-Report",

        returns:
            "Return-Report",

        books:
            "Book-Inventory-Report",

        members:
            "Member-Report",

        fines:
            "Fine-Collection-Report",

        categories:
            "Category-Report",

        "most-borrowed":
            "Most-Borrowed-Books-Report"
    };


    const name =
        names[type] ||
        names.all;


    const date =
        new Date()
            .toISOString()
            .slice(0, 10);


    return `Libraria-${name}-${date}.${extension}`;
}


// ============================================================
// EXPORT CSV
// ============================================================

function exportReport(type) {

    let rows = [];

    let filename =
        "libraria-report.csv";


    switch (type) {

        case "issues":

            rows =
                reportData.issues;

            filename =
                "libraria-issues-report.csv";

            break;


        case "members":

            rows =
                reportData.members;

            filename =
                "libraria-members-report.csv";

            break;


        case "fines":

            rows =
                reportData.fines;

            filename =
                "libraria-fines-report.csv";

            break;


        case "books":

            rows =
                reportData.books;

            filename =
                "libraria-books-report.csv";

            break;


        case "categories":

            rows =
                reportData.categories;

            filename =
                "libraria-category-report.csv";

            break;


        case "most-borrowed":

            rows =
                reportData.mostBorrowed;

            filename =
                "libraria-most-borrowed.csv";

            break;


        default:

            rows =
                reportData.issues;
    }


    if (!rows.length) {

        showToast(
            "There is no data available to export.",
            "error"
        );

        return;
    }


    const csv =
        convertToCSV(rows);


    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download = filename;


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);


    URL.revokeObjectURL(url);


    closeExportModal();


    showToast(
        "Report exported successfully.",
        "success"
    );
}


function convertToCSV(data) {

    if (!data.length) {
        return "";
    }


    const headers =
        Object.keys(data[0]);


    const lines = [];


    lines.push(
        headers
            .map(
                header =>
                    `"${escapeCSV(header)}"`
            )
            .join(",")
    );


    data.forEach(row => {

        const line =
            headers
                .map(
                    header =>
                        `"${escapeCSV(
                            row[header]
                        )}"`
                )
                .join(",");

        lines.push(line);
    });


    return lines.join("\n");
}


function escapeCSV(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replace(/"/g, '""');
}


// ============================================================
// PRINT
// ============================================================

function printReport() {

    window.print();
}


// ============================================================
// SIDEBAR
// ============================================================

function toggleSidebar() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    const overlay =
        document.querySelector(
            ".sidebar-overlay"
        );


    if (sidebar) {

        sidebar.classList.toggle(
            "open"
        );
    }


    if (overlay) {

        overlay.classList.toggle(
            "show"
        );
    }
}


function closeSidebar() {

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    const overlay =
        document.querySelector(
            ".sidebar-overlay"
        );


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );
    }


    if (overlay) {

        overlay.classList.remove(
            "show"
        );
    }
}


// ============================================================
// TOAST
// ============================================================

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
        return;
    }


    toastMessage.textContent =
        message;


    toast.classList.remove(
        "success",
        "error",
        "show"
    );


    toast.classList.add(type);


    setTimeout(() => {

        toast.classList.add(
            "show"
        );

    }, 10);


    setTimeout(() => {

        toast.classList.remove(
            "show"
        );

    }, 3500);
}


// ============================================================
// LOADING STATE
// ============================================================

function showLoadingState() {

    const containers = [

        "issueReportTable",

        "memberReportTable",

        "fineReportTable"

    ];


    containers.forEach(id => {

        const element =
            document.getElementById(id);


        if (element) {

            element.innerHTML = `
                <tr>

                    <td
                        colspan="10"
                        class="empty-state">

                        Loading report...

                    </td>

                </tr>
            `;
        }

    });
}


// ============================================================
// HELPERS
// ============================================================

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


function getNumber(value) {

    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;
}


function formatCurrency(value) {

    const number =
        getNumber(value);


    return "₹" +
        number.toLocaleString(
            "en-IN",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}


function formatDate(value) {

    if (
        !value ||
        value === "—"
    ) {
        return "—";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
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


function getStatusClass(status) {

    const value =
        String(status)
            .toLowerCase();


    if (
        value === "active" ||
        value === "returned" ||
        value === "fulfilled"
    ) {

        return "success";
    }


    if (
        value === "overdue" ||
        value === "expired" ||
        value === "cancelled"
    ) {

        return "danger";
    }


    if (
        value === "pending" ||
        value === "issued"
    ) {

        return "warning";
    }


    return "";
}


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


// ============================================================
// OUTSIDE CLICK - EXPORT MODAL
// ============================================================

document.addEventListener(
    "click",
    event => {

        const modal =
            document.getElementById(
                "exportModal"
            );


        if (
            modal &&
            event.target === modal
        ) {

            closeExportModal();
        }

    }
);