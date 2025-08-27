// storage.js

/**
 * New Member Data Structure
 * {
 *   id: 'm' + Date.now(),
 *   username: String (unique),
 *   password: String,
 *   name: String,
 *   dob: String (YYYY-MM-DD),
 *   phone: String,
 *   gender: String,
 *   age: Number,
 *   isAdmin: Boolean,
 *   workouts: [
 *     {
 *       id: 'w' + Date.now(),
 *       date: String (YYYY-MM-DD),
 *       name: String,
 *       part: String,
 *       weight: Number,
 *       reps: Number,
 *       sets: Number
 *     }
 *   ]
 * }
 */

// Initialize with a default admin user if it doesn't exist
function initializeAdmin() {
    const members = getMembers();
    const adminExists = members.some(m => m.isAdmin);
    if (!adminExists) {
        members.push({
            id: 'm' + Date.now(),
            username: 'admin',
            password: 'admin',
            name: '관리자',
            dob: '',
            phone: '',
            gender: '',
            age: 0,
            isAdmin: true,
            workouts: []
        });
        saveMembers(members);
    }
}

// --- Core Data Functions ---
function getMembers() {
    const members = localStorage.getItem('members');
    return members ? JSON.parse(members) : [];
}

function saveMembers(members) {
    localStorage.setItem('members', JSON.stringify(members));
}

function getMember(id) {
    const members = getMembers();
    return members.find(member => member.id === id);
}

// --- Session Management ---
function login(username, password, isAdminLogin = false) {
    const members = getMembers();
    const member = members.find(m => m.username === username);

    if (!member) {
        return { success: false, message: '아이디가 존재하지 않습니다.' };
    }

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
    const members = getMembers();
    const usernameExists = members.some(m => m.username === memberData.username);
    if (usernameExists) {
        return { success: false, message: '이미 사용 중인 아이디입니다.' };
    }

    const newMember = {
        id: 'm' + Date.now(),
        username: memberData.username,
        password: memberData.password,
        name: memberData.name,
        dob: memberData.dob,
        phone: memberData.phone,
        gender: memberData.gender,
        age: memberData.age,
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
        // Ensure password is not accidentally overwritten if not provided
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


function deleteMember(id) {
    let members = getMembers();
    members = members.filter(member => member.id !== id);
    saveMembers(members);
}

// --- Workout Actions ---
function addWorkout(memberId, workoutData) {
    const members = getMembers();
    const member = members.find(m => m.id === memberId);
    if (member) {
        if (!member.workouts) {
            member.workouts = [];
        }
        workoutData.id = 'w' + Date.now();
        member.workouts.push(workoutData);
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

// Initialize admin on load
initializeAdmin();