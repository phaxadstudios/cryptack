const user = requireAuth();

if (user) {

    const table = document.getElementById("transactionTable");

    const transactions = getTransactions();

    if (transactions.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="5"
                    class="p-10 text-center text-gray-500">
                    No transactions yet.
                </td>
            </tr>
        `;

    } else {

        table.innerHTML = transactions.map(transaction => `

            <tr class="border-t border-white/5">

                <td class="p-5">
                    ${transaction.type}
                </td>

                <td class="p-5 text-gray-400">
                    ${transaction.plan || "-"}
                </td>

                <td class="p-5 font-semibold">
                    ${money(transaction.amount)}
                </td>

                <td class="p-5">
                    <span class="text-green-400">
                        ${transaction.status}
                    </span>
                </td>

                <td class="p-5 text-gray-500">
                    ${formatDate(transaction.date)}
                </td>

            </tr>

        `).join("");
    }
}
