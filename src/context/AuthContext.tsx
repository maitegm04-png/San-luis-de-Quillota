import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserAccount } from '../types/auth';
import { DEFAULT_USERS } from '../data/defaultUsers';
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  isAuthenticated: boolean;
  login: (identifier: string, password?: string) => { success: boolean; error?: string };
  quickLogin: (userId: string) => void;
  registerUser: (newUser: Omit<UserAccount, 'id' | 'createdAt' | 'lastLogin'>) => { success: boolean; error?: string };
  logout: () => void;
  deleteUser: (userId: string) => { success: boolean; error?: string };
  updateUser: (userId: string, data: Partial<UserAccount>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USERS = 'san_luis_users_v3';
const STORAGE_KEY_CURRENT_USER = 'san_luis_current_user_v3';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((u: UserAccount) => !u.id.startsWith('usr-sub') && u.id !== 'usr-coord');
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.id?.startsWith('usr-sub') || parsed.id === 'usr-coord')) {
          return null;
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Listen to Firestore users in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudUsers: UserAccount[] = [];
        snapshot.forEach((d) => {
          const u = d.data() as UserAccount;
          // Delete any legacy dummy presets so club starts from 0
          if (u.id.startsWith('usr-sub') || u.id === 'usr-coord') {
            deleteDoc(doc(db, 'users', u.id)).catch(console.error);
          } else {
            cloudUsers.push(u);
          }
        });
        setUsers(cloudUsers);
      }
    }, (error) => {
      console.warn('Firestore users fallback to localStorage', error);
    });

    return () => unsub();
  }, []);

  // Sync users to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to storage', e);
    }
  }, [users]);

  // Sync current user to storage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.error('Failed to sync current user session', e);
    }
  }, [currentUser]);

  const login = (identifier: string, password?: string): { success: boolean; error?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return { success: false, error: 'Por favor ingresa tu correo o usuario' };
    }

    const found = users.find(
      (u) =>
        u.email.toLowerCase() === cleanId ||
        u.name.toLowerCase() === cleanId ||
        u.id.toLowerCase() === cleanId
    );

    if (!found) {
      return { success: false, error: 'Usuario no encontrado. Verifica tus datos o crea una cuenta.' };
    }

    // If account has password, check it
    if (found.password && password !== undefined) {
      if (found.password !== password) {
        return { success: false, error: 'Contraseña incorrecta' };
      }
    }

    const updatedUser = {
      ...found,
      lastLogin: new Date().toISOString()
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === found.id ? updatedUser : u)));
    setDoc(doc(db, 'users', found.id), updatedUser, { merge: true }).catch(console.error);
    return { success: true };
  };

  const quickLogin = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      const updatedUser = {
        ...found,
        lastLogin: new Date().toISOString()
      };
      setCurrentUser(updatedUser);
      setUsers((prev) => prev.map((u) => (u.id === found.id ? updatedUser : u)));
      setDoc(doc(db, 'users', found.id), updatedUser, { merge: true }).catch(console.error);
    }
  };

  const registerUser = (
    newUser: Omit<UserAccount, 'id' | 'createdAt' | 'lastLogin'>
  ): { success: boolean; error?: string } => {
    const cleanEmail = newUser.email.trim().toLowerCase();
    const cleanName = newUser.name.trim();

    if (!cleanName) {
      return { success: false, error: 'El nombre es obligatorio' };
    }
    if (!cleanEmail) {
      return { success: false, error: 'El correo o nombre de usuario es obligatorio' };
    }

    // Check if email already exists
    const exists = users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (exists) {
      return { success: false, error: 'Ya existe un usuario con este correo electrónico' };
    }

    const created: UserAccount = {
      ...newUser,
      id: `usr-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      createdAt: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString()
    };

    const nextUsers = [...users, created];
    setUsers(nextUsers);
    setCurrentUser(created);
    setDoc(doc(db, 'users', created.id), created).catch(console.error);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const deleteUser = (userId: string): { success: boolean; error?: string } => {
    if (users.length <= 1) {
      return { success: false, error: 'No se puede eliminar el único usuario del club' };
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteDoc(doc(db, 'users', userId)).catch(console.error);
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
    return { success: true };
  };

  const updateUser = (userId: string, data: Partial<UserAccount>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...data } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
    }
    setDoc(doc(db, 'users', userId), data, { merge: true }).catch(console.error);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated: !!currentUser,
        login,
        quickLogin,
        registerUser,
        logout,
        deleteUser,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
