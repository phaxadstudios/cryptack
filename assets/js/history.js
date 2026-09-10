const user = requireAuth();

if (user) {

    const container = document.getElementById("history");

    const transactions = getTransactions();

    if (!transactions.length) {

        container.innerHTML = `
            <div class="glass-card p-10 text-center text-gray-500">
                No activity yet.
            </div>
        `;

    } else {

        container.innerHTML = transactions.map(item => `

            <div class="glass-card p-5 flex items-center justify-between">

                <div class="flex items-center gap-4">

                    <div class="w-11 h-11 rounded-xl
                                bg-violet-500/10
                                flex items-center justify-center">
                        📈
                    </div>

                    <div>

                        <p class="font-semibold">
                            ${item.type}
                        </p>

                        <p class="text-sm text-gray-500">
                            ${item.plan || "Portfolio activity"}
                        </p>

                    </div>

                </div>

                <div class="text-right">

                    <p class="font-semibold">
                        ${money(item.amount)}
                    </p>

                    <p class="text-xs text-gray-500">
                        ${formatDate(item.date)}
                    </p>

                </div>

            </div>

        `).join("");
    }
}
