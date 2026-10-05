/**
 * Icon-name → lucide component map for the admin-managed About page.
 * Icons are stored in the JSONB config as kebab-case string names so the
 * config stays serializable; both the public renderer and the admin picker
 * resolve them through this map. Unknown names fall back to Sparkles.
 */
import {
  Sparkles, Shield, ShieldCheck, Heart, Award, Package, PencilRuler,
  Scissors, Gem, Zap, Truck, Headphones, BadgeCheck, Leaf, Scale,
  Banknote, Star, Crown, HandHeart, Ribbon, Medal, Globe, Clock, Users,
  type LucideIcon,
} from 'lucide-react'
import type { AboutIconName } from '@/lib/aboutPage'

export const ABOUT_ICONS: Record<AboutIconName, LucideIcon> = {
  sparkles: Sparkles,
  shield: Shield,
  'shield-check': ShieldCheck,
  heart: Heart,
  award: Award,
  package: Package,
  'pencil-ruler': PencilRuler,
  scissors: Scissors,
  gem: Gem,
  zap: Zap,
  truck: Truck,
  headphones: Headphones,
  'badge-check': BadgeCheck,
  leaf: Leaf,
  scale: Scale,
  banknote: Banknote,
  star: Star,
  crown: Crown,
  'hand-heart': HandHeart,
  ribbon: Ribbon,
  medal: Medal,
  globe: Globe,
  clock: Clock,
  users: Users,
}

export function aboutIcon(name: string): LucideIcon {
  return ABOUT_ICONS[name as AboutIconName] || Sparkles
}
