
// assets/js/app.js

// ============================================================
// FIREBASE
// ============================================================

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
    orderBy,
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
// FIREBASE AUTH STATE
// ============================================================

onAuthStateChanged(auth, async (user) => {

    currentUser = user;

    if (!user) {

        currentUserProfile = null;

        if (!authReady) {
            authReady = true;
            authResolve(null);
        }

        return;
    }


    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const snapshot = await getDoc(userRef);


        if (snapshot.exists()) {

            currentUserProfile = {
                id: user.uid,
                uid: user.uid,
                ...snapshot.data()
            };

        } else {

            currentUserProfile = {
                id: user.uid,
                uid: user.uid,
                email: user.email
            };
        }


    } catch (error) {

        console.error(
            "Error loading user profile:",
            error
        );

        currentUserProfile = {
            id: user.uid,
            uid: user.uid,
            email: user.email
        };
    }


    if (!authReady) {

        authReady = true;

        authResolve(currentUserProfile);
    }

});


// ============================================================
// AUTHENTICATION
// ============================================================

function getFirebaseUser() {

    return auth.currentUser;

}


async function waitForAuth() {

    return await authReadyPromise;

}


// ============================================================
// CURRENT USER
// ============================================================

function getCurrentUser() {

    return currentUserProfile;

}


// ============================================================
// SET CURRENT USER
// ============================================================

function setCurrentUser(user) {

    currentUserProfile = user;
}


// ============================================================
// REFRESH CURRENT USER
// ============================================================

async function refreshCurrentUser() {

    const user = auth.currentUser;


    if (!user) {

        currentUserProfile = null;

        return null;
    }


    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const snapshot = await getDoc(userRef);


        if (!snapshot.exists()) {

            currentUserProfile = null;

            return null;
        }


        currentUserProfile = {

            id: user.uid,

            uid: user.uid,

            ...snapshot.data()
        };


        return currentUserProfile;


    } catch (error) {

        console.error(
            "Error refreshing user profile:",
            error
        );

        return currentUserProfile;
    }
}


// ============================================================
// REQUIRE AUTH
// ============================================================

async function requireAuth() {

    const user = await waitForAuth();


    if (!user) {

        window.location.href = "login.html";

        return null;
    }


    return user;
}


// ============================================================
// LOGOUT
// ============================================================

