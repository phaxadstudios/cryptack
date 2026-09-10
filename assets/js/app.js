
// assets/js/app.js

// ============================================================
// USER / AUTHENTICATION
// ============================================================

function getUsers() {
    return JSON.parse(localStorage.getItem("cryptacks_users") || "[]");
}

function saveUsers(users) {
    localStorage.setItem("cryptacks_users", JSON.stringify(users));
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

// ============================================================
// MONEY
// ============================================================

function money(value) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(value) || 0);
}

// ============================================================
// TOAST
// ============================================================

function showToast(message) {
    const toast = document.createElement("div");

    toast.className = "toast text-sm text-gray-200";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

// ============================================================
// TRANSACTIONS
// ============================================================

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

    if (!user) return [];

    const transactions = JSON.parse(
        localStorage.getItem("cryptacks_transactions") || "[]"
    );

    return transactions.filter(
        transaction => transaction.userId === user.id
    );
}

// ============================================================
// DATE FORMATTING
// ============================================================

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}

function formatDateTime(date) {
    return new Date(date).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

// ============================================================
// INVESTMENT STORAGE
// ============================================================

function getPendingInvestments() {
    return JSON.parse(
        localStorage.getItem("cryptacks_pending_investments") || "[]"
    );
}

function savePendingInvestments(investments) {
    localStorage.setItem(
        "cryptacks_pending_investments",
        JSON.stringify(investments)
    );
}

// ============================================================
// COMPLETE INVESTMENT AFTER 2 HOURS
//
// Flow:
//
// Submitted
//    ↓
// Pending for 2 hours
//    ↓
// Successful
//    ↓
// 24-hour withdrawal lock begins
// ============================================================

function processInvestment(investmentId) {
    const user = getCurrentUser();

    if (!user) return;

    const investments = getPendingInvestments();

    const investment = investments.find(
        item =>
            item.id === investmentId &&
            item.userId === user.id
    );

    if (!investment) return;

    if (investment.status !== "Pending") return;

    const completionTime = new Date(
        investment.completesAt
    ).getTime();

    const currentTime = Date.now();

    // Still inside the 2-hour processing period.
    if (currentTime < completionTime) {
        return;
    }

    // ========================================================
    // INVESTMENT SUCCESSFUL
    // ========================================================

    investment.status = "Completed";

    investment.completedAt = new Date().toISOString();

    // The 24-hour withdrawal lock starts NOW.
    investment.withdrawableAt = new Date(
        Date.now() + (24 * 60 * 60 * 1000)
    ).toISOString();

    investment.withdrawalStatus = "Locked";

    // ========================================================
    // UPDATE USER BALANCE / INVESTED / RETURNS
    // ========================================================

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

    // ========================================================
    // UPDATE USER IN USERS ARRAY
    // ========================================================

    const users = getUsers();

    const userIndex = users.findIndex(
        savedUser => savedUser.id === user.id
    );

    if (userIndex !== -1) {
        users[userIndex] = user;
        saveUsers(users);
    }

    // ========================================================
    // UPDATE TRANSACTION
    // ========================================================

    const allTransactions = JSON.parse(
        localStorage.getItem("cryptacks_transactions") || "[]"
    );

    const transaction = allTransactions.find(
        transaction =>
            transaction.userId === user.id &&
            transaction.investmentId === investment.id
    );

    if (transaction) {
        transaction.status = "Completed";
        transaction.completedAt = investment.completedAt;
        transaction.withdrawableAt = investment.withdrawableAt;
        transaction.withdrawalStatus = "Locked";
    }

    localStorage.setItem(
        "cryptacks_transactions",
        JSON.stringify(allTransactions)
    );

    // Save investment changes.
    savePendingInvestments(investments);
}

// ============================================================
// CHECK INVESTMENTS WAITING FOR 2-HOUR COMPLETION
// ============================================================

function checkPendingInvestments() {
    const user = getCurrentUser();

    if (!user) return;

    const investments = getPendingInvestments();

    const now = Date.now();

    investments
        .filter(
            investment =>
                investment.userId === user.id &&
                investment.status === "Pending"
        )
        .forEach(investment => {
            const completionTime = new Date(
                investment.completesAt
            ).getTime();

            if (now >= completionTime) {
                processInvestment(investment.id);
            }
        });
}

// ============================================================
// CHECK 24-HOUR WITHDRAWAL LOCK
// ============================================================
//
// Once an investment is Completed, it remains Locked until
// withdrawableAt.
//
// This works even if the user closes the browser.
//
// ============================================================

function checkWithdrawableInvestments() {
    const user = getCurrentUser();

    if (!user) return;

    const investments = getPendingInvestments();

    const now = Date.now();

    let changed = false;

    investments.forEach(investment => {
        if (
            investment.userId !== user.id ||
            investment.status !== "Completed" ||
            investment.withdrawalStatus !== "Locked"
        ) {
            return;
        }

        const withdrawableTime = new Date(
            investment.withdrawableAt
        ).getTime();

        if (now >= withdrawableTime) {
            investment.withdrawalStatus = "Available";
            investment.withdrawable = true;

            changed = true;

            // Update matching transaction.
            const transactions = JSON.parse(
                localStorage.getItem("cryptacks_transactions") || "[]"
            );

            const transaction = transactions.find(
                item =>
                    item.userId === user.id &&
                    item.investmentId === investment.id
            );

            if (transaction) {
                transaction.withdrawalStatus = "Available";
                transaction.withdrawableAt =
                    investment.withdrawableAt;
            }

            localStorage.setItem(
                "cryptacks_transactions",
                JSON.stringify(transactions)
            );
        }
    });

    if (changed) {
        savePendingInvestments(investments);
    }
}

// ============================================================
// MASTER INVESTMENT CHECK
// ============================================================

function checkInvestments() {
    checkPendingInvestments();
    checkWithdrawableInvestments();
}

// Run immediately.
checkInvestments();

// Check every minute.
setInterval(checkInvestments, 60 * 1000);
