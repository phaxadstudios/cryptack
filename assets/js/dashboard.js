// assets/js/dashboard.js

// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    const user = await requireAuth();

    if (!user) {
        return;
    }

    // Get latest user profile from Firestore
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
            currentUser.name || "User";

        userName.textContent =
            name.split(" ")[0];
    }


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
            money(currentUser.invested);
    }


    // ========================================================
    // RETURNS
    // ========================================================

    const returns =
        document.getElementById("returns");

    if (returns) {

        returns.textContent =
            money(currentUser.returns);
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
            money(currentUser.balance);
    }


    // ========================================================
    // PROCESS INVESTMENTS
    // ========================================================

    await checkInvestments();

    await displayPendingInvestments();
}


// ============================================================
// DISPLAY PENDING INVESTMENTS
// ============================================================

async function displayPendingInvestments() {

    const box =
        document.getElementById(
            "pendingBox"
        );

    if (!box) {
        return;
    }


    const investments =
        await getInvestments();


    const pending =
        investments.filter(
            investment =>
                investment.status === "Pending"
        );


    if (pending.length === 0) {

        box.innerHTML = "";

        return;
    }


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
                                                   text-sm"
                                        >

                                            <span>

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
                                                class="text-yellow-400"
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
// REFRESH DASHBOARD DATA
// ============================================================

async function refreshDashboard() {

    const user =
        await refreshCurrentUser();

    if (!user) {
        return;
    }


    const balance =
        document.getElementById(
            "balance"
        );

    const invested =
        document.getElementById(
            "invested"
        );

    const returns =
        document.getElementById(
            "returns"
        );

    const portfolioValue =
        document.getElementById(
            "portfolioValue"
        );


    if (balance) {

        balance.textContent =
            money(user.balance);
    }


    if (invested) {

        invested.textContent =
            money(user.invested);
    }


    if (returns) {

        returns.textContent =
            money(user.returns);
    }


    if (portfolioValue) {

        portfolioValue.textContent =
            money(user.balance);
    }
}


// ============================================================
// START
// ============================================================

loadDashboard();


// ============================================================
// AUTO REFRESH
// ============================================================

setInterval(
    async () => {

        try {

            await checkInvestments();

            await refreshDashboard();

            await displayPendingInvestments();

        } catch (error) {

            console.error(
                "Dashboard refresh error:",
                error
            );
        }

    },
    60 * 1000
);