async function logout() {

    try {

        await signOut(auth);

        currentUser = null;

        currentUserProfile = null;

        window.location.href = "login.html";


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
// MONEY FORMAT
// ============================================================

function money(amount) {

    const value = Number(amount) || 0;


    return "$" + value.toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );
}


// ============================================================
// NUMBER FORMAT
// ============================================================

function numberFormat(value) {

    return Number(value || 0).toLocaleString(
        "en-US"
    );
}


// ============================================================
// TOAST
// ============================================================

function showToast(message) {

    let toast =
        document.getElementById(
            "cryptacksToast"
        );


    if (!toast) {

        toast = document.createElement("div");

        toast.id = "cryptacksToast";

        toast.style.position = "fixed";
        toast.style.bottom = "25px";
        toast.style.right = "25px";
        toast.style.zIndex = "99999";

        toast.style.maxWidth = "350px";

        toast.style.padding =
            "14px 18px";

        toast.style.borderRadius =
            "12px";

        toast.style.background =
            "#18181b";

        toast.style.color =
            "#ffffff";

        toast.style.border =
            "1px solid rgba(255,255,255,0.1)";

        toast.style.boxShadow =
            "0 10px 30px rgba(0,0,0,0.3)";

        toast.style.fontSize =
            "14px";

        toast.style.transition =
            "opacity 0.3s ease";

        document.body.appendChild(toast);
    }


    toast.textContent = message;

    toast.style.opacity = "1";


    clearTimeout(toast._timeout);


    toast._timeout = setTimeout(() => {

        toast.style.opacity = "0";

    }, 3500);
}


// ============================================================
// DATE FORMAT
// ============================================================

function convertDate(value) {

    if (!value) {
        return null;
    }


    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {

        return value.toDate();
    }


    const date = new Date(value);


    if (isNaN(date.getTime())) {

        return null;
    }


    return date;
}


function formatDate(date) {

    const parsed = convertDate(date);


    if (!parsed) {

        return "—";
    }


    return parsed.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


// ============================================================
// DATE + TIME FORMAT
// ============================================================

function formatDateTime(date) {

    const parsed = convertDate(date);


    if (!parsed) {

        return "—";
    }


    return parsed.toLocaleString(
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
// GET INVESTMENTS
// ============================================================

async function getInvestments() {

    const user = auth.currentUser;


    if (!user) {

        return [];
    }


    try {

        const investmentsRef =
            collection(
                db,
                "investments"
            );


        const q = query(
            investmentsRef,

            where(
                "userId",
                "==",
                user.uid
            ),

            orderBy(
                "createdAt",
                "desc"
            )
        );


        const snapshot =
            await getDocs(q);


        return snapshot.docs.map(
            (item) => ({

                id: item.id,

                ...item.data()

            })
        );


    } catch (error) {

        console.error(
            "Error loading investments:",
            error
        );

        /*
         * Firestore can require a composite index
         * for where + orderBy queries.
         *
         * If the query fails because of an index,
         * the Firebase console error will provide
         * a link to create the required index.
         */

        return [];
    }
}


// ============================================================
// ADD INVESTMENT
// ============================================================

async function addInvestment(investment) {

    const user = auth.currentUser;


    if (!user) {

        showToast(
            "Please login first."
        );

        return null;
    }


    try {

        const data = {

            ...investment,

            userId: user.uid,

            createdAt:
                investment.createdAt ||
                serverTimestamp()
        };


        const reference =
            await addDoc(
                collection(
                    db,
                    "investments"
                ),
                data
            );


        return {

            id: reference.id,

            ...data
        };


    } catch (error) {

        console.error(
            "Error creating investment:",
            error
        );

        showToast(
            "Unable to create investment."
        );

        return null;
    }
}


// ============================================================
// GET SINGLE INVESTMENT
// ============================================================

async function getInvestment(
    investmentId
) {

    const user = auth.currentUser;


    if (!user || !investmentId) {

        return null;
    }


    try {

        const reference =
            doc(
                db,
                "investments",
                investmentId
            );


        const snapshot =
            await getDoc(reference);


        if (!snapshot.exists()) {

            return null;
        }


        const investment = {

            id: snapshot.id,

            ...snapshot.data()
        };


        if (
            investment.userId !==
            user.uid
        ) {

            return null;
        }


        return investment;


    } catch (error) {

        console.error(
            "Error loading investment:",
            error
        );

        return null;
    }
}


// ============================================================
// UPDATE INVESTMENT
// ============================================================

async function updateInvestment(
    investmentId,
    data
) {

    const user = auth.currentUser;


    if (!user || !investmentId) {

        return false;
    }


    try {

        const investment =
            await getInvestment(
                investmentId
            );


        if (!investment) {

            return false;
        }


        await updateDoc(
            doc(
                db,
                "investments",
                investmentId
            ),
            data
        );


        return true;


    } catch (error) {

        console.error(
            "Error updating investment:",
            error
        );

        return false;
    }
}


// ============================================================
// GET TRANSACTIONS
// ============================================================

async function getTransactions() {

    const user = auth.currentUser;


    if (!user) {

        return [];
    }


    try {

        const transactionsRef =
            collection(
                db,
                "transactions"
            );


        const q = query(
            transactionsRef,

            where(
                "userId",
                "==",
                user.uid
            ),

            orderBy(
                "createdAt",
                "desc"
            )
        );


        const snapshot =
            await getDocs(q);


        return snapshot.docs.map(
            (item) => ({

                id: item.id,

                ...item.data()

            })
        );


    } catch (error) {

        console.error(
            "Error loading transactions:",
            error
        );

        return [];
    }
}


// ============================================================
// ADD TRANSACTION
// ============================================================

async function addTransaction(
    transaction
) {

    const user = auth.currentUser;


    if (!user) {

        showToast(
            "Please login first."
        );

        return null;
    }


    try {

        const data = {

            ...transaction,

            userId: user.uid,

            createdAt:
                transaction.createdAt ||
                serverTimestamp()
        };


        const reference =
            await addDoc(
                collection(
                    db,
                    "transactions"
                ),
                data
            );


        return {

            id: reference.id,

            ...data
        };


    } catch (error) {

        console.error(
            "Error creating transaction:",
            error
        );

        showToast(
            "Unable to save transaction."
        );

        return null;
    }
}


// ============================================================
// UPDATE TRANSACTION
// ============================================================

async function updateTransaction(
    transactionId,
    data
) {

    const user = auth.currentUser;


    if (!user || !transactionId) {

        return false;
    }


    try {

        const reference =
            doc(
                db,
                "transactions",
                transactionId
            );


        const snapshot =
            await getDoc(reference);


        if (!snapshot.exists()) {

            return false;
        }


        if (
            snapshot.data().userId !==
            user.uid
        ) {

            return false;
        }


        await updateDoc(
            reference,
            data
        );


        return true;


    } catch (error) {

        console.error(
            "Error updating transaction:",
            error
        );

        return false;
    }
}


// ============================================================
// UPDATE USER PROFILE
// ============================================================

async function updateUserProfile(
    data
) {

    const user = auth.currentUser;


    if (!user) {

        return false;
    }


    try {

        await updateDoc(
            doc(
                db,
                "users",
                user.uid
            ),
            data
        );


        await refreshCurrentUser();


        return true;


    } catch (error) {

        console.error(
            "Error updating profile:",
            error
        );

        return false;
    }
}


// ============================================================
// PROCESS INVESTMENT
// ============================================================

async function processInvestment(
    investment
) {

    if (!investment) {

        return investment;
    }


    const now = Date.now();


    const completionDate =
        convertDate(
            investment.completesAt
        );


    if (!completionDate) {

        return investment;
    }


    const completesAt =
        completionDate.getTime();


    // ========================================================
    // PENDING → SUCCESSFUL
    // ========================================================

    if (
        investment.status === "Pending" &&
        now >= completesAt
    ) {

        const completedAt =
            new Date();


        const withdrawableAt =
            new Date(
                completedAt.getTime() +
                (24 * 60 * 60 * 1000)
            );


        const generatedAmount =
            Number(
                investment.generatedAmount
            ) || 0;


        const amount =
            Number(
                investment.amount
            ) || 0;


        const profit =
            Number(
                investment.profit
            ) ||
            (
                generatedAmount -
                amount
            );


        const updated = {

            status: "Successful",

            completedAt:
                completedAt.toISOString(),

            withdrawableAt:
                withdrawableAt.toISOString(),

            withdrawalStatus:
                "Locked",

            withdrawable:
                false
        };


        const success =
            await updateInvestment(
                investment.id,
                updated
            );


        if (success) {

            await updateUserProfile({

                invested: amount,

                returns: profit,

                balance:
                    generatedAmount
            });


            await addTransaction({

                type: "Investment",

                plan:
                    investment.plan || "",

                amount: amount,

                generatedAmount:
                    generatedAmount,

                profit: profit,

                status: "Successful",

                investmentId:
                    investment.id,

                description:
                    "Investment completed"
            });


            return {

                ...investment,

                ...updated
            };
        }
    }


    // ========================================================
    // SUCCESSFUL → WITHDRAWABLE
    // ========================================================

    const unlockDate =
        convertDate(
            investment.withdrawableAt
        );


    if (
        investment.status === "Successful" &&
        unlockDate &&
        now >= unlockDate.getTime()
    ) {

        const updated = {

            withdrawalStatus:
                "Available",

            withdrawable:
                true,

            status:
                "Withdrawable"
        };


        const success =
            await updateInvestment(
                investment.id,
                updated
            );


        if (success) {

            return {

                ...investment,

                ...updated
            };
        }
    }


    return investment;
}


// ============================================================
// PROCESS ALL INVESTMENTS
// ============================================================

async function checkInvestments() {

    const investments =
        await getInvestments();


    if (!investments.length) {

        return [];
    }


    const processed = [];


    for (
        const investment of investments
    ) {

        const result =
            await processInvestment(
                investment
            );


        processed.push(result);
    }


    return processed;
}


// ============================================================
// LEGACY COMPATIBILITY
// ============================================================

async function checkPendingInvestments() {

    return await checkInvestments();

}


async function checkWithdrawableInvestments() {

    return await checkInvestments();

}


// ============================================================
// WITHDRAW INVESTMENT
// ============================================================

async function withdrawInvestment(
    investmentId
) {

    const user = auth.currentUser;


    if (!user) {

        showToast(
            "Please login first."
        );

        return false;
    }


    const investment =
        await getInvestment(
            investmentId
        );


    if (!investment) {

        showToast(
            "Investment not found."
        );

        return false;
    }


    const withdrawableDate =
        convertDate(
            investment.withdrawableAt
        );


    if (
        !withdrawableDate ||
        Date.now() <
        withdrawableDate.getTime()
    ) {

        showToast(
            "This investment is still locked."
        );

        return false;
    }


    if (
        investment.withdrawable !== true &&
        investment.status !== "Withdrawable"
    ) {

        showToast(
            "This investment is not available."
        );

        return false;
    }


    const amount =
        Number(
            investment.generatedAmount
        ) || 0;


    try {

        // Mark the investment as withdrawn
        await updateInvestment(
            investment.id,
            {

                withdrawalStatus:
                    "Withdrawn",

                withdrawable:
                    false,

                status:
                    "Withdrawn",

                withdrawnAt:
                    new Date().toISOString()
            }
        );


        // Record transaction
        await addTransaction({

            type: "Withdrawal",

            plan:
                investment.plan || "",

            amount: amount,

            investmentId:
                investment.id,

            status: "Successful",

            description:
                "Investment withdrawal completed"
        });


        // Reset the displayed account values
        await updateUserProfile({

            balance: 0,

            invested: 0,

            returns: 0
        });


        showToast(
            "Withdrawal completed."
        );


        return true;


    } catch (error) {

        console.error(
            "Withdrawal error:",
            error
        );

        showToast(
            "Unable to complete withdrawal."
        );

        return false;
    }
}


// ============================================================
// MAKE FUNCTIONS AVAILABLE TO EXISTING JS FILES
// ============================================================
//
// Because app.js is now a JavaScript module, normal functions
// are not automatically global.
//
// These window assignments allow existing files such as:
//
// dashboard.js
// transactions.js
// history.js
// investments.js
//
// to continue using the old function names.
//

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

window.logout =
    logout;

window.refreshCurrentUser =
    refreshCurrentUser;

window.money =
    money;

window.numberFormat =
    numberFormat;

window.showToast =
    showToast;

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

window.updateUserProfile =
    updateUserProfile;

window.processInvestment =
    processInvestment;

window.checkInvestments =
    checkInvestments;

window.checkPendingInvestments =
    checkPendingInvestments;

window.checkWithdrawableInvestments =
    checkWithdrawableInvestments;

window.withdrawInvestment =
    withdrawInvestment;


// ============================================================
// AUTO PROCESS INVESTMENTS
// ============================================================

async function autoProcessInvestments() {

    if (!auth.currentUser) {

        return;
    }


    try {

        await checkInvestments();

    } catch (error) {

        console.error(
            "Investment processing error:",
            error
        );
    }
}


// Wait until Firebase authentication is ready
waitForAuth().then(() => {

    if (auth.currentUser) {

        autoProcessInvestments();

    }

});


// Check periodically
setInterval(
    autoProcessInvestments,
    60 * 1000
);
