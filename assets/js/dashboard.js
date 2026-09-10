// assets/js/dashboard.js

async function loadDashboard() {

    const user = await requireAuth();

    if (!user) {
        return;
    }

    // Make sure the latest Firestore profile is loaded
    const currentUser = await refreshCurrentUser();

    if (!currentUser) {
        return;
    }

    // ------------------------------------------------------------
    // USER NAME
    // ------------------------------------------------------------

    const userName = document.getElementById("userName");

    if (userName) {

        const name = currentUser.name || "User";

        userName.textContent =
            name.split(" ")[0];
    }


    // ------------------------------------------------------------
    // BALANCE
    // ------------------------------------------------------------

    const balance =
        document.getElementById("balance");

    if (balance) {

        balance.textContent =
            money(currentUser.balance);
    }


    // ------------------------------------------------------------
    // INVESTED
    // ------------------------------------------------------------

    const invested =
        document.getElementById("invested");

    if (invested) {

        invested.textContent =
            money(currentUser.invested);
    }


    // ------------------------------------------------------------
    // RETURNS
    // ------------------------------------------------------------

    const returns =
        document.getElementById("returns");

    if (returns) {

        returns.textContent =
            money(currentUser.returns);
    }


    // ------------------------------------------------------------
    // PORTFOLIO VALUE
    // ------------------------------------------------------------

    const portfolioValue =
        document.getElementById(
            "portfolioValue"
        );

    if (portfolioValue) {

        portfolioValue.textContent =
            money(currentUser.balance);
    }
}


// ------------------------------------------------------------
// LOAD DASHBOARD
// ------------------------------------------------------------

loadDashboard();
