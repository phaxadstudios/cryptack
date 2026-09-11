// assets/js/transactions.js

// ============================================================
// TRANSACTIONS PAGE
// ============================================================

let allTransactions = [];


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================================
// GET TABLE
// ============================================================

function getTransactionTable() {
    return (
        document.getElementById("transactionsTable") ||
        document.getElementById("transactionTable") ||
        document.querySelector("tbody")
    );
}


// ============================================================
// LOAD TRANSACTIONS
// ============================================================

async function loadTransactions() {

    const table = getTransactionTable();

    if (!table) {
        console.error("Transactions table was not found.");
        return;
    }

    table.innerHTML = `
        <tr>
            <td colspan="5" class="p-10 text-center text-gray-500">
                Loading transactions...
            </td>
        </tr>
    `;

    try {

        // ----------------------------------------------------
        // AUTH
        // ----------------------------------------------------

        if (typeof window.waitForAuth === "function") {
            await window.waitForAuth();
        }

        if (typeof window.requireAuth !== "function") {
            throw new Error(
                "Authentication system is unavailable. Make sure app.js is loaded."
            );
        }

        const user = await window.requireAuth();

        if (!user) {
            return;
        }


        // ----------------------------------------------------
        // LOAD INVESTMENTS
        // ----------------------------------------------------

        if (typeof window.getInvestments !== "function") {
            throw new Error(
                "getInvestments() is unavailable. Make sure app.js is loaded."
            );
        }

        const investments =
            await window.getInvestments();

        const existingInvestments =
            Array.isArray(investments)
                ? investments
                : [];


        // ----------------------------------------------------
        // CREATE SET OF EXISTING INVESTMENT IDS
        // ----------------------------------------------------

        const existingInvestmentIds =
            new Set(
                existingInvestments.map(
                    investment =>
                        String(
                            investment.id ||
                            investment.investmentId ||
                            ""
                        )
                )
            );


        // ----------------------------------------------------
        // LOAD TRANSACTIONS
        // ----------------------------------------------------

        if (typeof window.getTransactions !== "function") {
            throw new Error(
                "getTransactions() is unavailable. Make sure app.js is loaded before transactions.js."
            );
        }

        const transactions =
            await window.getTransactions();

        const rawTransactions =
            Array.isArray(transactions)
                ? transactions
                : [];


        // ----------------------------------------------------
        // ONLY KEEP TRANSACTIONS BELONGING TO
        // EXISTING INVESTMENTS
        // ----------------------------------------------------

        allTransactions =
            rawTransactions.filter(
                transaction => {

                    const investmentId =
                        String(
                            transaction.investmentId ||
                            transaction.investmentID ||
                            transaction.referenceId ||
                            ""
                        );

                    // If the transaction has an investment ID,
                    // make sure that investment still exists.
                    if (investmentId) {
                        return existingInvestmentIds.has(
                            investmentId
                        );
                    }

                    // Keep transactions that do not have an
                    // investment ID only if they are not investment
                    // transactions.
                    const type =
                        String(
                            transaction.type ||
                            ""
                        ).toLowerCase();

                    return type !== "investment";
                }
            );


        window.__transactions =
            allTransactions;


        // ----------------------------------------------------
        // DISPLAY
        // ----------------------------------------------------

        renderTransactions(
            allTransactions
        );

        updateTransactionStats(
            allTransactions
        );

    } catch (error) {

        console.error(
            "TRANSACTION PAGE ERROR:",
            error
        );

        console.error(
            "Firebase error code:",
            error?.code
        );

        console.error(
            "Firebase error message:",
            error?.message
        );

        table.innerHTML = `
            <tr>
                <td colspan="5" class="p-10 text-center">

                    <div class="text-red-400 font-medium mb-2">
                        Unable to load transactions
                    </div>

                    <div class="text-sm text-gray-500 break-words">
                        ${escapeHTML(
                            error?.message ||
                            "Unknown error occurred."
                        )}
                    </div>

                </td>
            </tr>
        `;

        updateTransactionStats([]);
    }
}


// ============================================================
// RENDER TRANSACTIONS
// ============================================================

