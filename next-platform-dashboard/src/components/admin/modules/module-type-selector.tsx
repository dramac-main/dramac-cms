'use client'

/**
 * Module Type Selector Component
 * 
 * Phase EM-10: UI for selecting module type and configuring capabilities
 * 
 * This component provides:
 * - Visual module type selection (widget, app, integration, system, custom)
 * - Capability toggles based on selected type
 * - Configuration summary
 */

import { useState, useCallback } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  MODULE_TYPE_CONFIGS, 
  CAPABILITY_INFO,
  getDefaultCapabilities,
  getDefaultIsolation,
  validateCapabilities,
  type ModuleType, 
  type ModuleCapabilities,
  type DatabaseIsolation
} from '@/lib/modules/types/module-types-v2'
import { cn } from '@/lib/utils'
import { AlertCircle, Database, Globe, Settings } from 'lucide-react'

// =============================================================
// COMPONENT PROPS
// =============================================================

interface ModuleTypeSelectorProps {
  selectedType: ModuleType
  capabilities: ModuleCapabilities
  dbIsolation: DatabaseIsolation
  onTypeChange: (type: ModuleType) => void
  onCapabilitiesChange: (capabilities: ModuleCapabilities) => void
  onIsolationChange?: (isolation: DatabaseIsolation) => void
  disabled?: boolean
  showAdvanced?: boolean
}

// =============================================================
// MAIN COMPONENT
// =============================================================

