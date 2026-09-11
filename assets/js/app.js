
import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ============================================================
// GLOBAL STATE
// ============================================================

let currentUser = null;
let currentUserProfile = null;
let authReady = false;

let authResolve;

const authReadyPromise = new Promise((resolve) => {
    authResolve = resolve;
});


// ============================================================
// AUTH
// ============================================================

onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
        try {
            const userRef = doc(db, "users", user.uid);
            const snapshot = await getDoc(userRef);

            if (snapshot.exists()) {
                currentUserProfile = {
                    id: snapshot.id,
                    ...snapshot.data()
                };
            } else {
                currentUserProfile = {
                    id: user.uid,
                    uid: user.uid,
                    email: user.email || "",
                    balance: 0
                };
            }
        } catch (error) {
            console.error("Profile loading error:", error);

            currentUserProfile = {
                id: user.uid,
                uid: user.uid,
                email: user.email || "",
                balance: 0
            };
        }
    } else {
        currentUserProfile = null;
    }

    authReady = true;
    authResolve(user);

    // Do not block the authentication promise with investment processing.
    if (user) {
        setTimeout(() => {
            checkInvestments().catch((error) => {
                console.error("Investment processing error:", error);
            });
        }, 0);
    }
});


function getFirebaseUser() {
    return currentUser || auth.currentUser || null;
}

async function waitForAuth() {
    if (authReady) {
        return getFirebaseUser();
    }

    return await authReadyPromise;
}

function getCurrentUser() {
    return getFirebaseUser();
}

function setCurrentUser(user) {
    currentUser = user;
}

async function refreshCurrentUser() {
    const user = getFirebaseUser();

    if (!user) {
        currentUserProfile = null;
        return null;
    }

    const userRef = doc(db, "users", user.uid);
    const snapshot = await getDoc(userRef);

    if (snapshot.exists()) {
        currentUserProfile = {
            id: snapshot.id,
            ...snapshot.data()
        };
    }

    return currentUserProfile;
}

async function requireAuth() {
    const user = await waitForAuth();

    if (!user) {
        window.location.href = "login.html";
        return null;
    }

    return user;
}

async function logout() {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Logout error:", error);
        showToast("Unable to log out. Please try again.", "error");
    }
}


// ============================================================
// FORMATTERS
// ============================================================

