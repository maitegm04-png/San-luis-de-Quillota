import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserAccount } from '../types/auth';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { cleanForFirestore } from '../utils/firestoreSanitizer';

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  isAuthenticated: boolean;
  isAuthReady: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (userId: string) => void;
  registerUser: (newUser: Omit<UserAccount, 'id' | 'createdAt' | 'lastLogin'>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userId: string, data: Partial<UserAccount>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_USERS = 'san_luis_users_v3';
const STORAGE_KEY_CURRENT_USER = 'san_luis_current_user_v3';

// Helper to deduplicate users by email, prioritizing newest accounts
function deduplicateUsers(userList: UserAccount[]): UserAccount[] {
  const map = new Map<string, UserAccount>();
  for (const u of userList) {
    if (!u || !u.id) continue;
    if (u.id.startsWith('usr-sub') || u.id === 'usr-coord') continue;
    const emailKey = (u.email || '').trim().toLowerCase();
    if (!emailKey) {
      map.set(u.id, u);
      continue;
    }
    const existing = map.get(emailKey);
    if (!existing) {
      map.set(emailKey, u);
    } else {
      // Keep the one with newer lastLogin or createdAt
      const existingDate = existing.lastLogin || existing.createdAt || '';
      const currentDate = u.lastLogin || u.createdAt || '';
      if (currentDate >= existingDate) {
        map.set(emailKey, u);
      }
    }
  }
  return Array.from(map.values());
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return deduplicateUsers(parsed);
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

  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);

  // Listen to Firestore users in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const cloudUsers: UserAccount[] = [];
      snapshot.forEach((d) => {
        const u = d.data() as UserAccount;
        if (!u.id.startsWith('usr-sub') && u.id !== 'usr-coord') {
          cloudUsers.push(u);
        }
      });

      const unique = deduplicateUsers(cloudUsers);
      setUsers(unique);
      setIsAuthReady(true);

      // Keep currentUser in sync if updated in cloud
      setCurrentUser((prev) => {
        if (!prev) return null;
        const fresh = unique.find((u) => u.id === prev.id || (Boolean(u.email) && Boolean(prev.email) && u.email.toLowerCase() === prev.email.toLowerCase()));
        return fresh || prev;
      });
    }, (error) => {
      console.warn('Firestore users fallback to localStorage', error);
      setIsAuthReady(true);
    });

    return () => unsub();
  }, []);

  // Sync users to storage as local cache
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

  const login = async (identifier: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return { success: false, error: 'Por favor ingresa tu correo o usuario' };
    }

    let searchPool = users;

    // Check in local state first
    let found = searchPool.find(
      (u) =>
        (u.email || '').toLowerCase() === cleanId ||
        (u.name || '').toLowerCase() === cleanId ||
        (u.id || '').toLowerCase() === cleanId
    );

    // If not found in memory (e.g., first visit on a new device or browser), fetch directly from Firestore
    if (!found) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        const cloudUsers: UserAccount[] = [];
        snap.forEach((d) => {
          const u = d.data() as UserAccount;
          if (!u.id.startsWith('usr-sub') && u.id !== 'usr-coord') {
            cloudUsers.push(u);
          }
        });
        const fresh = deduplicateUsers(cloudUsers);
        setUsers(fresh);
        searchPool = fresh;
        found = fresh.find(
          (u) =>
            (u.email || '').toLowerCase() === cleanId ||
            (u.name || '').toLowerCase() === cleanId ||
            (u.id || '').toLowerCase() === cleanId
        );
      } catch (err) {
        console.warn('Direct Firestore fetch error on login:', err);
      }
    }

    if (!found) {
      return { success: false, error: 'Usuario no encontrado. Verifica tu correo o crea una cuenta.' };
    }

    // Password verification (tolerant to trimmed case differences)
    if (found.password && password !== undefined) {
      const inputPass = password.trim();
      const storedPass = found.password.trim();
      const match = inputPass === storedPass || inputPass.toLowerCase() === storedPass.toLowerCase();
      if (!match) {
        return { success: false, error: 'Contraseña incorrecta' };
      }
    }

    const updatedUser: UserAccount = {
      ...found,
      lastLogin: new Date().toISOString()
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === found!.id ? updatedUser : u)));

    // Persist lastLogin to cloud
    try {
      const sanitized = cleanForFirestore(updatedUser);
      await setDoc(doc(db, 'users', found.id), sanitized, { merge: true });
    } catch (e) {
      console.warn('Error updating lastLogin in Firestore:', e);
    }

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
      const sanitized = cleanForFirestore(updatedUser);
      setDoc(doc(db, 'users', found.id), sanitized, { merge: true }).catch(console.error);
    }
  };

  const registerUser = async (
    newUser: Omit<UserAccount, 'id' | 'createdAt' | 'lastLogin'>
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = newUser.email.trim().toLowerCase();
    const cleanName = newUser.name.trim();

    if (!cleanName) {
      return { success: false, error: 'El nombre es obligatorio' };
    }
    if (!cleanEmail) {
      return { success: false, error: 'El correo o nombre de usuario es obligatorio' };
    }

    // Check if account already exists in memory or in Firestore
    let existing = users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);

    if (!existing) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        for (const d of snap.docs) {
          const u = d.data() as UserAccount;
          if (u.email && u.email.toLowerCase() === cleanEmail) {
            existing = u;
            break;
          }
        }
      } catch (err) {
        console.warn('Error checking existing user in Firestore:', err);
      }
    }

    const now = new Date().toISOString();

    if (existing) {
      // Update existing account with the new role/category/password and log in
      const updated: UserAccount = {
        ...existing,
        name: cleanName,
        password: newUser.password || existing.password,
        role: newUser.role || existing.role,
        category: newUser.category || existing.category,
        avatarColor: newUser.avatarColor || existing.avatarColor || 'bg-amber-500',
        phone: newUser.phone ?? existing.phone ?? '',
        lastLogin: now,
      };

      const sanitized = cleanForFirestore(updated);
      try {
        await setDoc(doc(db, 'users', existing.id), sanitized, { merge: true });
      } catch (err: any) {
        console.error('Error saving updated user to Firestore:', err);
        return { success: false, error: 'No se pudo sincronizar el usuario con la nube: ' + (err?.message || '') };
      }

      setUsers((prev) => prev.map((u) => (u.id === existing!.id ? updated : u)));
      setCurrentUser(updated);
      return { success: true };
    }

    // New account creation
    const createdId = `usr-${Date.now()}`;
    const created: UserAccount = {
      ...newUser,
      id: createdId,
      name: cleanName,
      email: cleanEmail,
      phone: newUser.phone || '',
      avatarColor: newUser.avatarColor || 'bg-amber-500',
      createdAt: now.split('T')[0],
      lastLogin: now
    };

    const sanitized = cleanForFirestore(created);

    try {
      await setDoc(doc(db, 'users', createdId), sanitized);
    } catch (err: any) {
      console.error('Error writing new user to Firestore:', err);
      return { success: false, error: 'Error guardando en la base de datos de Firebase: ' + (err?.message || '') };
    }

    const nextUsers = deduplicateUsers([...users, created]);
    setUsers(nextUsers);
    setCurrentUser(created);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (users.length <= 1) {
      return { success: false, error: 'No se puede eliminar el único usuario del club' };
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    try {
      await deleteDoc(doc(db, 'users', userId));
    } catch (err) {
      console.error('Error deleting user from Firestore:', err);
    }
    if (currentUser?.id === userId) {
      setCurrentUser(null);
    }
    return { success: true };
  };

  const updateUser = async (userId: string, data: Partial<UserAccount>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...data } : u))
    );
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, ...data } : null));
    }
    try {
      const sanitized = cleanForFirestore(data);
      await setDoc(doc(db, 'users', userId), sanitized, { merge: true });
    } catch (err) {
      console.error('Error updating user in Firestore:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isAuthenticated: !!currentUser,
        isAuthReady,
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

