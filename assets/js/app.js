// assets/js/app.js

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
    setDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ============================================================
// AUTH STATE
// ============================================================

let currentUser = null;
let currentUserProfile = null;
let authReady = false;
let authResolved = false;

let authResolve;

const authReadyPromise = new Promise((resolve) => {
    authResolve = resolve;
});

onAuthStateChanged(auth, (user) => {
    currentUser = user;
    currentUserProfile = null;
    authReady = true;

    if (!authResolved) {
        authResolved = true;
        authResolve(user);
    }

    if (user) {
        refreshCurrentUser()
            .catch((error) => {
                console.error(
                    "Profile load error:",
                    error
                );
            });

        setTimeout(() => {
            checkInvestments()
                .catch((error) => {
                    console.error(
                        "Investment check error:",
                        error
                    );
                });
        }, 0);
    }
});


// ============================================================
// AUTH HELPERS
// ============================================================

function getFirebaseUser() {
    return currentUser;
}

function getCurrentUser() {
    return currentUserProfile || currentUser;
}

function setCurrentUser(user) {
    currentUser = user;
    currentUserProfile = user;
}

async function waitForAuth() {
    if (authReady) {
        return getFirebaseUser();
    }

    return await Promise.race([
        authReadyPromise,

        new Promise((_, reject) => {
            setTimeout(() => {
                reject(
                    new Error(
                        "Authentication initialization timed out."
                    )
                );
            }, 10000);
        })
    ]);
}

async function requireAuth() {
    const user = await waitForAuth();

    if (!user) {
        if (
            !window.location.pathname.endsWith(
                "login.html"
            )
        ) {
            window.location.href = "login.html";
        }

        return null;
    }

    return user;
}


// ============================================================
// USER PROFILE
// ============================================================

async function refreshCurrentUser() {
    const user = getFirebaseUser();

    if (!user) {
        currentUserProfile = null;
        return null;
    }

    try {
        const userRef =
            doc(
                db,
                "users",
                user.uid
            );

        const snap =
            await getDoc(userRef);

        if (snap.exists()) {
            currentUserProfile = {
                id: snap.id,
                uid: user.uid,
                ...snap.data()
            };
        } else {
            currentUserProfile = {
                id: user.uid,
                uid: user.uid,
                email: user.email || "",
                displayName:
                    user.displayName || "User",
                name:
                    user.displayName || "User",
                balance: 0,
                invested: 0,
                returns: 0
            };
        }

    } catch (error) {
        console.error(
            "Unable to load user profile:",
            error
        );

        currentUserProfile = {
            id: user.uid,
            uid: user.uid,
            email: user.email || "",
            displayName:
                user.displayName || "User",
            name:
                user.displayName || "User",
            balance: 0,
            invested: 0,
            returns: 0
        };
    }

    return currentUserProfile;
}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {
    try {
        await signOut(auth);

        window.location.href =
            "login.html";

    } catch (error) {
        console.error(
            "Logout error:",
            error
        );

        showToast(
            "Unable to logout. Please try again."
        );
    }
}


// ============================================================
// FORMATTING
// ============================================================

