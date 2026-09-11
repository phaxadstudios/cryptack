
// assets/js/transactions.js

// ============================================================
// TRANSACTIONS PAGE
// ============================================================

let allTransactions = [];


// ============================================================
// HELPERS
// ============================================================

function normalizeStatus(status) {
    return String(status || "Pending").trim().toLowerCase();
}


function getStatusBadge(status) {

    const normalized = normalizeStatus(status);

    if (normalized === "successful" || normalized === "completed") {
        return `
            <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                         bg-emerald-500/10 border border-emerald-500/20
                         text-emerald-400 text-xs font-semibold">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                ${status || "Successful"}
            </span>
        `;
    }


    if (
        normalized === "failed" ||
        normalized === "rejected" ||
        normalized === "cancelled"
    ) {
        return `
            <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                         bg-red-500/10 border border-red-500/20
                         text-red-400 text-xs font-semibold">
                <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                ${status || "Failed"}
            </span>
        `;
    }


    if (
        normalized === "withdrawn" ||
        normalized === "withdrawable"
    ) {
        return `
            <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                         bg-violet-500/10 border border-violet-500/20
                         text-violet-400 text-xs font-semibold">
                <span class="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
                ${status || "Withdrawable"}
            </span>
        `;
    }


    return `
        <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                     bg-yellow-500/10 border border-yellow-500/20
                     text-yellow-400 text-xs font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
            ${status || "Pending"}
        </span>
    `;
}


// ============================================================
// TRANSACTION ICON
// ============================================================

function getTransactionIcon(type) {

    const normalized =
        String(type || "Transaction").toLowerCase();


    if (normalized.includes("withdraw")) {

        return `
            <div class="w-10 h-10 rounded-xl
                        bg-red-500/10 border border-red-500/20
                        flex items-center justify-center
                        text-red-400 shrink-0">

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.8"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 19V5m0 0l-5 5m5-5l5 5"
                    />
                </svg>

            </div>
        `;
    }


    if (normalized.includes("investment")) {

        return `
            <div class="w-10 h-10 rounded-xl
                        bg-violet-500/10 border border-violet-500/20
                        flex items-center justify-center
                        text-violet-400 shrink-0">

                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.8"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 8c-3.314 0-6 1.343-6 3s2.686 3 6 3 6-1.343 6-3-2.686-3-6-3z"
                    />
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 11v4c0 1.657 2.686 3 6 3s6-1.343 6-3v-4"
                    />
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 15v4c0 1.657 2.686 3 6 3s6-1.343 6-3v-4"
                    />
                </svg>

            </div>
        `;
    }


    return `
        <div class="w-10 h-10 rounded-xl
                    bg-white/5 border border-white/10
                    flex items-center justify-center
                    text-gray-300 shrink-0">

            <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.8"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 6v12m6-6H6"
                />
            </svg>

        </div>
    `;
}


// ============================================================
// GET TRANSACTION DATE
// ============================================================

function getTransactionDate(transaction) {

    return (
        transaction.createdAt ||
        transaction.date ||
        transaction.completedAt ||
        transaction.withdrawnAt ||
        null
    );
}


// ============================================================
// UPDATE SUMMARY CARDS
// ============================================================

function updateTransactionSummary(transactions) {

    const totalElement =
        document.getElementById("totalTransactions");

    const pendingElement =
        document.getElementById("pendingTransactions");

    const successfulElement =
        document.getElementById("successfulTransactions");


    const total =
        transactions.length;


    const pending =
        transactions.filter(transaction => {

            const status =
                normalizeStatus(transaction.status);

            return (
                status === "pending" ||
                status === "processing"
            );

        }).length;


    const successful =
        transactions.filter(transaction => {

            const status =
                normalizeStatus(transaction.status);

            return (
                status === "successful" ||
                status === "completed"
            );

        }).length;


    if (totalElement) {
        totalElement.textContent =
            numberFormat(total);
    }


    if (pendingElement) {
        pendingElement.textContent =
            numberFormat(pending);
    }


    if (successfulElement) {
        successfulElement.textContent =
            numberFormat(successful);
    }
}


// ============================================================
// EMPTY STATE
// ============================================================

function renderEmptyState(message = "No transactions found.") {

    const table =
        document.getElementById("transactions");


    if (!table) {
        return;
    }


    table.innerHTML = `

        <tr>

            <td
                colspan="5"
                class="px-6 py-16 text-center"
            >

                <div
                    class="mx-auto w-14 h-14 rounded-2xl
                           bg-white/5 border border-white/10
                           flex items-center justify-center
                           text-gray-500 mb-4"
                >

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="w-7 h-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        stroke-width="1.6"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z"
                        />
                    </svg>

                </div>


                <p class="text-white font-medium">
                    ${message}
                </p>


                <p class="text-gray-500 text-sm mt-1">
                    Your investment and withdrawal activity will appear here.
                </p>

            </td>

        </tr>

    `;
}


// ============================================================
// LOADING STATE
// ============================================================

function renderLoadingState() {

    const table =
        document.getElementById("transactions");


    if (!table) {
        return;
    }


    table.innerHTML = `

        <tr>

            <td
                colspan="5"
                class="px-6 py-16 text-center"
            >

                <div
                    class="w-8 h-8 border-2 border-white/10
                           border-t-violet-500 rounded-full
                           animate-spin mx-auto mb-4"
                ></div>


                <p class="text-gray-400 text-sm">
                    Loading transactions...
                </p>

            </td>

        </tr>

    `;
}


// ============================================================
// RENDER TRANSACTIONS
// ============================================================

