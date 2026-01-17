"use client";

import { 
  Package, 
  FileCode, 
  BarChart2, 
  Mail, 
  Calendar, 
  DollarSign,
  Users,
  Globe,
  Search,
  Settings,
  ShoppingCart,
  FileText,
  Megaphone,
  Layers,
  MessageSquare,
  Database,
  Zap,
  Shield,
  Palette,
  type LucideIcon
} from "lucide-react";

// Map of icon names to components
const iconMap: Record<string, LucideIcon> = {
  'package': Package,
  'file-code': FileCode,
  'bar-chart': BarChart2,
  'mail': Mail,
  'calendar': Calendar,
  'dollar-sign': DollarSign,
  'users': Users,
  'globe': Globe,
  'search': Search,
  'settings': Settings,
  'shopping-cart': ShoppingCart,
  'file-text': FileText,
  'megaphone': Megaphone,
  'layers': Layers,
  'message-square': MessageSquare,
  'database': Database,
  'zap': Zap,
  'shield': Shield,
  'palette': Palette,
};

interface ModuleIconProps {
  icon: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export function ModuleIcon({ icon, className = '', size = 'md' }: ModuleIconProps) {
  // Check if it's an emoji (starts with non-ASCII character)
  const isEmoji = icon && /[\u{1F300}-\u{1F9FF}]/u.test(icon);
  
  if (isEmoji) {
    const emojiSizeMap = {
      sm: 'text-base',
      md: 'text-xl',
      lg: 'text-2xl',
      xl: 'text-4xl',
    };
    return <span className={`${emojiSizeMap[size]} ${className}`}>{icon}</span>;
  }

  // Check if it's a Lucide icon name
  const IconComponent = iconMap[icon?.toLowerCase()];
  
  if (IconComponent) {
    return <IconComponent className={`${sizeMap[size]} ${className}`} />;
  }

  // Default to Package icon
  return <Package className={`${sizeMap[size]} ${className}`} />;
}
