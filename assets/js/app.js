
// assets/js/app.js
// Cryptacks application logic
// Firebase SDK: 12.18.0

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
    serverTimestamp
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
// AUTH STATE
// ============================================================

onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (user) {
        try {
            const profileRef = doc(db, "users", user.uid);
            const profileSnap = await getDoc(profileRef);

            if (profileSnap.exists()) {
                currentUserProfile = {
                    id: profileSnap.id,
                    ...profileSnap.data()
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
            console.error("Unable to load user profile:", error);

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

    if (authResolve) {
        authResolve(user);
    }

    // Process investments whenever authentication is ready.
    if (user) {
        try {
            await checkInvestments();
        } catch (error) {
            console.error("Automatic investment processing error:", error);
        }
    }
});


// ============================================================
// AUTH HELPERS
// ============================================================

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

    try {
        const profileRef = doc(db, "users", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
            currentUserProfile = {
                id: profileSnap.id,
                ...profileSnap.data()
            };
        } else {
            currentUserProfile = {
                id: user.uid,
                uid: user.uid,
                email: user.email || "",
                balance: 0
            };
        }

        return currentUserProfile;
    } catch (error) {
        console.error("refreshCurrentUser error:", error);
        return currentUserProfile;
    }
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
        currentUser = null;
        currentUserProfile = null;

        window.location.href = "login.html";
    } catch (error) {
        console.error("Logout error:", error);
        showToast("Unable to log out. Please try again.");
    }
}


// ============================================================
// FORMATTING HELPERS
// ============================================================

function money(value) {
    const number = Number(value || 0);

    return "₦" + number.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function numberFormat(value) {
    const number = Number(value || 0);

    return number.toLocaleString("en-NG");
}

function showToast(message, type = "info") {
    const existing = document.getElementById("appToast");

    if (existing) {
        existing.remove();
    }

    const toast = document.createElement("div");

    toast.id = "appToast";

    let background = "bg-gray-900";
    let border = "border-white/10";

    if (type === "success") {
        background = "bg-green-950";
        border = "border-green-500/30";
    }

    if (type === "error") {
        background = "bg-red-950";
        border = "border-red-500/30";
    }

    toast.className = `
        fixed
        top-5
        right-5
        z-[9999]
        max-w-sm
        px-5
        py-4
        rounded-xl
        border
        ${background}
        ${border}
        text-white
        shadow-2xl
        transition-all
        duration-300
    `;

    toast.textContent = message;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";

        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3500);
}

function convertDate(value) {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return value;
    }

    if (typeof value === "object" && value.seconds !== undefined) {
        return new Date(value.seconds * 1000);
    }

    if (typeof value === "object" && typeof value.toDate === "function") {
        return value.toDate();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

function formatDate(value) {
    const date = convertDate(value);

    if (!date) {
        return "—";
    }

    return date.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function formatDateTime(value) {
    const date = convertDate(value);

    if (!date) {
        return "—";
    }

    return date.toLocaleString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}


// ============================================================
// USER PROFILE
// ============================================================

async function updateUserProfile(data) {
    const user = await requireAuth();

    if (!user) {
        return false;
    }

    try {
        const userRef = doc(db, "users", user.uid);

        await updateDoc(userRef, data);

        await refreshCurrentUser();

        return true;
    } catch (error) {
        console.error("updateUserProfile error:", error);
        throw error;
    }
}


// ============================================================
// INVESTMENTS
// ============================================================

async function getInvestments() {
    const user = await requireAuth();

    if (!user) {
        return [];
    }

    try {
        const investmentsRef = collection(db, "investments");

        const investmentsQuery = query(
            investmentsRef,
            where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(investmentsQuery);

        const investments = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
        }));

        // Sort on the client so Firestore does not require
        // a composite index.
        investments.sort((a, b) => {
            const dateA = convertDate(a.createdAt)?.getTime() || 0;
            const dateB = convertDate(b.createdAt)?.getTime() || 0;

            return dateB - dateA;
        });

        return investments;
    } catch (error) {
        console.error("getInvestments error:", error);
        throw error;
    }
}


async function addInvestment(investment) {
    const user = await requireAuth();

    if (!user) {
        return null;
    }

    try {
        const investmentsRef = collection(db, "investments");

        const investmentData = {
            ...investment,
            userId: user.uid,
            createdAt: investment.createdAt || serverTimestamp()
        };

        const docRef = await addDoc(
            investmentsRef,
            investmentData
        );

        console.log("Investment created:", docRef.id);

        return docRef.id;
    } catch (error) {
        console.error("addInvestment error:", error);
        throw error;
    }
}


