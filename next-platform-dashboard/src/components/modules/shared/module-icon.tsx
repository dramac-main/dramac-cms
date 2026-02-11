"use client";

import { 
  Package, 
  FileCode, 
  BarChart2, 
  Mail, 
  Calendar, 
  Coins,
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
import { icons } from "lucide-react";
import { resolveIconName } from "@/lib/utils/icon-map";

// Map of icon names to components
const iconMap: Record<string, LucideIcon> = {
  'package': Package,
  'file-code': FileCode,
  'bar-chart': BarChart2,
  'mail': Mail,
  'calendar': Calendar,
  'dollar-sign': Coins,
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
  // First check the static map
  const IconComponent = iconMap[icon?.toLowerCase()];
  
  if (IconComponent) {
    return <IconComponent className={`${sizeMap[size]} ${className}`} strokeWidth={1.5} />;
  }

  // Use resolveIconName for emoji/Lucide name resolution
  const resolved = resolveIconName(icon);
  const DynamicIcon = icons[resolved as keyof typeof icons];
  
  if (DynamicIcon) {
    return <DynamicIcon className={`${sizeMap[size]} ${className}`} strokeWidth={1.5} />;
  }

  // Default to Package icon
  return <Package className={`${sizeMap[size]} ${className}`} strokeWidth={1.5} />;
}