function money(value) {
    const number = Number(value || 0);

    return "₦" + number.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function numberFormat(value) {
    return Number(value || 0).toLocaleString("en-NG");
}

function convertDate(value) {
    if (!value) return null;

    if (value instanceof Date) {
        return value;
    }

    if (
        typeof value === "object" &&
        value !== null &&
        typeof value.toDate === "function"
    ) {
        return value.toDate();
    }

    if (
        typeof value === "object" &&
        value !== null &&
        value.seconds !== undefined
    ) {
        return new Date(value.seconds * 1000);
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? null
        : date;
}

function formatDate(value) {
    const date = convertDate(value);

    if (!date) return "—";

    return date.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function formatDateTime(value) {
    const date = convertDate(value);

    if (!date) return "—";

    return date.toLocaleString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function showToast(message, type = "info") {
    const oldToast = document.getElementById("appToast");

    if (oldToast) {
        oldToast.remove();
    }

    const toast = document.createElement("div");

    toast.id = "appToast";

    toast.className = `
        fixed top-5 right-5 z-[9999]
        max-w-sm px-5 py-4
        rounded-xl border
        bg-gray-900 border-white/10
        text-white shadow-2xl
    `;

    if (type === "success") {
        toast.classList.add("border-green-500/30");
    }

    if (type === "error") {
        toast.classList.add("border-red-500/30");
    }

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}


// ============================================================
// USER PROFILE
// ============================================================

async function updateUserProfile(data) {
    const user = await requireAuth();

    if (!user) return false;

    const userRef = doc(db, "users", user.uid);

    await updateDoc(userRef, data);

    await refreshCurrentUser();

    return true;
}


// ============================================================
// INVESTMENTS
// ============================================================

async function getInvestments() {
    const user = await requireAuth();

    if (!user) return [];

    const investmentsRef = collection(db, "investments");

    const q = query(
        investmentsRef,
        where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    const investments = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
    }));

    investments.sort((a, b) => {
        const dateA =
            convertDate(a.createdAt)?.getTime() || 0;

        const dateB =
            convertDate(b.createdAt)?.getTime() || 0;

        return dateB - dateA;
    });

    return investments;
}

async function addInvestment(investment) {
    const user = await requireAuth();

    if (!user) return null;

    const investmentRef = collection(
        db,
        "investments"
    );

    const data = {
        ...investment,
        userId: user.uid,
        createdAt:
            investment.createdAt ||
            serverTimestamp()
    };

    const result = await addDoc(
        investmentRef,
        data
    );

    return result.id;
}

async function getInvestment(id) {
    const user = await requireAuth();

    if (!user || !id) return null;

    const investmentRef = doc(
        db,
        "investments",
        id
    );

    const snapshot = await getDoc(
        investmentRef
    );

    if (!snapshot.exists()) {
        return null;
    }

    const investment = {
        id: snapshot.id,
        ...snapshot.data()
    };

    if (investment.userId !== user.uid) {
        return null;
    }

    return investment;
}

async function updateInvestment(id, data) {
    const user = await requireAuth();

    if (!user || !id) return false;

    const investmentRef = doc(
        db,
        "investments",
        id
    );

    const snapshot = await getDoc(
        investmentRef
    );

    if (!snapshot.exists()) {
        throw new Error(
            "Investment does not exist."
        );
    }

    if (snapshot.data().userId !== user.uid) {
        throw new Error(
            "Unauthorized investment update."
        );
    }

    await updateDoc(
        investmentRef,
        data
    );

    return true;
}


// ============================================================
// TRANSACTIONS
// ============================================================

async function getTransactions() {
    const user = await requireAuth();

    if (!user) return [];

    const transactionsRef = collection(
        db,
        "transactions"
    );

    const q = query(
        transactionsRef,
        where("userId", "==", user.uid)
    );

    const snapshot = await getDocs(q);

    const transactions = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data()
    }));

    transactions.sort((a, b) => {
        const dateA =
            convertDate(
                a.createdAt || a.date
            )?.getTime() || 0;

        const dateB =
            convertDate(
                b.createdAt || b.date
            )?.getTime() || 0;

        return dateB - dateA;
    });

    return transactions;
}

async function addTransaction(transaction) {
    const user = await requireAuth();

    if (!user) return null;

    const transactionsRef = collection(
        db,
        "transactions"
    );

    const data = {
        ...transaction,
        userId: user.uid,
        createdAt:
            transaction.createdAt ||
            serverTimestamp()
    };

    const result = await addDoc(
        transactionsRef,
        data
    );

    return result.id;
}

async function updateTransaction(id, data) {
    const user = await requireAuth();

    if (!user || !id) return false;

    const transactionRef = doc(
        db,
        "transactions",
        id
    );

    const snapshot = await getDoc(
        transactionRef
    );

    if (!snapshot.exists()) {
        throw new Error(
            "Transaction does not exist."
        );
    }

    if (snapshot.data().userId !== user.uid) {
        throw new Error(
            "Unauthorized transaction update."
        );
    }

    await updateDoc(
        transactionRef,
        data
    );

    return true;
}


// ============================================================
// IDEMPOTENT INVESTMENT COMPLETION
// ============================================================

