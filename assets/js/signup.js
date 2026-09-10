const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const users = getUsers();

    const exists = users.some(
        user => user.email.toLowerCase() === email.toLowerCase()
    );

    if (exists) {
        showToast("An account with this email already exists.");
        return;
    }

    const user = {
        id: Date.now(),
        name,
        email,
        password,
        balance: 0,
        invested: 0,
        returns: 0,
        createdAt: new Date().toISOString()
    };

    users.push(user);

    saveUsers(users);
    setCurrentUser(user);

    /*
     * Send registration to Formspree.
     */
    try {

        const formData = new FormData(signupForm);

        await fetch(signupForm.action, {
            method: "POST",
            body: formData,
            headers: {
                Accept: "application/json"
            }
        });

    } catch (error) {
        console.log("Formspree submission failed:", error);
    }

    window.location.href = "dashboard.html";
});