function money(value) {
    const number =
        Number(value) || 0;

    return (
        "$" +
        number.toLocaleString(
            "en-US",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );
}

function numberFormat(value) {
    const number =
        Number(value) || 0;

    return number.toLocaleString(
        "en-US"
    );
}


// ============================================================
// TOAST
// ============================================================

function showToast(message) {
    let toast =
        document.getElementById(
            "globalToast"
        );

    if (!toast) {
        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "globalToast";

        toast.className =
            "fixed bottom-6 right-6 z-[9999] " +
            "bg-gray-900 border border-white/10 " +
            "text-white px-5 py-3 rounded-xl " +
            "shadow-2xl text-sm";

        document.body.appendChild(
            toast
        );
    }

    toast.textContent =
        message;

    toast.classList.remove(
        "hidden"
    );

    clearTimeout(
        toast._timeout
    );

    toast._timeout =
        setTimeout(() => {
            toast.classList.add(
                "hidden"
            );
        }, 3500);
}


// ============================================================
// DATE HELPERS
// ============================================================

function convertDate(value) {
    if (!value) {
        return null;
    }

    if (
        value &&
        typeof value.toDate ===
            "function"
    ) {
        return value.toDate();
    }

    if (
        value &&
        typeof value.seconds ===
            "number"
    ) {
        return new Date(
            value.seconds * 1000
        );
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return null;
    }

    return date;
}

function formatDate(value) {
    const date =
        convertDate(value);

    if (!date) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}

function formatDateTime(value) {
    const date =
        convertDate(value);

    if (!date) {
        return "—";
    }

    return date.toLocaleString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


// ============================================================
// INVESTMENTS
// ============================================================

async function addInvestment(
    investment
) {
    const user =
        getFirebaseUser();

    if (!user) {
        throw new Error(
            "User is not authenticated."
        );
    }

    const data = {
        ...investment,

        userId:
            user.uid,

        createdAt:
            investment.createdAt ||
            new Date().toISOString(),

        updatedAt:
            serverTimestamp()
    };

    const ref =
        await addDoc(
            collection(
                db,
                "investments"
            ),
            data
        );

    return ref.id;
}


async function getInvestments() {
    const user =
        getFirebaseUser();

    if (!user) {
        return [];
    }

    const q =
        query(
            collection(
                db,
                "investments"
            ),

            where(
                "userId",
                "==",
                user.uid
            )
        );

    const snapshot =
        await getDocs(q);

    return snapshot.docs
        .map((item) => ({
            id: item.id,
            ...item.data()
        }))
        .sort((a, b) => {
            const dateA =
                convertDate(
                    a.createdAt
                )?.getTime() || 0;

            const dateB =
                convertDate(
                    b.createdAt
                )?.getTime() || 0;

            return (
                dateB - dateA
            );
        });
}


async function updateInvestment(
    investmentId,
    updates
) {
    const user =
        getFirebaseUser();

    if (!user) {
        throw new Error(
            "User is not authenticated."
        );
    }

    const ref =
        doc(
            db,
            "investments",
            investmentId
        );

    const snap =
        await getDoc(ref);

    if (!snap.exists()) {
        throw new Error(
            "Investment not found."
        );
    }

    if (
        snap.data().userId !==
        user.uid
    ) {
        throw new Error(
            "You cannot update this investment."
        );
    }

    await updateDoc(
        ref,
        {
            ...updates,
            updatedAt:
                serverTimestamp()
        }
    );

    return true;
}


async function getPendingInvestments() {
    const investments =
        await getInvestments();

    return investments.filter(
        (investment) =>
            String(
                investment.status || ""
            ).toLowerCase() ===
            "pending"
    );
}


// ============================================================
// TRANSACTIONS
// ============================================================

async function addTransaction(
    transaction
) {
    const user =
        getFirebaseUser();

    if (!user) {
        throw new Error(
            "User is not authenticated."
        );
    }

    const data = {
        ...transaction,

        userId:
            user.uid,

        createdAt:
            transaction.createdAt ||
            new Date().toISOString(),

        updatedAt:
            serverTimestamp()
    };

    const ref =
        await addDoc(
            collection(
                db,
                "transactions"
            ),
            data
        );

    return ref.id;
}


async function getTransactions() {
    const user =
        getFirebaseUser();

    if (!user) {
        return [];
    }

    const q =
        query(
            collection(
                db,
                "transactions"
            ),

            where(
                "userId",
                "==",
                user.uid
            )
        );

    const snapshot =
        await getDocs(q);

    return snapshot.docs
        .map((item) => ({
            id: item.id,
            ...item.data()
        }))
        .sort((a, b) => {
            const dateA =
                convertDate(
                    a.createdAt
                )?.getTime() || 0;

            const dateB =
                convertDate(
                    b.createdAt
                )?.getTime() || 0;

            return (
                dateB - dateA
            );
        });
}


// ============================================================
// COMPLETE INVESTMENT
// ============================================================
//
// When an investment reaches its completion time:
//
// 1. Investment becomes Successful
// 2. Investment becomes Withdrawable
// 3. Generated amount is credited to user balance
// 4. Completion transaction is created
//
// The deterministic transaction ID makes this idempotent.
// The balance can NEVER be credited twice by this function.
// ============================================================

async function completeInvestmentIdempotently(
    investmentId
) {
    const user =
        getFirebaseUser();

    if (!user) {
        return false;
    }

    const investmentRef =
        doc(
            db,
            "investments",
            investmentId
        );

    const completionTransactionRef =
        doc(
            db,
            "transactions",
            `${investmentId}_completed`
        );

    const userRef =
        doc(
            db,
            "users",
            user.uid
        );

    return await runTransaction(
        db,
        async (transaction) => {

            // ------------------------------------------------
            // READ ALL DOCUMENTS FIRST
            // ------------------------------------------------

            const investmentSnap =
                await transaction.get(
                    investmentRef
                );

            if (
                !investmentSnap.exists()
            ) {
                return false;
            }

            const investment =
                investmentSnap.data();

            if (
                investment.userId !==
                user.uid
            ) {
                return false;
            }

            const completionSnap =
                await transaction.get(
                    completionTransactionRef
                );

            const userSnap =
                await transaction.get(
                    userRef
                );

            // ------------------------------------------------
            // ALREADY COMPLETED
            // ------------------------------------------------

            if (
                completionSnap.exists()
            ) {
                return false;
            }

            // ------------------------------------------------
            // MUST STILL BE PENDING
            // ------------------------------------------------

            if (
                String(
                    investment.status || ""
                ).toLowerCase() !==
                "pending"
            ) {
                return false;
            }

            // ------------------------------------------------
            // CHECK COMPLETION TIME
            // ------------------------------------------------

            const completesAt =
                convertDate(
                    investment.completesAt
                );

            if (
                !completesAt ||
                Date.now() <
                    completesAt.getTime()
            ) {
                return false;
            }

            // ------------------------------------------------
            // CALCULATE CREDIT
            // ------------------------------------------------

            const generatedAmount =
                Number(
                    investment.generatedAmount
                );

            const originalAmount =
                Number(
                    investment.amount
                ) || 0;

            const creditAmount =
                Number.isFinite(
                    generatedAmount
                )
                    ? generatedAmount
                    : originalAmount;

            // ------------------------------------------------
            // CURRENT USER BALANCE
            // ------------------------------------------------

            let currentBalance = 0;

            if (
                userSnap.exists()
            ) {
                currentBalance =
                    Number(
                        userSnap.data().balance
                    ) || 0;
            }

            const newBalance =
                currentBalance +
                creditAmount;

            const completedAt =
                new Date();

            // ------------------------------------------------
            // UPDATE INVESTMENT
            // ------------------------------------------------

            transaction.update(
                investmentRef,
                {
                    status:
                        "Successful",

                    paymentStatus:
                        "Successful",

                    completedAt:
                        completedAt.toISOString(),

                    withdrawableAt:
                        completedAt.toISOString(),

                    withdrawalStatus:
                        "Unlocked",

                    withdrawable:
                        true,

                    updatedAt:
                        serverTimestamp()
                }
            );

            // ------------------------------------------------
            // UPDATE USER BALANCE
            // ------------------------------------------------

            if (
                userSnap.exists()
            ) {
                transaction.update(
                    userRef,
                    {
                        balance:
                            newBalance,

                        updatedAt:
                            serverTimestamp()
                    }
                );
            } else {
                transaction.set(
                    userRef,
                    {
                        uid:
                            user.uid,

                        email:
                            user.email || "",

                        name:
                            user.displayName ||
                            "User",

                        displayName:
                            user.displayName ||
                            "User",

                        balance:
                            creditAmount,

                        invested:
                            0,

                        returns:
                            0,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()
                    }
                );
            }

            // ------------------------------------------------
            // CREATE COMPLETION TRANSACTION
            // ------------------------------------------------

            transaction.set(
                completionTransactionRef,
                {
                    userId:
                        user.uid,

                    type:
                        "Investment completed",

                    plan:
                        investment.plan ||
                        "Investment",

                    amount:
                        originalAmount,

                    generatedAmount:
                        creditAmount,

                    profit:
                        Number(
                            investment.profit
                        ) || 0,

                    status:
                        "Successful",

                    paymentMethod:
                        investment.paymentMethod ||
                        "",

                    paymentStatus:
                        "Successful",

                    withdrawalStatus:
                        "Unlocked",

                    withdrawableAt:
                        completedAt.toISOString(),

                    investmentId:
                        investmentId,

                    creditedToBalance:
                        true,

                    balanceCredited:
                        creditAmount,

                    createdAt:
                        completedAt.toISOString(),

                    updatedAt:
                        serverTimestamp()
                }
            );

            return true;
        }
    );
}


// ============================================================
// MAKE INVESTMENT WITHDRAWABLE
// ============================================================

async function makeInvestmentWithdrawable(
    investmentId
) {
    const user =
        getFirebaseUser();

    if (!user) {
        return false;
    }

    const ref =
        doc(
            db,
            "investments",
            investmentId
        );

    return await runTransaction(
        db,
        async (transaction) => {

            const snap =
                await transaction.get(
                    ref
                );

            if (!snap.exists()) {
                return false;
            }

            const investment =
                snap.data();

            if (
                investment.userId !==
                user.uid
            ) {
                return false;
            }

            if (
                String(
                    investment.status || ""
                ).toLowerCase() ===
                "withdrawable"
            ) {
                return true;
            }

            if (
                String(
                    investment.status || ""
                ).toLowerCase() !==
                "successful"
            ) {
                return false;
            }

            const completedAt =
                convertDate(
                    investment.completedAt
                );

            if (
                !completedAt ||
                Date.now() <
                    completedAt.getTime()
            ) {
                return false;
            }

            transaction.update(
                ref,
                {
                    status:
                        "Withdrawable",

                    withdrawalStatus:
                        "Unlocked",

                    withdrawable:
                        true,

                    withdrawableAt:
                        investment.withdrawableAt ||
                        new Date().toISOString(),

                    updatedAt:
                        serverTimestamp()
                }
            );

            return true;
        }
    );
}


// ============================================================
// WITHDRAW INVESTMENT
// ============================================================

async function withdrawInvestment(
    investmentId
) {
    const user =
        getFirebaseUser();

    if (!user) {
        throw new Error(
            "User is not authenticated."
        );
    }

    const investmentRef =
        doc(
            db,
            "investments",
            investmentId
        );

    const withdrawalRef =
        doc(
            db,
            "transactions",
            `${investmentId}_withdrawal`
        );

    return await runTransaction(
        db,
        async (transaction) => {

            const investmentSnap =
                await transaction.get(
                    investmentRef
                );

            if (
                !investmentSnap.exists()
            ) {
                throw new Error(
                    "Investment not found."
                );
            }

            const investment =
                investmentSnap.data();

            if (
                investment.userId !==
                user.uid
            ) {
                throw new Error(
                    "You cannot withdraw this investment."
                );
            }

            const withdrawalSnap =
                await transaction.get(
                    withdrawalRef
                );

            if (
                String(
                    investment.status || ""
                ).toLowerCase() ===
                "withdrawn"
            ) {
                return true;
            }

            if (
                String(
                    investment.status || ""
                ).toLowerCase() !==
                    "withdrawable" &&
                investment.withdrawable !==
                    true
            ) {
                throw new Error(
                    "This investment is not withdrawable yet."
                );
            }

            const withdrawnAt =
                new Date();

            transaction.update(
                investmentRef,
                {
                    status:
                        "Withdrawn",

                    withdrawalStatus:
                        "Withdrawn",

                    withdrawable:
                        false,

                    withdrawnAt:
                        withdrawnAt.toISOString(),

                    updatedAt:
                        serverTimestamp()
                }
            );

            if (
                !withdrawalSnap.exists()
            ) {
                transaction.set(
                    withdrawalRef,
                    {
                        userId:
                            user.uid,

                        type:
                            "Withdrawal",

                        plan:
                            investment.plan ||
                            "Investment",

                        amount:
                            Number(
                                investment.generatedAmount ||
                                investment.amount
                            ) || 0,

                        generatedAmount:
                            Number(
                                investment.generatedAmount
                            ) || 0,

                        profit:
                            Number(
                                investment.profit
                            ) || 0,

                        status:
                            "Successful",

                        paymentMethod:
                            investment.paymentMethod ||
                            "",

                        paymentStatus:
                            "Successful",

                        withdrawalStatus:
                            "Withdrawn",

                        withdrawableAt:
                            investment.withdrawableAt ||
                            null,

                        investmentId:
                            investmentId,

                        createdAt:
                            withdrawnAt.toISOString(),

                        updatedAt:
                            serverTimestamp()
                    }
                );
            }

            return true;
        }
    );
}


// ============================================================
// PROCESS ONE INVESTMENT
// ============================================================

async function processInvestment(
    investment
) {
    if (!investment?.id) {
        return false;
    }

    const status =
        String(
            investment.status || ""
        ).toLowerCase();

    // --------------------------------------------------------
    // PENDING → SUCCESSFUL
    // --------------------------------------------------------

    if (
        status === "pending"
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
                investment.id
            );
        }
    }

    // --------------------------------------------------------
    // SUCCESSFUL → WITHDRAWABLE
    // --------------------------------------------------------

    if (
        status === "successful"
    ) {
        const completedAt =
            convertDate(
                investment.completedAt
            );

        if (
            completedAt &&
            Date.now() >=
                completedAt.getTime()
        ) {
            return await makeInvestmentWithdrawable(
                investment.id
            );
        }
    }

    return false;
}


