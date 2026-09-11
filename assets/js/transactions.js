
// assets/js/transactions.js

async function renderTransactions() {
    const table = document.getElementById("transactions");

    if (!table) {
        return;
    }

    try {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="p-10 text-center text-gray-500">
                    Loading transactions...
                </td>
            </tr>
        `;

        const transactions = await window.getTransactions();

        console.log("TRANSACTIONS LOADED:", transactions);

        if (!Array.isArray(transactions) || transactions.length === 0) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="p-10 text-center text-gray-500">
                        No transactions yet.
                    </td>
                </tr>
            `;
            updateTransactionStats([]);
            return;
        }

        table.innerHTML = transactions.map(transaction => {

            let statusClass = "text-yellow-400";

            const status =
                transaction.status || "Pending";

            if (
                status === "Successful" ||
                status === "Completed"
            ) {
                statusClass = "text-green-400";
            }

            if (status === "Failed") {
                statusClass = "text-red-400";
            }

            if (status === "Withdrawn") {
                statusClass = "text-blue-400";
            }

            const transactionDate =
                transaction.createdAt ||
                transaction.date ||
                null;

            return `
                <tr
                    class="border-b border-white/5
                    hover:bg-white/[0.02]
                    transaction-row"
                    data-type="${String(
                        transaction.type || ""
                    ).toLowerCase()}"
                    data-status="${String(
                        status
                    ).toLowerCase()}"
                >

                    <td class="p-5">
                        <div class="font-medium">
                            ${escapeTransactionHTML(
                                transaction.type || "—"
                            )}
                        </div>
                    </td>

                    <td class="p-5 text-gray-400">
                        ${escapeTransactionHTML(
                            transaction.plan || "—"
                        )}
                    </td>

                    <td class="p-5 font-semibold">
                        ${window.money(
                            Number(transaction.amount) || 0
                        )}
                    </td>

                    <td class="p-5 ${statusClass}">
                        ${escapeTransactionHTML(status)}
                    </td>

                    <td class="p-5 text-gray-400">
                        ${window.formatDateTime
                            ? window.formatDateTime(transactionDate)
                            : formatTransactionDate(transactionDate)
                        }
                    </td>

                </tr>
            `;
        }).join("");

        updateTransactionStats(transactions);
        applyTransactionFilters();

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

                    <div class="text-red-400 font-semibold">
                        Unable to load transactions.
                    </div>

                    <div class="text-gray-500 text-sm mt-2">
                        ${escapeTransactionHTML(
                            error?.message ||
                            "Unknown Firebase error."
                        )}
                    </div>

                </td>
            </tr>
        `;

        updateTransactionStats([]);
    }
}


// ------------------------------------------------------------
// STATS
// ------------------------------------------------------------

function updateTransactionStats(transactions) {

    const totalElement =
        document.getElementById(
            "totalTransactions"
        );

    const pendingElement =
        document.getElementById(
            "pendingTransactions"
        );

    const successfulElement =
        document.getElementById(
            "successfulTransactions"
        );

    if (!Array.isArray(transactions)) {
        transactions = [];
    }

    const pending =
        transactions.filter(
            transaction =>
                String(
                    transaction.status || ""
                ).toLowerCase() === "pending"
        ).length;

    const successful =
        transactions.filter(
            transaction => {

                const status =
                    String(
                        transaction.status || ""
                    ).toLowerCase();

                return (
                    status === "successful" ||
                    status === "completed"
                );
            }
        ).length;

    if (totalElement) {
        totalElement.textContent =
            transactions.length;
    }

    if (pendingElement) {
        pendingElement.textContent =
            pending;
    }

    if (successfulElement) {
        successfulElement.textContent =
            successful;
    }
}


// ------------------------------------------------------------
// FILTERS
// ------------------------------------------------------------

function applyTransactionFilters() {

    const searchInput =
        document.getElementById(
            "transactionSearch"
        );

    const filterSelect =
        document.getElementById(
            "transactionFilter"
        );

    const search =
        (
            searchInput?.value || ""
        ).trim().toLowerCase();

    const filter =
        filterSelect?.value || "all";

    document
        .querySelectorAll(".transaction-row")
        .forEach(row => {

            const text =
                row.textContent.toLowerCase();

            const type =
                row.dataset.type || "";

            const status =
                row.dataset.status || "";

            const matchesSearch =
                !search ||
                text.includes(search);

            let matchesFilter = true;

            if (filter === "investment") {
                matchesFilter =
                    type === "investment";
            }

            if (filter === "pending") {
                matchesFilter =
                    status === "pending";
            }

            if (filter === "successful") {
                matchesFilter =
                    status === "successful" ||
                    status === "completed";
            }

            if (filter === "failed") {
                matchesFilter =
                    status === "failed";
            }

            row.style.display =
                matchesSearch && matchesFilter
                    ? ""
                    : "none";
        });
}


// ------------------------------------------------------------
// DATE
// ------------------------------------------------------------

function formatTransactionDate(value) {

    if (!value) {
        return "—";
    }

    try {

        if (
            typeof value === "object" &&
            typeof value.toDate === "function"
        ) {
            return value
                .toDate()
                .toLocaleString();
        }

        return new Date(value)
            .toLocaleString();

    } catch {
        return "—";
    }
}


// ------------------------------------------------------------
// ESCAPE HTML
// ------------------------------------------------------------

function escapeTransactionHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}


// ------------------------------------------------------------
// INITIAL LOAD
// ------------------------------------------------------------

async function loadTransactions() {

    try {

        const user =
            await window.requireAuth();

        if (!user) {
            return;
        }

        await renderTransactions();

    } catch (error) {

        console.error(
            "LOAD TRANSACTIONS ERROR:",
            error
        );
    }
}


// ------------------------------------------------------------
// EVENTS
// ------------------------------------------------------------

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const searchInput =
            document.getElementById(
                "transactionSearch"
            );

        const filterSelect =
            document.getElementById(
                "transactionFilter"
            );

        if (searchInput) {
            searchInput.addEventListener(
                "input",
                applyTransactionFilters
            );
        }

        if (filterSelect) {
            filterSelect.addEventListener(
                "change",
                applyTransactionFilters
            );
        }
    }
);


// ------------------------------------------------------------
// START
// ------------------------------------------------------------

loadTransactions();


// ------------------------------------------------------------
// AUTO REFRESH
// ------------------------------------------------------------

setInterval(
    async () => {

        try {
            await renderTransactions();
        } catch (error) {
            console.error(
                "Transaction refresh error:",
                error
            );
        }

    },
    60 * 1000
);
