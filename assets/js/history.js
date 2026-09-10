// assets/js/history.js

const user = requireAuth();


function renderHistory() {

    const container =
        document.getElementById(
            "activity"
        );

    if (!container) {
        return;
    }


    const transactions =
        getTransactions();


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


    container.innerHTML =
        transactions.map(
            transaction => {

                const pending =
                    transaction.status ===
                    "Pending";


                return `

                    <div
                        class="glass-card p-5"
                    >

                        <div
                            class="flex items-center justify-between gap-5"
                        >

                            <div
                                class="flex items-center gap-4"
                            >

                                <div
                                    class="${
                                        pending
                                        ? "bg-yellow-500/10 text-yellow-400"
                                        : "bg-green-500/10 text-green-400"
                                    } w-11 h-11 rounded-full flex items-center justify-center"
                                >

                                    ${
                                        pending
                                        ? "⏳"
                                        : "✓"
                                    }

                                </div>


                                <div>

                                    <p class="font-semibold">

                                        ${
                                            transaction.type
                                        }

                                        ${
                                            transaction.plan
                                            ? ` — ${transaction.plan}`
                                            : ""
                                        }

                                    </p>


                                    <p
                                        class="text-sm text-gray-500 mt-1"
                                    >

                                        ${
                                            formatDateTime(
                                                transaction.date
                                            )
                                        }

                                    </p>

                                </div>

                            </div>


                            <div class="text-right">

                                <p class="font-semibold">

                                    ${
                                        money(
                                            transaction.amount
                                        )
                                    }

                                </p>


                                <p
                                    class="text-sm ${
                                        pending
                                        ? "text-yellow-400"
                                        : "text-green-400"
                                    }"
                                >

                                    ${
                                        transaction.status
                                    }

                                </p>

                            </div>

                        </div>

                    </div>

                `;

            }
        ).join("");
}


checkPendingInvestments();

renderHistory();


setInterval(
    () => {

        checkPendingInvestments();

        renderHistory();

    },
    60 * 1000
);