async function completeInvestmentIdempotently(
    investment
) {
    const user = getFirebaseUser();

    if (!user) return false;

    const investmentRef = doc(
        db,
        "investments",
        investment.id
    );

    /*
     * Deterministic transaction ID.
     *
     * This is the important part:
     *
     * investment ABC
     *      ↓
     * ABC_completed
     *
     * Processing the investment 1 time or 100 times
     * always targets the same transaction document.
     */
    const transactionRef = doc(
        db,
        "transactions",
        `${investment.id}_completed`
    );

    const investmentSnapshot =
        await getDoc(investmentRef);

    if (!investmentSnapshot.exists()) {
        return false;
    }

    const latestInvestment =
        investmentSnapshot.data();

    if (
        latestInvestment.userId !==
        user.uid
    ) {
        return false;
    }

    /*
     * Already completed.
     * Do not create anything again.
     */
    if (
        latestInvestment.status ===
            "Successful" ||
        latestInvestment.status ===
            "Withdrawable" ||
        latestInvestment.status ===
            "Withdrawn"
    ) {
        return false;
    }

    if (
        latestInvestment.status !==
        "Pending"
    ) {
        return false;
    }

    const completesAt =
        convertDate(
            latestInvestment.completesAt
        );

    if (
        !completesAt ||
        Date.now() <
            completesAt.getTime()
    ) {
        return false;
    }

    /*
     * Check the deterministic transaction.
     */
    const existingTransaction =
        await getDoc(transactionRef);

    /*
     * Create the transaction only if it
     * does not already exist.
     *
     * setDoc is used with a fixed ID,
     * making retries idempotent.
     */
    if (!existingTransaction.exists()) {
        await setDoc(
            transactionRef,
            {
                userId: user.uid,

                type: "Investment completed",

                plan:
                    latestInvestment.plan ||
                    "",

                amount:
                    Number(
                        latestInvestment.amount ||
                        0
                    ),

                generatedAmount:
                    Number(
                        latestInvestment.generatedAmount ||
                        0
                    ),

                profit:
                    Number(
                        latestInvestment.profit ||
                        0
                    ),

                status: "Successful",

                paymentMethod:
                    latestInvestment.paymentMethod ||
                    "",

                paymentStatus:
                    "Successful",

                withdrawalStatus:
                    "Locked",

                withdrawableAt:
                    latestInvestment.withdrawableAt ||
                    null,

                investmentId:
                    investment.id,

                createdAt:
                    serverTimestamp()
            }
        );
    }

    /*
     * Mark the investment as completed.
     */
    await updateDoc(
        investmentRef,
        {
            status: "Successful",
            paymentStatus: "Successful",
            completedAt:
                latestInvestment.completedAt ||
                serverTimestamp(),
            withdrawalStatus: "Locked",
            withdrawable: false
        }
    );

    return true;
}


// ============================================================
// INVESTMENT → WITHDRAWABLE
// ============================================================

async function makeInvestmentWithdrawable(
    investment
) {
    const user = getFirebaseUser();

    if (!user) return false;

    const investmentRef = doc(
        db,
        "investments",
        investment.id
    );

    const snapshot =
        await getDoc(investmentRef);

    if (!snapshot.exists()) {
        return false;
    }

    const latest =
        snapshot.data();

    if (
        latest.userId !==
        user.uid
    ) {
        return false;
    }

    if (
        latest.status !==
        "Successful"
    ) {
        return false;
    }

    const withdrawableAt =
        convertDate(
            latest.withdrawableAt
        );

    if (
        !withdrawableAt ||
        Date.now() <
            withdrawableAt.getTime()
    ) {
        return false;
    }

    await updateDoc(
        investmentRef,
        {
            status: "Withdrawable",
            withdrawalStatus: "Available",
            withdrawable: true
        }
    );

    return true;
}


// ============================================================
// PROCESS INVESTMENT
// ============================================================

async function processInvestment(
    investment
) {
    if (!investment?.id) {
        return false;
    }

    const user = getFirebaseUser();

    if (!user) {
        return false;
    }

    if (
        investment.userId !==
        user.uid
    ) {
        return false;
    }

    try {
        if (
            investment.status ===
                "Pending" &&
            investment.completesAt
        ) {
            const completesAt =
                convertDate(
                    investment.completesAt
                );

            if (
                completesAt &&
                Date.now() >=
                    completesAt.getTime()
            ) {
                return await completeInvestmentIdempotently(
                    investment
                );
            }
        }

        if (
            investment.status ===
                "Successful" &&
            investment.withdrawableAt
        ) {
            return await makeInvestmentWithdrawable(
                investment
            );
        }

        return false;
    } catch (error) {
        console.error(
            "processInvestment error:",
            error
        );

        return false;
    }
}


// ============================================================
// CHECK INVESTMENTS
// ============================================================

async function checkInvestments() {
    const user = getFirebaseUser();

    if (!user) {
        return [];
    }

    try {
        const investments =
            await getInvestments();

        for (const investment of investments) {
            await processInvestment(
                investment
            );
        }

        return investments;
    } catch (error) {
        console.error(
            "checkInvestments error:",
            error
        );

        return [];
    }
}

async function processInvestments() {
    return await checkInvestments();
}

