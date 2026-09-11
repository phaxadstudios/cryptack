
// ============================================================
// CRYPTACKS - FIREBASE APP
// ============================================================

import {
    auth,
    db
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// ============================================================
// GLOBAL AUTH STATE
// ============================================================

let currentUser = null;
let currentUserProfile = null;

let authReady = false;
let authResolve;

const authReadyPromise =
    new Promise(resolve => {
        authResolve = resolve;
    });


// ============================================================
// AUTH STATE LISTENER
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        currentUser = user || null;

        if (user) {

            try {

                const profileRef =
                    doc(
                        db,
                        "users",
                        user.uid
                    );

                const profileSnap =
                    await getDoc(
                        profileRef
                    );

                if (profileSnap.exists()) {

                    currentUserProfile = {
                        id: user.uid,
                        ...profileSnap.data()
                    };

                } else {

                    currentUserProfile = {
                        id: user.uid,
                        uid: user.uid,
                        email: user.email || "",
                        name:
                            user.displayName ||
                            "User"
                    };

                }

            } catch (error) {

                console.error(
                    "Profile loading error:",
                    error
                );

                currentUserProfile = {
                    id: user.uid,
                    uid: user.uid,
                    email: user.email || "",
                    name:
                        user.displayName ||
                        "User"
                };
            }

        } else {

            currentUserProfile = null;
        }


        if (!authReady) {

            authReady = true;

            authResolve(
                currentUser
            );
        }
    }
);


// ============================================================
// AUTH HELPERS
// ============================================================

function getFirebaseUser() {

    return currentUser;
}


async function waitForAuth() {

    if (authReady) {
        return currentUser;
    }

    return await authReadyPromise;
}


function getCurrentUser() {

    return currentUserProfile;
}


function setCurrentUser(profile) {

    currentUserProfile =
        profile || null;
}


async function refreshCurrentUser() {

    const user =
        await waitForAuth();

    if (!user) {
        return null;
    }

    try {

        const profileRef =
            doc(
                db,
                "users",
                user.uid
            );

        const profileSnap =
            await getDoc(
                profileRef
            );

        if (profileSnap.exists()) {

            currentUserProfile = {
                id: user.uid,
                ...profileSnap.data()
            };

        }

    } catch (error) {

        console.error(
            "Refresh profile error:",
            error
        );
    }

    return currentUserProfile;
}


async function requireAuth() {

    const user =
        await waitForAuth();

    if (!user) {

        window.location.href =
            "login.html";

        return null;
    }

    return user;
}


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
    }
}


// ============================================================
// FORMATTERS
// ============================================================

function money(value) {

    const amount =
        Number(value) || 0;

    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(amount);
}


function numberFormat(value) {

    return new Intl.NumberFormat(
        "en-US"
    ).format(
        Number(value) || 0
    );
}


function convertDate(value) {

    if (!value) {
        return new Date(0);
    }


    // Firestore Timestamp

    if (
        value &&
        typeof value.toDate ===
            "function"
    ) {

        return value.toDate();
    }


    // Firestore timestamp object

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

        return new Date(0);
    }

    return date;
}


function formatDate(value) {

    const date =
        convertDate(value);

    if (
        date.getTime() === 0
    ) {

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

    if (
        date.getTime() === 0
    ) {

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
// TOAST
// ============================================================

function showToast(message) {

    let toast =
        document.getElementById(
            "cryptacksToast"
        );


    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "cryptacksToast";

        toast.className =
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] " +
            "px-5 py-3 rounded-xl bg-gray-900 " +
            "border border-white/10 shadow-2xl " +
            "text-sm text-white transition-all";

        document.body.appendChild(
            toast
        );
    }


    toast.textContent =
        message;

    toast.classList.remove(
        "opacity-0"
    );

    toast.classList.add(
        "opacity-100"
    );


    clearTimeout(
        toast._timeout
    );


    toast._timeout =
        setTimeout(
            () => {

                toast.classList.remove(
                    "opacity-100"
                );

                toast.classList.add(
                    "opacity-0"
                );

            },
            3500
        );
}


// ============================================================
// INVESTMENTS - GET
// ============================================================

async function getInvestments() {

    const user =
        await requireAuth();

    if (!user) {
        return [];
    }


    try {

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


        const investments =
            snapshot.docs.map(
                docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                })
            );


        // Sort locally.
        // This avoids a Firestore
        // composite index requirement.

        investments.sort(
            (a, b) => {

                return (
                    convertDate(
                        b.createdAt
                    ).getTime() -
                    convertDate(
                        a.createdAt
                    ).getTime()
                );
            }
        );


        console.log(
            "Investments loaded:",
            investments
        );


        return investments;

    } catch (error) {

        console.error(
            "GET INVESTMENTS ERROR:",
            error
        );

        throw error;
    }
}


// ============================================================
// INVESTMENTS - ADD
// ============================================================

