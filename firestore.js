
// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDvWCjAlPOMR3pk4A9903dgtqoaBN6pRqk",
  authDomain: "duofit-proto.firebaseapp.com",
  projectId: "duofit-proto",
  storageBucket: "duofit-proto.appspot.com",
  messagingSenderId: "245161844938",
  appId: "1:245161844938:web:733a591c448aaebf8ed433"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Collection References ---
const membersCol = collection(db, "members");
const exercisesCol = collection(db, "exercises");
const usersCol = collection(db, "users");

// --- Default Data ---
const defaultExercises = [
    { id: 'ex01', name: '벤치프레스', part: '가슴' },
    { id: 'ex02', name: '인클라인 벤치프레스', part: '가슴' },
    { id: 'ex03', name: '딥스', part: '가슴' },
    { id: 'ex04', name: '스쿼트', part: '하체' },
    { id: 'ex05', name: '레그 프레스', part: '하체' },
    { id: 'ex06', name: '레그 익스텐션', part: '하체' },
    { id: 'ex07', name: '데드리프트', part: '등' },
    { id: 'ex08', name: '랫풀다운', part: '등' },
    { id: 'ex09', name: '바벨 로우', part: '등' },
    { id: 'ex10', name: '오버헤드 프레스', part: '어깨' },
    { id: 'ex11', name: '사이드 레터럴 레이즈', part: '어깨' },
    { id: 'ex12', name: '바벨 컬', part: '팔' },
    { id: 'ex13', name: '트라이셉스 푸시다운', part: '팔' },
    { id: 'ex14', name: '크런치', part: '복근' },
];

// --- Initialization Functions ---
async function initializeData() {
    const exercisesSnapshot = await getDocs(exercisesCol);
    if (exercisesSnapshot.empty) {
        for (const exercise of defaultExercises) {
            await addDoc(exercisesCol, exercise);
        }
    }

    const membersSnapshot = await getDocs(membersCol);
    if (membersSnapshot.empty) {
        await addDoc(membersCol, {
            username: 'admin',
            password: 'admin',
            name: '관리자',
            dob: '', phone: '', gender: '', age: 0,
            isAdmin: true,
            workouts: []
        });
    }
}

// --- Core Data Functions (Members) ---
async function getMembers() {
    const snapshot = await getDocs(membersCol);
    const members = [];
    snapshot.forEach(doc => {
        members.push({ id: doc.id, ...doc.data() });
    });
    return members;
}

async function getMember(id) {
    const docRef = doc(db, "members", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const member = { id: docSnap.id, ...docSnap.data() };
        if (member.workouts) {
            member.workouts = await getHydratedWorkouts(member.workouts);
        }
        return member;
    } else {
        return null;
    }
}

// --- Core Data Functions (Exercises) ---
async function getExercises() {
    const snapshot = await getDocs(exercisesCol);
    const exercises = [];
    snapshot.forEach(doc => {
        exercises.push({ id: doc.id, ...doc.data() });
    });
    return exercises;
}

async function getExerciseParts() {
    const exercises = await getExercises();
    const parts = exercises.map(ex => ex.part);
    return [...new Set(parts)]; // Return unique parts
}

async function addExercise(exerciseData) {
    await addDoc(exercisesCol, {
        name: exerciseData.name,
        part: exerciseData.part
    });
    return { success: true };
}

async function deleteExercise(exerciseId) {
    await deleteDoc(doc(db, "exercises", exerciseId));
    // Also remove this exercise from any member's workout logs
    const members = await getMembers();
    for (const member of members) {
        if (member.workouts) {
            const updatedWorkouts = member.workouts.filter(w => w.exerciseId !== exerciseId);
            if (updatedWorkouts.length !== member.workouts.length) {
                const memberRef = doc(db, "members", member.id);
                await setDoc(memberRef, { workouts: updatedWorkouts }, { merge: true });
            }
        }
    }
}

