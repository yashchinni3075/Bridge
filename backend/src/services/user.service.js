const users = [];
let idCounter = 1;

export function getAllUsers() {
  return users;
}

export function getUserById(id) {
  return users.find((user) => user.id === id);
}

export function getUserByEmail(email) {
  return users.find((user) => user.email === email);
}

export function createUser({ name, email }) {
  const newUser = {
    id: idCounter++,
    name,
    email,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  return newUser;
}

export function updateUser(id, updates) {
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return null;

  users[index] = { ...users[index], ...updates };
  return users[index];
}

export function deleteUser(id) {
  const index = users.findIndex((user) => user.id === id);
  if (index === -1) return false;

  users.splice(index, 1);
  return true;
}