export function ModuleTypeSelector({
  selectedType,
  capabilities,
  dbIsolation,
  onTypeChange,
  onCapabilitiesChange,
  onIsolationChange,
  disabled = false,
  showAdvanced = false
}: ModuleTypeSelectorProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Handle type change with automatic capability updates
  const handleTypeChange = useCallback((type: ModuleType) => {
    onTypeChange(type)
    
    // Apply default capabilities for this type
    const defaultCaps = getDefaultCapabilities(type)
    onCapabilitiesChange(defaultCaps)
    
    // Apply default isolation
    if (onIsolationChange) {
      onIsolationChange(getDefaultIsolation(type))
    }
    
    setValidationErrors([])
  }, [onTypeChange, onCapabilitiesChange, onIsolationChange])

  // Handle capability toggle with validation
  const handleCapabilityChange = useCallback((key: keyof ModuleCapabilities, enabled: boolean) => {
    const newCapabilities = {
      ...capabilities,
      [key]: enabled
    }
    
    // Validate against module type
    const { errors } = validateCapabilities(selectedType, newCapabilities)
    setValidationErrors(errors)
    
    // Still update even if validation fails (show warning instead)
    onCapabilitiesChange(newCapabilities)
  }, [capabilities, selectedType, onCapabilitiesChange])

  const typeConfig = MODULE_TYPE_CONFIGS[selectedType]
  const enabledCapabilities = Object.entries(capabilities)
    .filter(([_, enabled]) => enabled)
    .map(([key]) => key as keyof ModuleCapabilities)

  return (
    <div className="space-y-6">
      {/* Type Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Module Type</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {(Object.entries(MODULE_TYPE_CONFIGS) as [ModuleType, typeof typeConfig][]).map(([type, config]) => (
            <Card
              key={type}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md',
                selectedType === type 
                  ? 'ring-2 ring-primary border-primary bg-primary/5' 
                  : 'hover:border-primary/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !disabled && handleTypeChange(type)}
            >
              <CardHeader className="p-4 pb-2">
                <div className="text-3xl mb-2">{config.icon}</div>
                <CardTitle className="text-base">{config.label}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <CardDescription className="text-xs">
                  {config.description}
                </CardDescription>
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    {config.developmentTime}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Capabilities Configuration */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Capabilities</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Configure what features this module supports. Some capabilities may be 
          restricted based on the module type.
        </p>
        
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div className="text-sm text-destructive">
                {validationErrors.map((error, i) => (
                  <div key={i}>{error}</div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Capability Groups */}
        <div className="space-y-6">
          {/* Data Capabilities */}
          <CapabilityGroup
            title="Data & Integration"
            icon={<Database className="h-4 w-4" />}
            capabilities={capabilities}
            allowedCapabilities={typeConfig.allowedCapabilities}
            category="data"
            onToggle={handleCapabilityChange}
            disabled={disabled}
          />
          
          {/* UI Capabilities */}
          <CapabilityGroup
            title="User Interface"
            icon={<Globe className="h-4 w-4" />}
            capabilities={capabilities}
            allowedCapabilities={typeConfig.allowedCapabilities}
            category="ui"
            onToggle={handleCapabilityChange}
            disabled={disabled}
          />
          
          {/* Deployment Capabilities */}
          <CapabilityGroup
            title="Deployment"
            icon={<Settings className="h-4 w-4" />}
            capabilities={capabilities}
            allowedCapabilities={typeConfig.allowedCapabilities}
            category="deployment"
            onToggle={handleCapabilityChange}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Database Isolation (Advanced) */}
      {showAdvanced && capabilities.has_database && onIsolationChange && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Database Isolation</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose how this module&apos;s database tables are isolated.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <IsolationOption
              value="none"
              selected={dbIsolation === 'none'}
              label="Shared"
              description="Uses module_data table"
              onSelect={() => onIsolationChange('none')}
              disabled={disabled}
            />
            <IsolationOption
              value="tables"
              selected={dbIsolation === 'tables'}
              label="Prefixed Tables"
              description="mod_{id}_{table}"
              onSelect={() => onIsolationChange('tables')}
              disabled={disabled}
            />
            <IsolationOption
              value="schema"
              selected={dbIsolation === 'schema'}
              label="Dedicated Schema"
              description="mod_{id}.{table}"
              onSelect={() => onIsolationChange('schema')}
              disabled={disabled}
            />
          </div>
        </div>
      )}

      {/* Configuration Summary */}
      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-3">Configuration Summary</h4>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default" className="gap-1">
            {typeConfig.icon} {typeConfig.label}
          </Badge>
          <Badge variant="outline">
            {typeConfig.complexity.charAt(0).toUpperCase() + typeConfig.complexity.slice(1)} Complexity
          </Badge>
          {capabilities.has_database && (
            <Badge variant="secondary">
              {dbIsolation === 'schema' ? 'Schema Isolation' : 
               dbIsolation === 'tables' ? 'Table Prefix' : 'Shared Data'}
            </Badge>
          )}
          {enabledCapabilities
            .filter(key => !['embeddable', 'standalone'].includes(key))
            .map((key) => (
              <Badge key={key} variant="secondary">
                {CAPABILITY_INFO[key].icon} {CAPABILITY_INFO[key].title}
              </Badge>
            ))
          }
        </div>
        
        {/* Quick Stats */}
        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Dev Time:</span>{' '}
            <span className="font-medium">{typeConfig.developmentTime}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Capabilities:</span>{' '}
            <span className="font-medium">{enabledCapabilities.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Isolation:</span>{' '}
            <span className="font-medium capitalize">{dbIsolation}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================================
// SUB-COMPONENTS
// =============================================================

interface CapabilityGroupProps {
  title: string
  icon: React.ReactNode
  capabilities: ModuleCapabilities
  allowedCapabilities: (keyof ModuleCapabilities)[]
  category: 'data' | 'ui' | 'deployment'
  onToggle: (key: keyof ModuleCapabilities, enabled: boolean) => void
  disabled?: boolean
}

function CapabilityGroup({
  title,
  icon,
  capabilities,
  allowedCapabilities,
  category,
  onToggle,
  disabled
}: CapabilityGroupProps) {
  const categoryCapabilities = Object.entries(CAPABILITY_INFO)
    .filter(([_, info]) => info.category === category)
    .map(([key]) => key as keyof ModuleCapabilities)

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {categoryCapabilities.map((key) => {
          const info = CAPABILITY_INFO[key]
          const isAllowed = allowedCapabilities.includes(key)
          const isEnabled = capabilities[key]

          return (
            <div 
              key={key}
              className={cn(
                'flex items-center justify-between p-3 border rounded-lg transition-colors',
                !isAllowed && 'opacity-50 bg-muted/50',
                isEnabled && isAllowed && 'border-primary/50 bg-primary/5'
              )}
            >
              <div className="flex flex-col gap-0.5">
                <Label 
                  htmlFor={key} 
                  className={cn(
                    'text-sm font-medium cursor-pointer flex items-center gap-1.5',
                    !isAllowed && 'cursor-not-allowed'
                  )}
                >
                  <span>{info.icon}</span>
                  {info.title}
                </Label>
                <span className="text-xs text-muted-foreground">
                  {info.description}
                </span>
              </div>
              <Switch
                id={key}
                checked={isEnabled}
                disabled={disabled || !isAllowed}
                onCheckedChange={(checked) => onToggle(key, checked)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface IsolationOptionProps {
  value: DatabaseIsolation
  selected: boolean
  label: string
  description: string
  onSelect: () => void
  disabled?: boolean
}

function IsolationOption({
  value: _value,
  selected,
  label,
  description,
  onSelect,
  disabled
}: IsolationOptionProps) {
  return (
    <div
      className={cn(
        'p-4 border rounded-lg cursor-pointer transition-all',
        selected 
          ? 'ring-2 ring-primary border-primary bg-primary/5' 
          : 'hover:border-primary/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={() => !disabled && onSelect()}
    >
      <div className="font-medium">{label}</div>
      <div className="text-xs text-muted-foreground font-mono mt-1">
        {description}
      </div>
    </div>
  )
}

// =============================================================
// EXPORTS
// =============================================================

export default ModuleTypeSelector
