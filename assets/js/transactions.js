// assets/js/transactions.js

const user = requireAuth();


function renderTransactions() {

    const table =
        document.getElementById(
            "transactions"
        );

    if (!table) {
        return;
    }


    const transactions =
        getTransactions();


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


    table.innerHTML =
        transactions.map(
            transaction => {

                let statusClass =
                    "text-yellow-400";


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


                return `

                    <tr
                        class="border-b border-white/5 hover:bg-white/[0.02]"
                    >

                        <td class="p-5">

                            ${
                                transaction.type
                            }

                        </td>


                        <td class="p-5 text-gray-400">

                            ${
                                transaction.plan ||
                                "—"
                            }

                        </td>


                        <td class="p-5 font-semibold">

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
                                transaction.status
                            }

                        </td>


                        <td class="p-5 text-gray-400">

                            ${
                                formatDateTime(
                                    transaction.date
                                )
                            }

                        </td>

                    </tr>

                `;

            }
        ).join("");
}


checkPendingInvestments();

renderTransactions();


// Refresh status every minute

setInterval(
    () => {

        checkPendingInvestments();

        renderTransactions();

    },
    60 * 1000
);
