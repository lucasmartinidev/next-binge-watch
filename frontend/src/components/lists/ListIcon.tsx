import {
  Bookmark,
  CheckCircle2,
  Clapperboard,
  Clock,
  Compass,
  Film,
  Flame,
  Heart,
  Play,
  Rocket,
  Sparkles,
  Star,
  Trophy,
  Tv,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ListIconId } from '@/types/list';

const ICON_MAP: Record<ListIconId, LucideIcon> = {
  bookmark: Bookmark,
  play: Play,
  'check-circle': CheckCircle2,
  star: Star,
  heart: Heart,
  flame: Flame,
  tv: Tv,
  film: Film,
  sparkles: Sparkles,
  clock: Clock,
  trophy: Trophy,
  users: Users,
  'user-check': UserCheck,
  clapperboard: Clapperboard,
  compass: Compass,
  rocket: Rocket,
};

export type ListIconProps = {
  icon: ListIconId;
  className?: string;
};

export function ListIcon({ icon, className = 'h-3.5 w-3.5 shrink-0' }: ListIconProps) {
  const IconComponent = ICON_MAP[icon] ?? Bookmark;
  return <IconComponent className={className} aria-hidden="true" />;
}
