import { ClubCategory } from './football';

export type CategoryGroup = 'Sub 11-12' | 'Sub 13-14' | 'Sub 15-16' | 'Sub 18' | 'Sub 20' | 'Todas';

export const CATEGORY_GROUPS_LIST: CategoryGroup[] = [
  'Sub 11-12',
  'Sub 13-14',
  'Sub 15-16',
  'Sub 18',
  'Sub 20',
  'Todas'
];

export const CATEGORY_GROUP_MAP: Record<CategoryGroup, ClubCategory[]> = {
  'Sub 11-12': ['Sub 11', 'Sub 12'],
  'Sub 13-14': ['Sub 13', 'Sub 14'],
  'Sub 15-16': ['Sub 15', 'Sub 16'],
  'Sub 18': ['Sub 18'],
  'Sub 20': ['Sub 20'],
  'Todas': ['Sub 11', 'Sub 12', 'Sub 13', 'Sub 14', 'Sub 15', 'Sub 16', 'Sub 18', 'Sub 20'],
};

export function getAllowedCategories(categoryOrGroup?: string): ClubCategory[] {
  if (!categoryOrGroup || categoryOrGroup === 'Todas' || categoryOrGroup === 'all') {
    return ['Sub 11', 'Sub 12', 'Sub 13', 'Sub 14', 'Sub 15', 'Sub 16', 'Sub 18', 'Sub 20'];
  }
  if (categoryOrGroup === 'Sub 11-12' || categoryOrGroup === 'Sub 11' || categoryOrGroup === 'Sub 12') {
    return ['Sub 11', 'Sub 12'];
  }
  if (categoryOrGroup === 'Sub 13-14' || categoryOrGroup === 'Sub 13' || categoryOrGroup === 'Sub 14') {
    return ['Sub 13', 'Sub 14'];
  }
  if (categoryOrGroup === 'Sub 15-16' || categoryOrGroup === 'Sub 15' || categoryOrGroup === 'Sub 16') {
    return ['Sub 15', 'Sub 16'];
  }
  if (categoryOrGroup === 'Sub 18') {
    return ['Sub 18'];
  }
  if (categoryOrGroup === 'Sub 20') {
    return ['Sub 20'];
  }
  return ['Sub 11', 'Sub 12', 'Sub 13', 'Sub 14', 'Sub 15', 'Sub 16', 'Sub 18', 'Sub 20'];
}

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
  email: string;
  password?: string;
  role: UserRole;
  category: CategoryGroup | ClubCategory | 'Todas';
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
