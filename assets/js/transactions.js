import { auth } from "./firebase.js";

const table =
document.getElementById("transactionsTable");

const searchInput =
document.getElementById("transactionSearch");

const filterSelect =
document.getElementById("transactionFilter");

function escapeTransactionHTML(value) {

return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");


}

function getTransactionDate(transaction) {


return (
    window.convertDate(
        transaction.createdAt
    ) || new Date(0)
);


}

function renderTransactions(
transactions
) {


if (!table) {
    return;
}

if (!transactions.length) {

    table.innerHTML = `
        <tr>
            <td
                colspan="5"
                class="p-10 text-center text-gray-500"
            >
                No transactions found.
            </td>
        </tr>
    `;

    updateTransactionStats([]);

    return;
}


table.innerHTML =
    transactions
        .map((transaction) => {

            const status =
                transaction.status ||
                "Pending";

            const statusClass =
                status === "Successful"
                    ? "text-emerald-400"
                    : status === "Failed"
                        ? "text-red-400"
                        : "text-yellow-400";

            const amount =
                Number(
                    transaction.amount
                ) || 0;

            const type =
                transaction.type ||
                "Investment";

            return `
                <tr
                    class="border-b border-white/5"
                >

                    <td class="px-5 py-5">
                        <div class="font-medium">
                            ${escapeTransactionHTML(type)}
                        </div>

                        <div class="text-xs text-gray-500 mt-1">
                            ${escapeTransactionHTML(
                                transaction.plan ||
                                transaction.paymentMethod ||
                                "Transaction"
                            )}
                        </div>
                    </td>

                    <td class="px-5 py-5">
                        ${window.money(amount)}
                    </td>

                    <td class="px-5 py-5">
                        <span
                            class="${statusClass} font-semibold"
                        >
                            ${escapeTransactionHTML(status)}
                        </span>
                    </td>

                    <td class="px-5 py-5">
                        ${escapeTransactionHTML(
                            transaction.paymentMethod ||
                            "—"
                        )}
                    </td>

                    <td class="px-5 py-5 text-gray-400">
                        ${escapeTransactionHTML(
                            window.formatDateTime(
                                transaction.createdAt
                            )
                        )}
                    </td>

                </tr>
            `;
        })
        .join("");

updateTransactionStats(
    transactions
);


}

function updateTransactionStats(
transactions
) {


const total =
    transactions.reduce(
        (sum, transaction) =>
            sum +
            (Number(
                transaction.amount
            ) || 0),
        0
    );

const successful =
    transactions.filter(
        (transaction) =>
            transaction.status ===
            "Successful"
    ).length;

const pending =
    transactions.filter(
        (transaction) =>
            transaction.status ===
            "Pending"
    ).length;


const totalElement =
    document.getElementById(
        "totalTransactions"
    );

const amountElement =
    document.getElementById(
        "totalAmount"
    );

const successfulElement =
    document.getElementById(
        "successfulTransactions"
    );

const pendingElement =
    document.getElementById(
        "pendingTransactions"
    );


if (totalElement) {
    totalElement.textContent =
        transactions.length;
}

if (amountElement) {
    amountElement.textContent =
        window.money(total);
}

if (successfulElement) {
    successfulElement.textContent =
        successful;
}

if (pendingElement) {
    pendingElement.textContent =
        pending;
}


}

async function loadTransactions() {


if (!table) {
    return;
}

table.innerHTML = `
    <tr>
        <td
            colspan="5"
            class="p-10 text-center text-gray-500"
        >
            Loading transactions...
        </td>
    </tr>
`;


try {

    const user =
        await window.requireAuth();

    if (!user) {
        return;
    }


    const transactions =
        await window.getTransactions();


    window.__transactions =
        transactions;


    applyFilters();


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
            <td
                colspan="5"
                class="p-10 text-center"
            >

                <div
                    class="text-red-400 font-semibold"
                >
                    Unable to load transactions.
                </div>

                <div
                    class="text-gray-500 text-sm mt-2"
                >
                    ${escapeTransactionHTML(
                        error?.message ||
                        "Unknown error."
                    )}
                </div>

            </td>
        </tr>
    `;

    updateTransactionStats([]);
}


}

function applyFilters() {


const transactions =
    window.__transactions ||
    [];


const search =
    (
        searchInput?.value ||
        ""
    )
        .trim()
        .toLowerCase();


const filter =
    filterSelect?.value ||
    "all";


const filtered =
    transactions.filter(
        (transaction) => {

            const matchesSearch =
                !search ||
                String(
                    transaction.type ||
                    ""
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    transaction.plan ||
                    ""
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    transaction.paymentMethod ||
                    ""
                )
                    .toLowerCase()
                    .includes(search);


            const status =
                String(
                    transaction.status ||
                    "Pending"
                );


            const matchesFilter =
                filter === "all" ||
                status === filter;


            return (
                matchesSearch &&
                matchesFilter
            );
        }
    );


renderTransactions(
    filtered
);


}

if (searchInput) {

searchInput.addEventListener(
    "input",
    applyFilters


}

if (filterSelect) {


filterSelect.addEventListener(
    "change",
    applyFilters
);


}

window.addEventListener(
"load",
() => {


    loadTransactions();

    setInterval(
        loadTransactions,
        60 * 1000
    );
}


);

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
