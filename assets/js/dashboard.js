const user = requireAuth();

if (user) {

    document.getElementById("userName").textContent =
        user.name.split(" ")[0];

    document.getElementById("balance").textContent =
        money(user.balance);

    document.getElementById("invested").textContent =
        money(user.invested);

    document.getElementById("returns").textContent =
        money(user.returns);
}