// ============================================================
// CHECK ALL INVESTMENTS
// ============================================================

async function checkInvestments() {
    const user =
        getFirebaseUser();

    if (!user) {
        return;
    }

    try {
        const investments =
            await getInvestments();

        for (
            const investment of
            investments
        ) {
            try {
                await processInvestment(
                    investment
                );
            } catch (error) {
                console.error(
                    "Investment processing error:",
                    investment.id,
                    error
                );
            }
        }

    } catch (error) {
        console.error(
            "Unable to check investments:",
            error
        );
    }
}


// ============================================================
// GLOBAL EXPORTS
// ============================================================

window.getFirebaseUser =
    getFirebaseUser;

window.getCurrentUser =
    getCurrentUser;

window.setCurrentUser =
    setCurrentUser;

window.waitForAuth =
    waitForAuth;

window.requireAuth =
    requireAuth;

window.refreshCurrentUser =
    refreshCurrentUser;

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

window.addInvestment =
    addInvestment;

window.getInvestments =
    getInvestments;

window.updateInvestment =
    updateInvestment;

window.addTransaction =
    addTransaction;

window.getTransactions =
    getTransactions;

window.getPendingInvestments =
    getPendingInvestments;

window.processInvestment =
    processInvestment;

window.checkInvestments =
    checkInvestments;

window.withdrawInvestment =
    withdrawInvestment;

window.makeInvestmentWithdrawable =
    makeInvestmentWithdrawable;


// ============================================================
// BACKGROUND INVESTMENT CHECK
// ============================================================

setInterval(() => {

    if (
        getFirebaseUser()
    ) {
        checkInvestments()
            .catch((error) => {
                console.error(
                    "Background investment check failed:",
                    error
                );
            });
    }

}, 60 * 1000);
