// assets/js/transactions.js

// ============================================================
// LOAD TRANSACTIONS
// ============================================================

async function renderTransactions() {

    const table =
        document.getElementById(
            "transactions"
        );

    if (!table) {
        return;
    }


    const transactions =
        await getTransactions();


    // ========================================================
    // NO TRANSACTIONS
    // ========================================================

    if (transactions.length === 0) {

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


    // ========================================================
    // RENDER TRANSACTIONS
    // ========================================================

    table.innerHTML =
        transactions
            .map(
                transaction => {

                    let statusClass =
                        "text-yellow-400";


                    if (
                        transaction.status ===
                        "Successful"
                    ) {

                        statusClass =
                            "text-green-400";

                    }


                    if (
                        transaction.status ===
                        "Completed"
                    ) {

                        statusClass =
                            "text-green-400";

                    }


                    if (
                        transaction.status ===
                        "Failed"
                    ) {

                        statusClass =
                            "text-red-400";

                    }


                    // Firestore uses createdAt
                    // rather than the old date field

                    const transactionDate =
                        transaction.createdAt ||
                        transaction.date;


                    return `

                        <tr
                            class="border-b
                                   border-white/5
                                   hover:bg-white/[0.02]"
                        >

                            <td class="p-5">

                                ${
                                    transaction.type ||
                                    "—"
                                }

                            </td>


                            <td
                                class="p-5 text-gray-400"
                            >

                                ${
                                    transaction.plan ||
                                    "—"
                                }

                            </td>


                            <td
                                class="p-5 font-semibold"
                            >

                                ${
                                    money(
                                        transaction.amount
                                    )
                                }

                            </td>


                            <td
                                class="p-5 ${statusClass}"
                            >

                                ${
                                    transaction.status ||
                                    "Pending"
                                }

                            </td>


                            <td
                                class="p-5 text-gray-400"
                            >

                                ${
                                    formatDateTime(
                                        transactionDate
                                    )
                                }

                            </td>

                        </tr>

                    `;

                }
            )
            .join("");
}


// ============================================================
// INITIAL LOAD
// ============================================================

async function loadTransactions() {

    const user =
        await requireAuth();

    if (!user) {
        return;
    }


    // Process investments first so
    // completed investment transactions
    // are reflected

    await checkInvestments();

    await renderTransactions();
}


// ============================================================
// START
// ============================================================

loadTransactions();


// ============================================================
// REFRESH EVERY MINUTE
// ============================================================

setInterval(
    async () => {

        try {

            await checkInvestments();

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