async function getInvestment(id) {
    const user = await requireAuth();

    if (!user || !id) {
        return null;
    }

    try {
        const investmentRef = doc(db, "investments", id);
        const snapshot = await getDoc(investmentRef);

        if (!snapshot.exists()) {
            return null;
        }

        const investment = {
            id: snapshot.id,
            ...snapshot.data()
        };

        // Security check.
        if (investment.userId !== user.uid) {
            console.error("Unauthorized investment access.");
            return null;
        }

        return investment;
    } catch (error) {
        console.error("getInvestment error:", error);
        throw error;
    }
}


async function updateInvestment(id, data) {
    const user = await requireAuth();

    if (!user || !id) {
        return false;
    }

    try {
        const investmentRef = doc(db, "investments", id);
        const snapshot = await getDoc(investmentRef);

        if (!snapshot.exists()) {
            throw new Error("Investment does not exist.");
        }

        const investment = snapshot.data();

        if (investment.userId !== user.uid) {
            throw new Error("Unauthorized investment update.");
        }

        await updateDoc(investmentRef, data);

        return true;
    } catch (error) {
        console.error("updateInvestment error:", error);
        throw error;
    }
}


// ============================================================
// TRANSACTIONS
// ============================================================

async function getTransactions() {
    const user = await requireAuth();

    if (!user) {
        return [];
    }

    try {
        const transactionsRef = collection(db, "transactions");

        const transactionsQuery = query(
            transactionsRef,
            where("userId", "==", user.uid)
        );

        const snapshot = await getDocs(transactionsQuery);

        const transactions = snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data()
        }));

        // Client-side sorting avoids requiring a composite
        // Firestore index for userId + createdAt.
        transactions.sort((a, b) => {
            const dateA =
                convertDate(a.createdAt || a.date)?.getTime() || 0;

            const dateB =
                convertDate(b.createdAt || b.date)?.getTime() || 0;

            return dateB - dateA;
        });

        console.log("Transactions loaded:", transactions);

        return transactions;
    } catch (error) {
        console.error("getTransactions error:", error);
        throw error;
    }
}


async function addTransaction(transaction) {
    const user = await requireAuth();

    if (!user) {
        return null;
    }

    try {
        const transactionsRef = collection(db, "transactions");

        const transactionData = {
            ...transaction,
            userId: user.uid,
            createdAt: transaction.createdAt || serverTimestamp()
        };

        const docRef = await addDoc(
            transactionsRef,
            transactionData
        );

        console.log("Transaction created:", docRef.id);

        return docRef.id;
    } catch (error) {
        console.error("addTransaction error:", error);
        throw error;
    }
}


async function updateTransaction(id, data) {
    const user = await requireAuth();

    if (!user || !id) {
        return false;
    }

    try {
        const transactionRef = doc(db, "transactions", id);
        const snapshot = await getDoc(transactionRef);

        if (!snapshot.exists()) {
            throw new Error("Transaction does not exist.");
        }

        const transaction = snapshot.data();

        if (transaction.userId !== user.uid) {
            throw new Error("Unauthorized transaction update.");
        }

        await updateDoc(transactionRef, data);

        return true;
    } catch (error) {
        console.error("updateTransaction error:", error);
        throw error;
    }
}


// ============================================================
// INVESTMENT PROCESSING
// ============================================================