async function addInvestment(
    investment
) {

    const user =
        await requireAuth();

    if (!user) {

        throw new Error(
            "User is not authenticated."
        );
    }


    try {

        const data = {

            ...investment,

            userId:
                user.uid,

            createdAt:
                investment.createdAt ||
                serverTimestamp()
        };


        console.log(
            "Creating investment:",
            data
        );


        const docRef =
            await addDoc(
                collection(
                    db,
                    "investments"
                ),
                data
            );


        console.log(
            "Investment created:",
            docRef.id
        );


        return docRef.id;

    } catch (error) {

        console.error(
            "ADD INVESTMENT ERROR:",
            error
        );

        throw error;
    }
}


// ============================================================
// INVESTMENT - GET ONE
// ============================================================

async function getInvestment(
    investmentId
) {

    const user =
        await requireAuth();

    if (!user) {
        return null;
    }


    try {

        const investmentRef =
            doc(
                db,
                "investments",
                investmentId
            );


        const snapshot =
            await getDoc(
                investmentRef
            );


        if (!snapshot.exists()) {
            return null;
        }


        const data =
            snapshot.data();


        if (
            data.userId !==
            user.uid
        ) {

            throw new Error(
                "You do not own this investment."
            );
        }


        return {
            id: snapshot.id,
            ...data
        };

    } catch (error) {

        console.error(
            "GET INVESTMENT ERROR:",
            error
        );

        throw error;
    }
}


// ============================================================
// INVESTMENT - UPDATE
// ============================================================

async function updateInvestment(
    investmentId,
    data
) {

    const user =
        await requireAuth();

    if (!user) {

        throw new Error(
            "User is not authenticated."
        );
    }


    try {

        const investmentRef =
            doc(
                db,
                "investments",
                investmentId
            );


        const snapshot =
            await getDoc(
                investmentRef
            );


        if (!snapshot.exists()) {

            throw new Error(
                "Investment does not exist."
            );
        }


        const investment =
            snapshot.data();


        if (
            investment.userId !==
            user.uid
        ) {

            throw new Error(
                "You do not own this investment."
            );
        }


        await updateDoc(
            investmentRef,
            data
        );


        return true;

    } catch (error) {

        console.error(
            "UPDATE INVESTMENT ERROR:",
            error
        );

        throw error;
    }
}


// ============================================================
// TRANSACTIONS - GET
// ============================================================

async function getTransactions() {

    const user =
        await requireAuth();

    if (!user) {
        return [];
    }


    try {

        // IMPORTANT:
        // Do NOT use orderBy here.
        //
        // The old query used:
        // where(userId) + orderBy(createdAt)
        //
        // which can require a Firestore
        // composite index.
        //
        // We sort locally instead.

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


        const transactions =
            snapshot.docs.map(
                docSnap => ({
                    id: docSnap.id,
                    ...docSnap.data()
                })
            );


        transactions.sort(
            (a, b) => {

                return (
                    convertDate(
                        b.createdAt
                    ).getTime() -
                    convertDate(
                        a.createdAt
                    ).getTime()
                );
            }
        );


        console.log(
            "Transactions loaded:",
            transactions
        );


        return transactions;

    } catch (error) {

        console.error(
            "GET TRANSACTIONS ERROR:",
            error
        );

        throw error;
    }
}


// ============================================================
// TRANSACTIONS - ADD
// ============================================================

async function addTransaction(
    transaction
) {

    const user =
        await requireAuth();

    if (!user) {

        throw new Error(
            "User is not authenticated."
        );
    }


    try {

        const data = {

            ...transaction,

            userId:
                user.uid,

            createdAt:
                transaction.createdAt ||
                serverTimestamp()
        };


        console.log(
            "Creating transaction:",
            data
        );


        const docRef =
            await addDoc(
                collection(
                    db,
                    "transactions"
                ),
                data
            );


        console.log(
            "Transaction created:",
            docRef.id
        );


        return docRef.id;

    } catch (error) {

        console.error(
            "ADD TRANSACTION ERROR:",
            error
        );

        throw error;
    }
}


// ============================================================
// TRANSACTION - UPDATE
// ============================================================

async function updateTransaction(
    transactionId,
    data
) {

    const user =
        await requireAuth();

    if (!user) {

        throw new Error(
            "User is not authenticated."
        );
    }


    try {

        const transactionRef =
            doc(
                db,
                "transactions",
                transactionId
            );


        const snapshot =
            await getDoc(
                transactionRef
            );


        if (!snapshot.exists()) {

            throw new Error(
                "Transaction does not exist."
            );
        }


        const transaction =
            snapshot.data();


        if (
            transaction.userId !==
            user.uid
        ) {

            throw new Error(
                "You do not own this transaction."
            );
        }


        await updateDoc(
            transactionRef,
            data
        );


        return true;

    } catch (error) {

        console.error(
            "UPDATE TRANSACTION ERROR:",
            error
        );

        throw error;
    }
}


// ============================================================
// USER PROFILE UPDATE
// ============================================================

