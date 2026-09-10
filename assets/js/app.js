function getUsers() {
    return JSON.parse(localStorage.getItem("cryptacks_users") || "[]");
}

function saveUsers(users) {
    localStorage.setItem("cryptacks_users", JSON.stringify(users));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem("cryptacks_current_user") || "null");
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

function money(value) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0
    }).format(value);
}

function showToast(message) {
    const toast = document.createElement("div");

    toast.className = "toast text-sm text-gray-200";
    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function addTransaction(transaction) {

    const transactions = JSON.parse(
        localStorage.getItem("cryptacks_transactions") || "[]"
    );

    transactions.unshift({
        id: Date.now(),
        date: new Date().toISOString(),
        ...transaction
    });

    localStorage.setItem(
        "cryptacks_transactions",
        JSON.stringify(transactions)
    );
}

function getTransactions() {
    return JSON.parse(
        localStorage.getItem("cryptacks_transactions") || "[]"
    );
}

function formatDate(date) {
    return new Date(date).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });
}
