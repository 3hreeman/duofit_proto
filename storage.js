function getUsers() {
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
}

function saveUser(userData) {
  const users = getUsers();
  users.push(userData);
  localStorage.setItem('users', JSON.stringify(users, null, 2));
}

function updateUser(updatedUserData) {
  let users = getUsers();
  users = users.map(user => (user.id === updatedUserData.id ? updatedUserData : user));
  localStorage.setItem('users', JSON.stringify(users, null, 2));
}

function deleteUser(userId) {
  let users = getUsers();
  users = users.filter(user => user.id !== userId);
  localStorage.setItem('users', JSON.stringify(users, null, 2));
}

function getNextId() {
  const lastId = localStorage.getItem('lastId');
  const nextId = lastId ? parseInt(lastId) + 1 : 1;
  localStorage.setItem('lastId', nextId);
  return nextId;
}
