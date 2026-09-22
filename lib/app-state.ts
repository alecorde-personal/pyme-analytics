import { hashPassword, verifyPassword } from '@/lib/auth';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'owner' | 'admin';
  createdAt: string;
};

export type AppBusiness = {
  name: string;
  industry: string;
  address: string;
  size: string;
  createdAt: string;
};

export type AppSession = {
  user: AppUser;
  business?: AppBusiness;
};

const STORAGE_KEYS = {
  users: 'pyme-users',
  session: 'pyme-session',
  business: 'pyme-business',
};

export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;

  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getUsers(): AppUser[] {
  return readJSON<AppUser[]>(STORAGE_KEYS.users, []);
}

export function saveUsers(users: AppUser[]) {
  writeJSON(STORAGE_KEYS.users, users);
}

export function getSession(): AppSession | null {
  return readJSON<AppSession | null>(STORAGE_KEYS.session, null);
}

export function saveSession(session: AppSession | null) {
  writeJSON(STORAGE_KEYS.session, session);
}

export function getBusiness(): AppBusiness | null {
  return readJSON<AppBusiness | null>(STORAGE_KEYS.business, null);
}

export function saveBusiness(business: AppBusiness | null) {
  writeJSON(STORAGE_KEYS.business, business);
}

export function createUser({ name, email, password }: { name: string; email: string; password: string }): AppUser {
  return {
    id: `user-${Date.now()}`,
    name,
    email,
    password: hashPassword(password),
    role: 'owner',
    createdAt: new Date().toISOString(),
  };
}

export function registerUser(userInput: { name: string; email: string; password: string }) {
  const users = getUsers();
  const existing = users.find((user) => user.email.toLowerCase() === userInput.email.toLowerCase());

  if (existing) {
    throw new Error('Ya existe un usuario con ese email.');
  }

  const user = createUser(userInput);
  const nextUsers = [...users, user];
  saveUsers(nextUsers);
  return user;
}

export function authenticateUser(email: string, password: string) {
  const user = getUsers().find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    throw new Error('Email o contraseña inválidos.');
  }

  if (!verifyPassword(password, user.password)) {
    throw new Error('Email o contraseña inválidos.');
  }

  return user;
}
