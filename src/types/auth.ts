import { ClubCategory } from './football';

export type UserRole = 
  | 'Director Técnico'
  | 'Ayudante Técnico'
  | 'Preparador Físico'
  | 'Preparador de Arqueros'
  | 'Kinesiólogo'
  | 'Coordinador General'
  | 'Analista Táctico';

export interface UserAccount {
  id: string;
  name: string;
  email: string; // or username
  password?: string;
  role: UserRole;
  category: ClubCategory | 'Todas';
  avatarColor: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  currentUser: UserAccount | null;
  users: UserAccount[];
  isAuthenticated: boolean;
}