// --- Session Management ---
async function login(username, password, isAdminLogin = false) {
    const q = query(membersCol, where("username", "==", username));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return { success: false, message: '아이디가 존재하지 않습니다.' };
    }

    const member = { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };

    if (member.password !== password) {
        return { success: false, message: '비밀번호가 틀렸습니다.' };
    }
    if (isAdminLogin && !member.isAdmin) {
        return { success: false, message: '관리자 계정이 아닙니다.' };
    }
    if (!isAdminLogin && member.isAdmin) {
        return { success: false, message: '관리자 계정은 관리자 모드에서 로그인해주세요.' };
    }

    sessionStorage.setItem('loggedInUserId', member.id);
    return { success: true, user: member };
}

function logout() {
    sessionStorage.removeItem('loggedInUserId');
}

async function getCurrentUser() {
    const userId = sessionStorage.getItem('loggedInUserId');
    if (!userId) return null;
    return await getMember(userId);
}

// --- User Actions ---
async function checkUsernameExists(username) {
    const q = query(membersCol, where("username", "==", username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}

async function registerMember(memberData) {
    if (await checkUsernameExists(memberData.username)) {
        return { success: false, message: '이미 사용 중인 아이디입니다.' };
    }
    const newMember = {
        ...memberData,
        isAdmin: false,
        workouts: []
    };
    const docRef = await addDoc(membersCol, newMember);
    return { success: true, user: { id: docRef.id, ...newMember } };
}

async function updateMember(memberData) {
    const memberRef = doc(db, "members", memberData.id);
    const updateData = {
        name: memberData.name,
        dob: memberData.dob,
        phone: memberData.phone,
        gender: memberData.gender,
        age: memberData.age
    };
    if (memberData.password && memberData.password.length > 0) {
        updateData.password = memberData.password;
    }
    await setDoc(memberRef, updateData, { merge: true });
    return { success: true };
}

// --- Workout Actions ---
async function getHydratedWorkouts(workouts) {
    const exercises = await getExercises();
    return workouts.map(workout => {
        const exerciseDetails = exercises.find(ex => ex.id === workout.exerciseId);
        return {
            ...workout,
            name: exerciseDetails ? exerciseDetails.name : '삭제된 운동',
            part: exerciseDetails ? exerciseDetails.part : 'N/A'
        };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

async function addWorkout(memberId, workoutData) {
    const memberRef = doc(db, "members", memberId);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
        const member = memberSnap.data();
        const newWorkout = {
            id: 'w' + Date.now(),
            date: workoutData.date,
            exerciseId: workoutData.exerciseId,
            weight: workoutData.weight,
            reps: workoutData.reps,
            sets: workoutData.sets
        };
        const updatedWorkouts = [...(member.workouts || []), newWorkout];
        await setDoc(memberRef, { workouts: updatedWorkouts }, { merge: true });
    }
}

async function deleteWorkout(memberId, workoutId) {
    const memberRef = doc(db, "members", memberId);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
        const member = memberSnap.data();
        if (member.workouts) {
            const updatedWorkouts = member.workouts.filter(w => w.id !== workoutId);
            await setDoc(memberRef, { workouts: updatedWorkouts }, { merge: true });
        }
    }
}

// --- User Management for manage.html ---
async function loadUsers() {
    const snapshot = await getDocs(usersCol);
    const users = [];
    snapshot.forEach(doc => {
        users.push({ id: doc.id, ...doc.data() });
    });
    return users;
}

async function saveUser(user) {
    if (user.id) {
        const userRef = doc(db, "users", user.id);
        await setDoc(userRef, user, { merge: true });
    } else {
        await addDoc(usersCol, user);
    }
}

async function removeUser(userId) {
    const userRef = doc(db, "users", userId);
    await deleteDoc(userRef);
}

// --- Helper Functions ---
function calculateAge(dob) {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Initialize data on first load
initializeData();

export {
    getMembers,
    getMember,
    getExercises,
    getExerciseParts,
    addExercise,
    deleteExercise,
    login,
    logout,
    getCurrentUser,
    checkUsernameExists,
    registerMember,
    updateMember,
    addWorkout,
    deleteWorkout,
    calculateAge,
    loadUsers,
    saveUser,
    removeUser
};
