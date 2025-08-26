// Import functions from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, addDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvWCjAlPOMR3pk4A9903dgtqoaBN6pRqk",
  authDomain: "duofit-proto.firebaseapp.com",
  projectId: "duofit-proto",
  storageBucket: "duofit-proto.firebasestorage.app",
  messagingSenderId: "245161844938",
  appId: "1:245161844938:web:733a591c448aaebf8ed433",
  measurementId: "G-EBQZJGB9LV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const usersCollection = collection(db, "users");

/**
 * Loads all users from Firestore.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects, including their IDs.
 */
async function loadUsers() {
    const querySnapshot = await getDocs(usersCollection);
    const users = [];
    querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
    });
    return users;
}

/**
 * Saves a user to Firestore. Creates a new user or updates an existing one.
 * @param {object} user - The user object to save. 
 *                        If it includes an 'id', the corresponding document will be updated.
 *                        Otherwise, a new document is created.
 * @returns {Promise<void>}
 */
async function saveUser(user) {
    const userData = {
        name: user.name,
        age: user.age,
        height: user.height,
        weight: user.weight
    };

    if (user.id) {
        // If user has an ID, update the existing document
        const userDocRef = doc(db, "users", user.id);
        await setDoc(userDocRef, userData);
    } else {
        // If user has no ID, create a new document
        await addDoc(usersCollection, userData);
    }
}

/**
 * Removes a user from Firestore by their document ID.
 * @param {string} userId - The ID of the user document to remove.
 * @returns {Promise<void>}
 */
async function removeUser(userId) {
    if (!userId) {
        console.error("User ID is required to remove a user.");
        return;
    }
    const userDocRef = doc(db, "users", userId);
    await deleteDoc(userDocRef);
}

// Export the functions to be used in other scripts
export { loadUsers, saveUser, removeUser };