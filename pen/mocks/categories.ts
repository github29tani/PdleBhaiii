import { Category } from '@/types';
import { categoryColors } from '@/constants/colors';

export const mockCategories: Category[] = [
  {
    id: 'physics',
    name: 'Physics',
    icon: 'atom',
    color: categoryColors.physics
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: 'flask-conical',
    color: categoryColors.chemistry
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: 'dna',
    color: categoryColors.biology
  },
  {
    id: 'mathematics',
    name: 'Mathematics',
    icon: 'square-equal',
    color: categoryColors.mathematics
  },
  {
    id: 'history',
    name: 'History',
    icon: 'landmark',
    color: categoryColors.history
  },
  {
    id: 'geography',
    name: 'Geography',
    icon: 'globe',
    color: categoryColors.geography
  },
  {
    id: 'literature',
    name: 'Literature',
    icon: 'book-open',
    color: categoryColors.literature
  },
  {
    id: 'economics',
    name: 'Economics',
    icon: 'trending-up',
    color: categoryColors.economics
  },
  {
    id: 'computerScience',
    name: 'Computer Science',
    icon: 'code',
    color: categoryColors.computerScience
  },
  {
    id: 'none',
    name: 'None',
    icon: 'x',
    color: categoryColors.default
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'plus',
    color: categoryColors.default
  }
];