// --- Constants ---
const MEMBERS_KEY = 'members';
const EXERCISES_KEY = 'exercises';

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
function initializeMemberData() {
    localStorage.removeItem(MEMBERS_KEY);
    const members = [];
    members.push({
        id: 'm' + Date.now(),
        username: 'admin',
        password: 'admin',
        name: '관리자',
        dob: '', phone: '', gender: '', age: 0,
        isAdmin: true,
        workouts: []
    });
    saveMembers(members);
}

function initializeExerciseData() {
    saveExercises(defaultExercises);
}

function checkAndInitializeData() {
    if (!localStorage.getItem(MEMBERS_KEY)) {
        initializeMemberData();
    }
    if (!localStorage.getItem(EXERCISES_KEY)) {
        initializeExerciseData();
    }
}

// --- Core Data Functions (Members) ---
function getMembers() {
    const members = localStorage.getItem(MEMBERS_KEY);
    return members ? JSON.parse(members) : [];
}

function saveMembers(members) {
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
}

function getMember(id) {
    const members = getMembers();
    const member = members.find(member => member.id === id);
    if (member && member.workouts) {
        member.workouts = getHydratedWorkouts(member.workouts);
    }
    return member;
}

// --- Core Data Functions (Exercises) ---
function getExercises() {
    const exercises = localStorage.getItem(EXERCISES_KEY);
    return exercises ? JSON.parse(exercises) : [];
}

function saveExercises(exercises) {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises));
}

function getExerciseParts() {
    const exercises = getExercises();
    const parts = exercises.map(ex => ex.part);
    return [...new Set(parts)]; // Return unique parts
}

function addExercise(exerciseData) {
    const exercises = getExercises();
    const newExercise = {
        id: 'ex' + Date.now(),
        name: exerciseData.name,
        part: exerciseData.part
    };
    exercises.push(newExercise);
    saveExercises(exercises);
    return { success: true };
}

function deleteExercise(exerciseId) {
    let exercises = getExercises();
    exercises = exercises.filter(ex => ex.id !== exerciseId);
    saveExercises(exercises);
    // Also remove this exercise from any member's workout logs
    const members = getMembers();
    members.forEach(member => {
        if (member.workouts) {
            member.workouts = member.workouts.filter(w => w.exerciseId !== exerciseId);
        }
    });
    saveMembers(members);
}


// --- Session Management ---
function login(username, password, isAdminLogin = false) {
    const members = getMembers();
    const member = members.find(m => m.username === username);

    if (!member) return { success: false, message: '아이디가 존재하지 않습니다.' };
    if (member.password !== password) return { success: false, message: '비밀번호가 틀렸습니다.' };
    if (isAdminLogin && !member.isAdmin) return { success: false, message: '관리자 계정이 아닙니다.' };
    if (!isAdminLogin && member.isAdmin) return { success: false, message: '관리자 계정은 관리자 모드에서 로그인해주세요.' };

    sessionStorage.setItem('loggedInUserId', member.id);
    return { success: true, user: member };
}

function logout() {
    sessionStorage.removeItem('loggedInUserId');
}

function getCurrentUser() {
    const userId = sessionStorage.getItem('loggedInUserId');
    if (!userId) return null;
    return getMember(userId);
}

// --- User Actions ---
function checkUsernameExists(username) {
    const members = getMembers();
    return members.some(m => m.username === username);
}

function registerMember(memberData) {
    if (checkUsernameExists(memberData.username)) {
        return { success: false, message: '이미 사용 중인 아이디입니다.' };
    }
    const members = getMembers();
    const newMember = {
        id: 'm' + Date.now(),
        ...memberData,
        isAdmin: false,
        workouts: []
    };
    members.push(newMember);
    saveMembers(members);
    return { success: true, user: newMember };
}

function updateMember(memberData) {
    const members = getMembers();
    const index = members.findIndex(m => m.id === memberData.id);
    if (index !== -1) {
        const newPassword = memberData.password;
        if (newPassword && newPassword.length > 0) {
            members[index].password = newPassword;
        }
        members[index].name = memberData.name;
        members[index].dob = memberData.dob;
        members[index].phone = memberData.phone;
        members[index].gender = memberData.gender;
        members[index].age = memberData.age;
        saveMembers(members);
        return { success: true };
    }
    return { success: false, message: '회원을 찾을 수 없습니다.' };
}

// --- Workout Actions ---
function getHydratedWorkouts(workouts) {
    const exercises = getExercises();
    return workouts.map(workout => {
        const exerciseDetails = exercises.find(ex => ex.id === workout.exerciseId);
        return {
            ...workout,
            name: exerciseDetails ? exerciseDetails.name : '삭제된 운동',
            part: exerciseDetails ? exerciseDetails.part : 'N/A'
        };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

function addWorkout(memberId, workoutData) {
    const members = getMembers();
    const member = members.find(m => m.id === memberId);
    if (member) {
        if (!member.workouts) member.workouts = [];
        const newWorkout = {
            id: 'w' + Date.now(),
            date: workoutData.date,
            exerciseId: workoutData.exerciseId,
            weight: workoutData.weight,
            reps: workoutData.reps,
            sets: workoutData.sets
        };
        member.workouts.push(newWorkout);
        saveMembers(members);
    }
}

function deleteWorkout(memberId, workoutId) {
    const members = getMembers();
    const member = members.find(m => m.id === memberId);
    if (member && member.workouts) {
        member.workouts = member.workouts.filter(w => w.id !== workoutId);
        saveMembers(members);
    }
}

// Initialize data on first load
checkAndInitializeData();