async function processInvestment(investment) {
    if (!investment || !investment.id) {
        return false;
    }

    const user = getFirebaseUser();

    if (!user) {
        return false;
    }

    // Only process the user's own investment.
    if (investment.userId !== user.uid) {
        return false;
    }

    const now = new Date();

    try {
        // ----------------------------------------------------
        // PENDING → SUCCESSFUL
        // ----------------------------------------------------

        if (
            investment.status === "Pending" &&
            investment.completesAt
        ) {
            const completesAt = convertDate(
                investment.completesAt
            );

            if (
                completesAt &&
                now.getTime() >= completesAt.getTime()
            ) {
                await updateInvestment(
                    investment.id,
                    {
                        status: "Successful",
                        completedAt: serverTimestamp(),
                        paymentStatus: "Successful",
                        withdrawalStatus: "Locked",
                        withdrawable: false
                    }
                );

                // Create completion transaction.
                await addTransaction({
                    type: "Investment completed",
                    plan: investment.plan || "",
                    amount: Number(investment.amount || 0),
                    generatedAmount: Number(
                        investment.generatedAmount || 0
                    ),
                    profit: Number(investment.profit || 0),
                    status: "Successful",
                    paymentMethod: investment.paymentMethod || "",
                    paymentStatus: "Successful",
                    withdrawalStatus: "Locked",
                    withdrawableAt:
                        investment.withdrawableAt || null,
                    investmentId: investment.id
                });

                return true;
            }
        }

        // ----------------------------------------------------
        // SUCCESSFUL → WITHDRAWABLE
        // ----------------------------------------------------

        if (
            investment.status === "Successful" &&
            investment.withdrawableAt
        ) {
            const withdrawableAt = convertDate(
                investment.withdrawableAt
            );

            if (
                withdrawableAt &&
                now.getTime() >= withdrawableAt.getTime()
            ) {
                await updateInvestment(
                    investment.id,
                    {
                        status: "Withdrawable",
                        withdrawalStatus: "Available",
                        withdrawable: true
                    }
                );

                return true;
            }
        }

        return false;
    } catch (error) {
        console.error(
            "processInvestment error:",
            investment.id,
            error
        );

        return false;
    }
}


async function checkInvestments() {
    const user = getFirebaseUser();

    if (!user) {
        return [];
    }

    try {
        const investments = await getInvestments();

        for (const investment of investments) {
            await processInvestment(investment);
        }

        return investments;
    } catch (error) {
        console.error("checkInvestments error:", error);
        throw error;
    }
}


// Compatibility wrapper.
async function processInvestments() {
    return await checkInvestments();
}


// Compatibility wrapper.
async function refreshInvestments() {
    return await checkInvestments();
}


// ============================================================
// WITHDRAWAL
// ============================================================

async function withdrawInvestment(investmentId) {
    const user = await requireAuth();

    if (!user || !investmentId) {
        return false;
    }

    try {
        const investment = await getInvestment(investmentId);

        if (!investment) {
            throw new Error("Investment not found.");
        }

        if (investment.userId !== user.uid) {
            throw new Error("Unauthorized withdrawal.");
        }

        if (
            investment.status !== "Withdrawable" &&
            investment.withdrawable !== true
        ) {
            throw new Error(
                "This investment is not available for withdrawal."
            );
        }

        const withdrawalAmount = Number(
            investment.generatedAmount ||
            investment.amount ||
            0
        );

        // Mark investment as withdrawn.
        await updateInvestment(
            investmentId,
            {
                status: "Withdrawn",
                withdrawalStatus: "Completed",
                withdrawable: false,
                withdrawnAt: serverTimestamp()
            }
        );

        // Create withdrawal transaction.
        await addTransaction({
            type: "Withdrawal",
            plan: investment.plan || "",
            amount: withdrawalAmount,
            generatedAmount: withdrawalAmount,
            profit: Number(investment.profit || 0),
            status: "Completed",
            paymentMethod: investment.paymentMethod || "",
            paymentStatus: "Successful",
            withdrawalStatus: "Completed",
            investmentId: investmentId
        });

        return true;
    } catch (error) {
        console.error("withdrawInvestment error:", error);
        throw error;
    }
}


// ============================================================
// WINDOW EXPORTS
// ============================================================

window.getFirebaseUser = getFirebaseUser;
window.waitForAuth = waitForAuth;
window.getCurrentUser = getCurrentUser;
window.setCurrentUser = setCurrentUser;
window.refreshCurrentUser = refreshCurrentUser;
window.requireAuth = requireAuth;
window.logout = logout;

window.money = money;
window.numberFormat = numberFormat;
window.showToast = showToast;
window.convertDate = convertDate;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;

window.getInvestments = getInvestments;
window.addInvestment = addInvestment;
window.getInvestment = getInvestment;
window.updateInvestment = updateInvestment;

window.getTransactions = getTransactions;
window.addTransaction = addTransaction;
window.updateTransaction = updateTransaction;

window.processInvestment = processInvestment;
window.processInvestments = processInvestments;
window.checkInvestments = checkInvestments;
window.refreshInvestments = refreshInvestments;

window.withdrawInvestment = withdrawInvestment;
window.updateUserProfile = updateUserProfile;


// ============================================================
// AUTOMATIC INVESTMENT CHECK
// ============================================================

setInterval(async () => {
    const user = getFirebaseUser();

    if (!user) {
        return;
    }

    try {
        await checkInvestments();
    } catch (error) {
        console.error(
            "Automatic investment check failed:",
            error
        );
    }
}, 60 * 1000);
