const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const email = document
        .getElementById("email")
        .value
        .trim()
        .toLowerCase();

    const password = document.getElementById("password").value;

    const users = getUsers();

    const user = users.find(
        item =>
            item.email.toLowerCase() === email &&
            item.password === password
    );

    if (!user) {
        showToast("Invalid email or password.");
        return;
    }

    setCurrentUser(user);

    window.location.href = "dashboard.html";
});