function renderTransactions(transactions) {

    const table =
        getTransactionTable();

    if (!table) {
        return;
    }


    // --------------------------------------------------------
    // EMPTY STATE
    // --------------------------------------------------------

    if (
        !transactions ||
        transactions.length === 0
    ) {

        table.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="p-10 text-center text-gray-500"
                >
                    No transactions yet.
                </td>
            </tr>
        `;

        return;
    }


    // --------------------------------------------------------
    // SORT NEWEST FIRST
    // --------------------------------------------------------

    const sortedTransactions =
        [...transactions].sort(
            (a, b) => {

                const dateA =
                    a.createdAt?.seconds
                        ? a.createdAt.seconds
                        : new Date(
                            a.createdAt || 0
                        ).getTime();

                const dateB =
                    b.createdAt?.seconds
                        ? b.createdAt.seconds
                        : new Date(
                            b.createdAt || 0
                        ).getTime();

                return dateB - dateA;
            }
        );


    // --------------------------------------------------------
    // TRANSACTION ROWS
    // --------------------------------------------------------

    table.innerHTML =
        sortedTransactions
            .map(transaction => {

                const type =
                    transaction.type ||
                    "Transaction";

                const plan =
                    transaction.plan ||
                    "—";

                const amount =
                    Number(
                        transaction.amount
                    ) || 0;

                const status =
                    transaction.status ||
                    transaction.paymentStatus ||
                    "Pending";

                const date =
                    typeof window.formatDateTime ===
                    "function"
                        ? window.formatDateTime(
                            transaction.createdAt
                        )
                        : "—";

                const formattedAmount =
                    typeof window.money ===
                    "function"
                        ? window.money(amount)
                        : "$" +
                          amount.toFixed(2);


                // ------------------------------------------------
                // STATUS COLOR
                // ------------------------------------------------

                let statusClass =
                    "text-yellow-400";

                const normalizedStatus =
                    String(status)
                        .toLowerCase();

                if (
                    normalizedStatus === "successful" ||
                    normalizedStatus === "completed"
                ) {
                    statusClass =
                        "text-green-400";
                }

                if (
                    normalizedStatus === "failed" ||
                    normalizedStatus === "cancelled"
                ) {
                    statusClass =
                        "text-red-400";
                }


                return `
                    <tr
                        class="border-b
                               border-white/5
                               hover:bg-white/[0.02]"
                    >

                        <td
                            class="px-5
                                   py-4
                                   text-sm
                                   text-gray-200"
                        >
                            ${escapeHTML(type)}
                        </td>

                        <td
                            class="px-5
                                   py-4
                                   text-sm
                                   text-gray-400"
                        >
                            ${escapeHTML(plan)}
                        </td>

                        <td
                            class="px-5
                                   py-4
                                   text-sm
                                   font-medium
                                   text-white"
                        >
                            ${escapeHTML(
                                formattedAmount
                            )}
                        </td>

                        <td
                            class="px-5
                                   py-4
                                   text-sm
                                   ${statusClass}"
                        >
                            ${escapeHTML(status)}
                        </td>

                        <td
                            class="px-5
                                   py-4
                                   text-sm
                                   text-gray-500"
                        >
                            ${escapeHTML(date)}
                        </td>

                    </tr>
                `;
            })
            .join("");
}


// ============================================================
// FILTER TRANSACTIONS
// ============================================================

function applyFilters() {

    let filtered =
        [...allTransactions];


    const searchInput =
        document.getElementById(
            "transactionSearch"
        ) ||
        document.getElementById(
            "searchInput"
        );

    const statusFilter =
        document.getElementById(
            "statusFilter"
        );

    const typeFilter =
        document.getElementById(
            "typeFilter"
        );


    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (
        searchInput &&
        searchInput.value.trim()
    ) {

        const search =
            searchInput.value
                .trim()
                .toLowerCase();

        filtered =
            filtered.filter(
                transaction => {

                    return (
                        String(
                            transaction.type ||
                            ""
                        )
                            .toLowerCase()
                            .includes(search)

                        ||

                        String(
                            transaction.plan ||
                            ""
                        )
                            .toLowerCase()
                            .includes(search)

                        ||

                        String(
                            transaction.status ||
                            ""
                        )
                            .toLowerCase()
                            .includes(search)
                    );
                }
            );
    }


    // --------------------------------------------------------
    // STATUS FILTER
    // --------------------------------------------------------

    if (
        statusFilter &&
        statusFilter.value &&
        statusFilter.value !== "all"
    ) {

        const selectedStatus =
            statusFilter.value
                .toLowerCase();

        filtered =
            filtered.filter(
                transaction => {

                    const status =
                        String(
                            transaction.status ||
                            transaction.paymentStatus ||
                            ""
                        ).toLowerCase();

                    return status === selectedStatus;
                }
            );
    }


    // --------------------------------------------------------
    // TYPE FILTER
    // --------------------------------------------------------

    if (
        typeFilter &&
        typeFilter.value &&
        typeFilter.value !== "all"
    ) {

        const selectedType =
            typeFilter.value
                .toLowerCase();

        filtered =
            filtered.filter(
                transaction =>
                    String(
                        transaction.type ||
                        ""
                    ).toLowerCase() ===
                    selectedType
            );
    }


    renderTransactions(
        filtered
    );
}


// ============================================================
// TRANSACTION STATS
// ============================================================

function updateTransactionStats(
    transactions
) {

    const total =
        transactions.length;


    const successful =
        transactions.filter(
            transaction => {

                const status =
                    String(
                        transaction.status ||
                        transaction.paymentStatus ||
                        ""
                    ).toLowerCase();

                return (
                    status === "successful" ||
                    status === "completed"
                );
            }
        ).length;


    const pending =
        transactions.filter(
            transaction => {

                const status =
                    String(
                        transaction.status ||
                        transaction.paymentStatus ||
                        ""
                    ).toLowerCase();

                return status === "pending";
            }
        ).length;


    const failed =
        transactions.filter(
            transaction => {

                const status =
                    String(
                        transaction.status ||
                        transaction.paymentStatus ||
                        ""
                    ).toLowerCase();

                return (
                    status === "failed" ||
                    status === "cancelled"
                );
            }
        ).length;


    const totalElement =
        document.getElementById(
            "totalTransactions"
        );

    const successfulElement =
        document.getElementById(
            "successfulTransactions"
        );

    const pendingElement =
        document.getElementById(
            "pendingTransactions"
        );

    const failedElement =
        document.getElementById(
            "failedTransactions"
        );


    if (totalElement) {
        totalElement.textContent =
            total;
    }

    if (successfulElement) {
        successfulElement.textContent =
            successful;
    }

    if (pendingElement) {
        pendingElement.textContent =
            pending;
    }

    if (failedElement) {
        failedElement.textContent =
            failed;
    }
}


// ============================================================
// INITIALIZE
// ============================================================

window.addEventListener(
    "load",
    async () => {

        try {

            if (
                typeof window.waitForAuth ===
                "function"
            ) {
                await window.waitForAuth();
            }

            await loadTransactions();

        } catch (error) {

            console.error(
                "Transactions initialization error:",
                error
            );
        }
    }
);


// ============================================================
// FILTER EVENTS
// ============================================================

document.addEventListener(
    "input",
    event => {

        if (
            event.target.id ===
                "transactionSearch" ||
            event.target.id ===
                "searchInput"
        ) {
            applyFilters();
        }
    }
);


document.addEventListener(
    "change",
    event => {

        if (
            event.target.id ===
                "statusFilter" ||
            event.target.id ===
                "typeFilter"
        ) {
            applyFilters();
        }
    }
);


// ============================================================
// AUTO REFRESH
// ============================================================

setInterval(
    async () => {

        try {

            await loadTransactions();

        } catch (error) {

            console.error(
                "Transaction auto-refresh error:",
                error
            );
        }

    },
    60 * 1000
);


// ============================================================
// GLOBAL EXPORTS
// ============================================================

window.loadTransactions =
    loadTransactions;

window.renderTransactions =
    renderTransactions;

window.applyFilters =
    applyFilters;

window.updateTransactionStats =
    updateTransactionStats;
