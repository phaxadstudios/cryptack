// assets/js/dashboard.js

// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {
    try {
        const user = await requireAuth();

        if (!user) {
            return;
        }

        // Process investments first so Firestore has the latest
        // investment statuses before we display them.
        try {
            await checkInvestments();
        } catch (error) {
            console.error(
                "Investment processing error:",
                error
            );
        }

        // Get latest user profile
        const currentUser = await refreshCurrentUser();

        if (!currentUser) {
            return;
        }

        // ========================================================
        // USER NAME
        // ========================================================

        const userName =
            document.getElementById("userName");

        if (userName) {
            const name =
                currentUser.name ||
                currentUser.displayName ||
                "User";

            userName.textContent =
                name.split(" ")[0];
        }

        // ========================================================
        // GET INVESTMENTS
        // ========================================================

        const investments =
            await getInvestments();

        // ========================================================
        // CALCULATE DASHBOARD VALUES
        // ========================================================

        const activeInvestments =
            investments.filter(investment => {
                const status =
                    String(
                        investment.status || ""
                    ).toLowerCase();

                return (
                    status !== "withdrawn" &&
                    status !== "cancelled"
                );
            });

        const totalInvested =
            activeInvestments.reduce(
                (total, investment) => {
                    return (
                        total +
                        (
                            Number(
                                investment.amount
                            ) || 0
                        )
                    );
                },
                0
            );

        const totalReturns =
            activeInvestments.reduce(
                (total, investment) => {
                    return (
                        total +
                        (
                            Number(
                                investment.profit
                            ) || 0
                        )
                    );
                },
                0
            );

        const calculatedPortfolioValue =
            activeInvestments.reduce(
                (total, investment) => {
                    const amount =
                        Number(
                            investment.amount
                        ) || 0;

                    const generatedAmount =
                        Number(
                            investment.generatedAmount
                        );

                    return (
                        total +
                        (
                            Number.isFinite(
                                generatedAmount
                            )
                                ? generatedAmount
                                : amount
                        )
                    );
                },
                0
            );

        // ========================================================
        // BALANCE
        // ========================================================

        const balance =
            document.getElementById("balance");

        if (balance) {
            balance.textContent =
                money(currentUser.balance);
        }

        // ========================================================
        // INVESTED
        // ========================================================

        const invested =
            document.getElementById("invested");

        if (invested) {
            invested.textContent =
                money(totalInvested);
        }

        // ========================================================
        // RETURNS
        // ========================================================

        const returns =
            document.getElementById("returns");

        if (returns) {
            returns.textContent =
                money(totalReturns);
        }

        // ========================================================
        // PORTFOLIO VALUE
        // ========================================================

        const portfolioValue =
            document.getElementById(
                "portfolioValue"
            );

        if (portfolioValue) {
            portfolioValue.textContent =
                money(
                    calculatedPortfolioValue
                );
        }

        // ========================================================
        // PORTFOLIO VALUE TOP
        // ========================================================

        const portfolioValueTop =
            document.getElementById(
                "portfolioValueTop"
            );

        if (portfolioValueTop) {
            portfolioValueTop.textContent =
                money(
                    calculatedPortfolioValue
                );
        }

        // ========================================================
        // DISPLAY PENDING INVESTMENTS
        // ========================================================

        displayPendingInvestments(
            investments
        );

    } catch (error) {
        console.error(
            "Dashboard load error:",
            error
        );
    }
}


// ============================================================
// DISPLAY PENDING INVESTMENTS
// ============================================================

function displayPendingInvestments(
    investments
) {
    const box =
        document.getElementById(
            "pendingBox"
        );

    if (!box) {
        return;
    }

    // Always use the latest Firestore data passed
    // from loadDashboard().
    const pending =
        investments.filter(
            investment =>
                String(
                    investment.status || ""
                ).toLowerCase() === "pending"
        );

    // ==========================================================
    // NO PENDING INVESTMENTS
    // ==========================================================

    if (pending.length === 0) {
        box.innerHTML = "";
        return;
    }

    // ==========================================================
    // PENDING INVESTMENTS
    // ==========================================================

    box.innerHTML = `
        <div
            class="rounded-2xl
                   border border-yellow-500/20
                   bg-yellow-500/5
                   p-5"
        >

            <div
                class="flex items-start gap-4"
            >

                <div
                    class="text-yellow-400 text-xl"
                >
                    ⏳
                </div>

                <div class="flex-1">

                    <h3
                        class="font-semibold
                               text-yellow-300"
                    >
                        Investment pending
                    </h3>

                    <p
                        class="text-sm
                               text-gray-400
                               mt-1"
                    >
                        ${pending.length}
                        investment${
                            pending.length > 1
                                ? "s are"
                                : " is"
                        }
                        currently being processed.
                    </p>

                    <div
                        class="mt-4
                               space-y-3"
                    >

                        ${
                            pending
                                .map(
                                    investment => `
                                        <div
                                            class="flex
                                                   justify-between
                                                   items-center
                                                   gap-4
                                                   text-sm"
                                        >

                                            <span
                                                class="text-gray-200"
                                            >
                                                ${
                                                    investment.plan ||
                                                    "Investment"
                                                }
                                                —
                                                ${
                                                    money(
                                                        investment.amount
                                                    )
                                                }
                                            </span>

                                            <span
                                                class="text-yellow-400
                                                       whitespace-nowrap"
                                            >
                                                Pending
                                            </span>

                                        </div>
                                    `
                                )
                                .join("")
                        }

                    </div>

                </div>

            </div>

        </div>
    `;
}


// ============================================================
// REFRESH DASHBOARD
// ============================================================

async function refreshDashboard() {
    try {
        await loadDashboard();
    } catch (error) {
        console.error(
            "Dashboard refresh error:",
            error
        );
    }
}


// ============================================================
// START DASHBOARD
// ============================================================

(async function () {
    try {
        await waitForAuth();
        await loadDashboard();
    } catch (error) {
        console.error(
            "Dashboard initialization error:",
            error
        );
    }
})();


// ============================================================
// AUTO REFRESH
// ============================================================

setInterval(
    async () => {
        try {
            await loadDashboard();
        } catch (error) {
            console.error(
                "Dashboard auto-refresh error:",
                error
            );
        }
    },
    60 * 1000
);