function renderTransactions(transactions = allTransactions) {

    const table =
        document.getElementById("transactions");


    if (!table) {
        return;
    }


    if (!transactions || transactions.length === 0) {

        renderEmptyState(
            allTransactions.length === 0
                ? "No transactions yet."
                : "No matching transactions found."
        );

        return;
    }


    table.innerHTML =
        transactions
            .map(transaction => {

                const status =
                    transaction.status ||
                    "Pending";


                const date =
                    getTransactionDate(transaction);


                const plan =
                    transaction.plan ||
                    "—";


                const type =
                    transaction.type ||
                    "Transaction";


                const amount =
                    money(
                        Number(transaction.amount || 0)
                    );


                return `

                    <tr
                        class="border-b border-white/5
                               hover:bg-white/[0.025]
                               transition-colors"
                    >

                        <!-- TRANSACTION -->

                        <td class="px-6 py-5">

                            <div class="flex items-center gap-3">

                                ${getTransactionIcon(type)}

                                <div class="min-w-0">

                                    <p
                                        class="text-white font-medium
                                               truncate"
                                    >
                                        ${type}
                                    </p>

                                    <p
                                        class="text-gray-500 text-xs mt-1
                                               truncate"
                                    >
                                        ${
                                            transaction.paymentMethod ||
                                            "Cryptacks"
                                        }
                                    </p>

                                </div>

                            </div>

                        </td>


                        <!-- PLAN -->

                        <td class="px-6 py-5">

                            <span class="text-gray-300">
                                ${plan}
                            </span>

                        </td>


                        <!-- AMOUNT -->

                        <td class="px-6 py-5">

                            <div>

                                <p
                                    class="text-white font-semibold"
                                >
                                    ${amount}
                                </p>

                                ${
                                    transaction.profit
                                        ? `
                                            <p
                                                class="text-emerald-400
                                                       text-xs mt-1"
                                            >
                                                Profit:
                                                ${money(
                                                    Number(
                                                        transaction.profit || 0
                                                    )
                                                )}
                                            </p>
                                          `
                                        : ""
                                }

                            </div>

                        </td>


                        <!-- STATUS -->

                        <td class="px-6 py-5">

                            ${getStatusBadge(status)}

                        </td>


                        <!-- DATE -->

                        <td class="px-6 py-5">

                            <div>

                                <p class="text-gray-300 text-sm">

                                    ${
                                        formatDateTime(date)
                                    }

                                </p>

                            </div>

                        </td>

                    </tr>

                `;

            })
            .join("");
}


// ============================================================
// APPLY SEARCH + FILTER
// ============================================================

function applyTransactionFilters() {

    const searchInput =
        document.getElementById("transactionSearch");

    const filterSelect =
        document.getElementById("transactionFilter");


    const search =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";


    const filter =
        filterSelect
            ? filterSelect.value
            : "all";


    let filtered =
        [...allTransactions];


    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (search) {

        filtered =
            filtered.filter(transaction => {

                const searchableText = [

                    transaction.type,

                    transaction.plan,

                    transaction.status,

                    transaction.paymentMethod,

                    transaction.paymentStatus,

                    transaction.withdrawalStatus

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                return searchableText.includes(search);

            });
    }


    // --------------------------------------------------------
    // FILTER
    // --------------------------------------------------------

    if (filter !== "all") {

        filtered =
            filtered.filter(transaction => {

                const status =
                    normalizeStatus(transaction.status);


                if (filter === "investment") {

                    return String(
                        transaction.type || ""
                    )
                        .toLowerCase()
                        .includes("investment");
                }


                if (filter === "pending") {

                    return (
                        status === "pending" ||
                        status === "processing"
                    );
                }


                if (filter === "successful") {

                    return (
                        status === "successful" ||
                        status === "completed"
                    );
                }


                if (filter === "failed") {

                    return (
                        status === "failed" ||
                        status === "rejected" ||
                        status === "cancelled"
                    );
                }


                return true;

            });
    }


    renderTransactions(filtered);
}


// ============================================================
// LOAD TRANSACTIONS FROM FIRESTORE
// ============================================================

async function loadTransactions() {

    const table =
        document.getElementById("transactions");


    if (table) {
        renderLoadingState();
    }


    try {

        const user =
            await requireAuth();


        if (!user) {
            return;
        }


        // Update investment statuses first.
        await checkInvestments();


        allTransactions =
            await getTransactions();


        updateTransactionSummary(
            allTransactions
        );


        applyTransactionFilters();


    } catch (error) {

        console.error(
            "Unable to load transactions:",
            error
        );


        allTransactions = [];


        updateTransactionSummary([]);


        renderEmptyState(
            "Unable to load transactions."
        );


        if (typeof showToast === "function") {

            showToast(
                "Unable to load transactions. Please refresh the page."
            );

        }

    }
}


// ============================================================
// SEARCH
// ============================================================

const transactionSearch =
    document.getElementById(
        "transactionSearch"
    );


if (transactionSearch) {

    transactionSearch.addEventListener(
        "input",
        applyTransactionFilters
    );

}


// ============================================================
// FILTER
// ============================================================

const transactionFilter =
    document.getElementById(
        "transactionFilter"
    );


if (transactionFilter) {

    transactionFilter.addEventListener(
        "change",
        applyTransactionFilters
    );

}


// ============================================================
// INITIAL LOAD
// ============================================================

loadTransactions();


// ============================================================
// AUTO REFRESH
// ============================================================

setInterval(
    async () => {

        try {

            const user =
                await getCurrentUser();


            if (!user) {
                return;
            }


            await checkInvestments();


            allTransactions =
                await getTransactions();


            updateTransactionSummary(
                allTransactions
            );


            applyTransactionFilters();


        } catch (error) {

            console.error(
                "Transaction refresh error:",
                error
            );

        }

    },
    60 * 1000
);

