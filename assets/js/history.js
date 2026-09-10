// assets/js/history.js

// ============================================================
// RENDER ACTIVITY
// ============================================================

async function renderHistory() {

    const container =
        document.getElementById(
            "activity"
        );

    if (!container) {
        return;
    }


    const transactions =
        await getTransactions();


    // ========================================================
    // NO ACTIVITY
    // ========================================================

    if (transactions.length === 0) {

        container.innerHTML = `

            <div class="glass-card p-8 text-center">

                <p class="text-gray-400">
                    No activity yet.
                </p>

            </div>

        `;

        return;
    }


    // ========================================================
    // RENDER ACTIVITY
    // ========================================================

    container.innerHTML =
        transactions
            .map(
                transaction => {

                    const pending =
                        transaction.status ===
                        "Pending";


                    const successful =
                        transaction.status ===
                        "Successful" ||
                        transaction.status ===
                        "Completed";


                    const statusColor =
                        pending
                            ? "text-yellow-400"
                            : successful
                                ? "text-green-400"
                                : "text-red-400";


                    const icon =
                        pending
                            ? "⏳"
                            : successful
                                ? "✓"
                                : "✕";


                    const iconBackground =
                        pending
                            ? "bg-yellow-500/10 text-yellow-400"
                            : successful
                                ? "bg-green-500/10 text-green-400"
                                : "bg-red-500/10 text-red-400";


                    // Firebase uses createdAt.
                    // Keep date as a fallback for older records.

                    const transactionDate =
                        transaction.createdAt ||
                        transaction.date;


                    return `

                        <div
                            class="glass-card p-5"
                        >

                            <div
                                class="flex items-center
                                       justify-between
                                       gap-5"
                            >

                                <div
                                    class="flex items-center
                                           gap-4"
                                >

                                    <div
                                        class="${iconBackground}
                                               w-11 h-11
                                               rounded-full
                                               flex items-center
                                               justify-center"
                                    >

                                        ${icon}

                                    </div>


                                    <div>

                                        <p
                                            class="font-semibold"
                                        >

                                            ${
                                                transaction.type ||
                                                "Transaction"
                                            }

                                            ${
                                                transaction.plan
                                                    ? ` — ${transaction.plan}`
                                                    : ""
                                            }

                                        </p>


                                        <p
                                            class="text-sm
                                                   text-gray-500
                                                   mt-1"
                                        >

                                            ${
                                                formatDateTime(
                                                    transactionDate
                                                )
                                            }

                                        </p>

                                    </div>

                                </div>


                                <div
                                    class="text-right"
                                >

                                    <p
                                        class="font-semibold"
                                    >

                                        ${
                                            money(
                                                transaction.amount
                                            )
                                        }

                                    </p>


                                    <p
                                        class="text-sm ${statusColor}"
                                    >

                                        ${
                                            transaction.status ||
                                            "Pending"
                                        }

                                    </p>

                                </div>

                            </div>

                        </div>

                    `;

                }
            )
            .join("");
}


// ============================================================
// INITIAL LOAD
// ============================================================

async function loadHistory() {

    const user =
        await requireAuth();

    if (!user) {
        return;
    }


    await checkInvestments();

    await renderHistory();
}


// ============================================================
// START
// ============================================================

loadHistory();


// ============================================================
// REFRESH EVERY MINUTE
// ============================================================

setInterval(
    async () => {

        try {

            await checkInvestments();

            await renderHistory();

        } catch (error) {

            console.error(
                "History refresh error:",
                error
            );

        }

    },
    60 * 1000
);
