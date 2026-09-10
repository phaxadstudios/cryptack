// assets/js/app.js

function getUsers() {
    return JSON.parse(
        localStorage.getItem("cryptacks_users") || "[]"
    );
}

function saveUsers(users) {
    localStorage.setItem(
        "cryptacks_users",
        JSON.stringify(users)
    );
}

function getCurrentUser() {
    return JSON.parse(
        localStorage.getItem("cryptacks_current_user") || "null"
    );
}

function setCurrentUser(user) {
    localStorage.setItem(
        "cryptacks_current_user",
        JSON.stringify(user)
    );
}

function logout() {
    localStorage.removeItem("cryptacks_current_user");
    window.location.href = "login.html";
}

function requireAuth() {
    const user = getCurrentUser();

    if (!user) {
        window.location.href = "login.html";
        return null;
    }

    return user;
}


// ===============================
// MONEY FORMAT
// ===============================

function money(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value) || 0);
}


// ===============================
// TOAST
// ===============================

function showToast(message) {
    const toast = document.createElement("div");

    toast.className =
        "toast text-sm text-gray-200";

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}


// ===============================
// TRANSACTIONS
// ===============================

function addTransaction(transaction) {

    const user = getCurrentUser();

    const transactions = JSON.parse(
        localStorage.getItem("cryptacks_transactions") || "[]"
    );

    transactions.unshift({
        id: Date.now(),
        userId: user ? user.id : null,
        date: new Date().toISOString(),
        ...transaction
    });

    localStorage.setItem(
        "cryptacks_transactions",
        JSON.stringify(transactions)
    );
}


function getTransactions() {

    const user = getCurrentUser();

    if (!user) {
        return [];
    }

    const transactions = JSON.parse(
        localStorage.getItem("cryptacks_transactions") || "[]"
    );

    return transactions.filter(
        transaction =>
            transaction.userId === user.id
    );
}


// ===============================
// DATE FORMAT
// ===============================

function formatDate(date) {

    return new Date(date).toLocaleDateString(
        "en-US",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}


function formatDateTime(date) {

    return new Date(date).toLocaleString(
        "en-US",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


// ===============================
// PENDING INVESTMENTS
// ===============================

function getPendingInvestments() {

    return JSON.parse(
        localStorage.getItem(
            "cryptacks_pending_investments"
        ) || "[]"
    );
}


function savePendingInvestments(investments) {

    localStorage.setItem(
        "cryptacks_pending_investments",
        JSON.stringify(investments)
    );
}


// ===============================
// COMPLETE INVESTMENT
// ===============================

function processInvestment(investmentId) {

    const user = getCurrentUser();

    if (!user) {
        return;
    }

    const pendingInvestments =
        getPendingInvestments();

    const investment =
        pendingInvestments.find(
            item =>
                item.id === investmentId &&
                item.userId === user.id
        );

    if (!investment) {
        return;
    }

    if (investment.status !== "Pending") {
        return;
    }


    const completionTime =
        new Date(
            investment.completesAt
        ).getTime();

    const currentTime = Date.now();


    // Don't complete early
    if (currentTime < completionTime) {
        return;
    }


    // ===============================
    // UPDATE USER
    // ===============================

    user.invested =
        Number(user.invested || 0) +
        Number(investment.amount);

    user.returns =
        Number(user.returns || 0) +
        Number(investment.profit);

    user.balance =
        Number(user.balance || 0) +
        Number(investment.amount) +
        Number(investment.profit);


    setCurrentUser(user);


    // ===============================
    // UPDATE SAVED USER
    // ===============================

    const users = getUsers();

    const userIndex =
        users.findIndex(
            savedUser =>
                savedUser.id === user.id
        );

    if (userIndex !== -1) {

        users[userIndex] = user;

        saveUsers(users);
    }


    // ===============================
    // UPDATE INVESTMENT
    // ===============================

    investment.status = "Completed";

    investment.completedAt =
        new Date().toISOString();


    savePendingInvestments(
        pendingInvestments
    );


    // ===============================
    // UPDATE TRANSACTION
    // ===============================

    const allTransactions =
        JSON.parse(
            localStorage.getItem(
                "cryptacks_transactions"
            ) || "[]"
        );


    const transaction =
        allTransactions.find(
            transaction =>
                transaction.userId === user.id &&
                transaction.investmentId ===
                    investment.id
        );


    if (transaction) {

        transaction.status =
            "Completed";

        transaction.completedAt =
            new Date().toISOString();
    }


    localStorage.setItem(
        "cryptacks_transactions",
        JSON.stringify(allTransactions)
    );
}


// ===============================
// CHECK ALL PENDING INVESTMENTS
// ===============================

function checkPendingInvestments() {

    const user = getCurrentUser();

    if (!user) {
        return;
    }

    const pendingInvestments =
        getPendingInvestments();

    const now = Date.now();


    pendingInvestments
        .filter(
            investment =>
                investment.userId === user.id &&
                investment.status === "Pending"
        )
        .forEach(investment => {

            const completionTime =
                new Date(
                    investment.completesAt
                ).getTime();


            if (now >= completionTime) {

                processInvestment(
                    investment.id
                );
            }

        });
}


// Run whenever a page loads
checkPendingInvestments();


// Check again every minute
setInterval(
    checkPendingInvestments,
    60 * 1000
);