async function updateUserProfile(
    data
) {

    const user =
        await requireAuth();

    if (!user) {

        throw new Error(
            "User is not authenticated."
        );
    }


    try {

        const userRef =
            doc(
                db,
                "users",
                user.uid
            );


        await updateDoc(
            userRef,
            data
        );


        await refreshCurrentUser();


        return true;

    } catch (error) {

        console.error(
            "UPDATE USER PROFILE ERROR:",
            error
        );

        throw error;
    }
}


// ============================================================
// PROCESS INVESTMENT
// ============================================================

async function processInvestment(
    investment
) {

    if (!investment) {
        return;
    }


    // --------------------------------------------------------
    // PENDING -> SUCCESSFUL
    // --------------------------------------------------------

    if (
        investment.status ===
            "Pending" &&
        investment.completesAt &&
        Date.now() >=
            convertDate(
                investment.completesAt
            ).getTime()
    ) {

        const completedAt =
            new Date();


        await updateInvestment(
            investment.id,
            {
                status:
                    "Successful",

                paymentStatus:
                    "Successful",

                completedAt:
                    completedAt.toISOString(),

                withdrawalStatus:
                    "Locked",

                withdrawable:
                    false
            }
        );


        // Create completion transaction

        await addTransaction({

            type:
                "Investment completed",

            plan:
                investment.plan,

            amount:
                investment.amount,

            generatedAmount:
                investment.generatedAmount,

            profit:
                investment.profit,

            status:
                "Successful",

            paymentMethod:
                investment.paymentMethod,

            paymentStatus:
                "Successful",

            withdrawalStatus:
                "Locked",

            investmentId:
                investment.id
        });


        return;
    }


    // --------------------------------------------------------
    // SUCCESSFUL -> WITHDRAWABLE
    // --------------------------------------------------------

    if (
        investment.status ===
            "Successful" &&
        investment.withdrawableAt &&
        Date.now() >=
            convertDate(
                investment.withdrawableAt
            ).getTime() &&
        investment.withdrawable !== true
    ) {

        await updateInvestment(
            investment.id,
            {
                status:
                    "Withdrawable",

                withdrawalStatus:
                    "Available",

                withdrawable:
                    true
            }
        );
    }
}


// ============================================================
// CHECK ALL INVESTMENTS
// ============================================================

async function checkInvestments() {

    const user =
        await getFirebaseUser();

    if (!user) {
        return;
    }


    try {

        const investments =
            await getInvestments();


        for (
            const investment
            of investments
        ) {

            await processInvestment(
                investment
            );
        }

    } catch (error) {

        console.error(
            "CHECK INVESTMENTS ERROR:",
            error
        );

        throw error;
    }
}


// ============================================================
// WITHDRAW INVESTMENT
// ============================================================

async function withdrawInvestment(
    investmentId
) {

    const user =
        await requireAuth();

    if (!user) {

        throw new Error(
            "User is not authenticated."
        );
    }


    try {

        const investment =
            await getInvestment(
                investmentId
            );


        if (!investment) {

            throw new Error(
                "Investment not found."
            );
        }


        if (
            investment.withdrawable !==
            true
        ) {

            throw new Error(
                "This investment is not withdrawable yet."
            );
        }


        await updateInvestment(
            investmentId,
            {
                status:
                    "Withdrawn",

                withdrawalStatus:
                    "Completed",

                withdrawable:
                    false
            }
        );


        await addTransaction({

            type:
                "Withdrawal",

            plan:
                investment.plan,

            amount:
                investment.generatedAmount,

            generatedAmount:
                investment.generatedAmount,

            profit:
                investment.profit,

            status:
                "Successful",

            paymentMethod:
                investment.paymentMethod,

            paymentStatus:
                "Successful",

            withdrawalStatus:
                "Completed",

            investmentId:
                investmentId
        });


        return true;

    } catch (error) {

        console.error(
            "WITHDRAW INVESTMENT ERROR:",
            error
        );

        throw error;
    }
}


// ============================================================
// COMPATIBILITY WRAPPERS
// ============================================================

async function checkPendingInvestments() {

    try {

        await checkInvestments();

    } catch (error) {

        console.error(
            "Pending investment check error:",
            error
        );
    }
}


async function processInvestments() {

    return await checkInvestments();
}


// ============================================================
// EXPORT TO WINDOW
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

window.convertDate =
    convertDate;

window.formatDate =
    formatDate;

window.formatDateTime =
    formatDateTime;

window.showToast =
    showToast;


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

window.processInvestments =
    processInvestments;

window.withdrawInvestment =
    withdrawInvestment;


// ============================================================
// AUTOMATIC INVESTMENT PROCESSING
// ============================================================

waitForAuth()
    .then(
        async user => {

            if (!user) {
                return;
            }

            try {

                await checkInvestments();

            } catch (error) {

                console.error(
                    "Initial investment processing error:",
                    error
                );
            }
        }
    );


// Check every minute

setInterval(
    async () => {

        try {

            if (
                getFirebaseUser()
            ) {

                await checkInvestments();
            }

        } catch (error) {

            console.error(
                "Automatic investment processing error:",
                error
            );
        }

    },
    60 * 1000
);
