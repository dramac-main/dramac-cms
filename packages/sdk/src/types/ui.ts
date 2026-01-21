/**
 * @dramac/sdk - UI Types
 * 
 * TypeScript definitions for UI components and layouts
 */

import type { ReactNode, ComponentType } from 'react';

/**
 * Common props for all module components
 */
export interface ModuleComponentProps {
  moduleId: string;
  siteId: string;
  className?: string;
}

/**
 * Dashboard component props
 */
export interface DashboardProps extends ModuleComponentProps {
  initialData?: Record<string, unknown>;
}

/**
 * Settings component props
 */
export interface SettingsProps extends ModuleComponentProps {
  settings: Record<string, unknown>;
  onSave: (settings: Record<string, unknown>) => Promise<void>;
}

/**
 * Embed component props
 */
export interface EmbedProps extends ModuleComponentProps {
  embedConfig?: Record<string, unknown>;
  isPreview?: boolean;
}

/**
 * Module layout wrapper props
 */
export interface ModuleLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  sidebar?: ReactNode;
}

/**
 * Breadcrumb item definition
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ComponentType<{ className?: string }>;
}

/**
 * Tab definition for module navigation
 */
export interface TabDefinition {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  component: ComponentType<ModuleComponentProps>;
  permission?: string;
}

/**
 * Action button definition
 */
export interface ActionButton {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  onClick?: () => void;
  href?: string;
  permission?: string;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * Table column definition
 */
export interface TableColumn<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
}

/**
 * Form field component props
 */
export interface FormFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Modal/Dialog component props
 */
export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

/**
 * Notification/Toast configuration
 */
export interface NotificationConfig {
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Empty state component props
 */
export interface EmptyStateProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ActionButton;
}

/**
 * Loading state component props
 */
export interface LoadingStateProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

/**
 * Error state component props
 */
export interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
  goBack?: () => void;
}

/**
 * Chart configuration types
 */
export interface ChartConfig {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'area';
  data: ChartData;
  options?: ChartOptions;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  fill?: boolean;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  legend?: boolean;
  title?: string;
}

/**
 * Stat card configuration
 */
export interface StatCardConfig {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: ComponentType<{ className?: string }>;
  href?: string;
}