async function refreshInvestments() {
    return await checkInvestments();
}


// ============================================================
// IDEMPOTENT WITHDRAWAL
// ============================================================

async function withdrawInvestment(
    investmentId
) {
    const user = await requireAuth();

    if (!user || !investmentId) {
        return false;
    }

    const investmentRef = doc(
        db,
        "investments",
        investmentId
    );

    const withdrawalTransactionRef =
        doc(
            db,
            "transactions",
            `${investmentId}_withdrawal`
        );

    const investmentSnapshot =
        await getDoc(investmentRef);

    if (!investmentSnapshot.exists()) {
        throw new Error(
            "Investment not found."
        );
    }

    const investment =
        investmentSnapshot.data();

    if (
        investment.userId !==
        user.uid
    ) {
        throw new Error(
            "Unauthorized withdrawal."
        );
    }

    /*
     * Already withdrawn.
     */
    if (
        investment.status ===
        "Withdrawn"
    ) {
        return true;
    }

    if (
        investment.status !==
            "Withdrawable" &&
        investment.withdrawable !== true
    ) {
        throw new Error(
            "This investment is not available for withdrawal."
        );
    }

    /*
     * Deterministic withdrawal transaction.
     */
    const existingTransaction =
        await getDoc(
            withdrawalTransactionRef
        );

    /*
     * If it already exists, simply make sure
     * the investment is marked withdrawn.
     */
    if (existingTransaction.exists()) {
        await updateDoc(
            investmentRef,
            {
                status: "Withdrawn",
                withdrawalStatus: "Completed",
                withdrawable: false,
                withdrawnAt:
                    investment.withdrawnAt ||
                    serverTimestamp()
            }
        );

        return true;
    }

    const withdrawalAmount =
        Number(
            investment.generatedAmount ||
            investment.amount ||
            0
        );

    /*
     * Create the deterministic transaction.
     */
    await setDoc(
        withdrawalTransactionRef,
        {
            userId: user.uid,

            type: "Withdrawal",

            plan:
                investment.plan ||
                "",

            amount:
                withdrawalAmount,

            generatedAmount:
                withdrawalAmount,

            profit:
                Number(
                    investment.profit ||
                    0
                ),

            status: "Completed",

            paymentMethod:
                investment.paymentMethod ||
                "",

            paymentStatus:
                "Successful",

            withdrawalStatus:
                "Completed",

            investmentId:
                investmentId,

            createdAt:
                serverTimestamp()
        }
    );

    /*
     * Mark investment withdrawn.
     */
    await updateDoc(
        investmentRef,
        {
            status: "Withdrawn",
            withdrawalStatus: "Completed",
            withdrawable: false,
            withdrawnAt:
                serverTimestamp()
        }
    );

    return true;
}


// ============================================================
// WINDOW EXPORTS
// ============================================================

window.getFirebaseUser =
    getFirebaseUser;

window.waitForAuth =
    waitForAuth;

window.getCurrentUser =
    getCurrentUser;

window.setCurrentUser =
    setCurrentUser;

window.refreshCurrentUser =
    refreshCurrentUser;

window.requireAuth =
    requireAuth;

window.logout =
    logout;

window.money =
    money;

window.numberFormat =
    numberFormat;

window.showToast =
    showToast;

window.convertDate =
    convertDate;

window.formatDate =
    formatDate;

window.formatDateTime =
    formatDateTime;

window.getInvestments =
    getInvestments;

window.addInvestment =
    addInvestment;

window.getInvestment =
    getInvestment;

window.updateInvestment =
    updateInvestment;

window.getTransactions =
    getTransactions;

window.addTransaction =
    addTransaction;

window.updateTransaction =
    updateTransaction;

window.processInvestment =
    processInvestment;

window.processInvestments =
    processInvestments;

window.checkInvestments =
    checkInvestments;

window.refreshInvestments =
    refreshInvestments;

window.withdrawInvestment =
    withdrawInvestment;

window.updateUserProfile =
    updateUserProfile;


// ============================================================
// BACKGROUND PROCESSING
// ============================================================

setInterval(() => {
    if (!getFirebaseUser()) {
        return;
    }

    checkInvestments().catch((error) => {
        console.error(
            "Background investment processing error:",
            error
        );
    });
}, 60 * 1000);
