# TASK: Generate Implementation Phases - WAVE 8 (Templates & Extras)

You are a senior software architect. Wave 7 (Polish & Optimization) has been successfully implemented. Now generate the **final 3 extras phases** for DRAMAC Studio.

## ✅ Wave 7 Completion Status

The following has been implemented:

### Files Created (Wave 7):
```
src/lib/studio/hooks/
  └── use-studio-shortcuts.ts            ✅ All keyboard shortcuts

src/lib/studio/clipboard.ts               ✅ Copy/paste system

src/components/studio/features/
  ├── command-palette.tsx                 ✅ Cmd+K command palette
  ├── shortcuts-panel.tsx                 ✅ Shortcuts help panel
  └── state-selector.tsx                  ✅ Component state editing

src/lib/studio/engine/
  ├── html-generator.ts                   ✅ Optimized HTML export
  ├── critical-css.ts                     ✅ Critical CSS extraction
  ├── image-optimizer.ts                  ✅ Image optimization
  ├── lazy-renderer.tsx                   ✅ Lazy loading components
  └── build.ts                            ✅ Build optimization script

Integration:
  ✅ All keyboard shortcuts working (save, undo, copy, paste, delete, etc.)
  ✅ Command palette with search
  ✅ Shortcuts help panel
  ✅ Virtualized component list
  ✅ Memoized component renders
  ✅ Code-split panels (lazy loaded)
  ✅ Component state editing (hover, active, focus)
  ✅ State preview in canvas
  ✅ Optimized HTML/CSS export
  ✅ Critical CSS inlined
  ✅ Lazy loading for published sites
```

### Current State:
- ✅ Full keyboard workflow (power users can work fast)
- ✅ Command palette for quick actions
- ✅ Editor handles 500+ components smoothly
- ✅ Buttons can have hover/active/focus effects
- ✅ Published sites optimized (Lighthouse 90+)
- ✅ Critical CSS extraction working
- ✅ Image srcset and lazy loading

### What's Missing (Wave 8 Will Add):
- ❌ Section template library
- ❌ Template browser UI
- ❌ Symbols (reusable components)
- ❌ Symbol instances and overrides
- ❌ Onboarding tutorial
- ❌ Help system and tooltips

---

## 🎯 Generate These Phases (Wave 8):

1. **PHASE-STUDIO-24: Section Templates**
2. **PHASE-STUDIO-25: Symbols (Reusable Components)**
3. **PHASE-STUDIO-26: Onboarding & Help**

## Expected Outcome After Wave 8

After implementing these 3 phases, we should have:
- ✅ Section template library (hero, pricing, testimonials, etc.)
- ✅ Template browser with preview
- ✅ Insert template at cursor position
- ✅ Templates adapt to site colors
- ✅ Save component/section as symbol
- ✅ Symbols panel showing all saved symbols
- ✅ Symbol instances update when source edited
- ✅ Override instance props (unlink from source)
- ✅ First-time user tutorial
- ✅ Contextual tooltips on hover
- ✅ Help panel with documentation links
- ✅ "What's new" panel for updates

---

## Key Implementation Context

### Existing Infrastructure (Already Built)

```typescript
// Component registry has all components
// Editor store manages page data
// Save/load already working
// AI can generate content
// Database has sites, pages, modules
```

---

## PHASE-STUDIO-24: Section Templates

### Requirements

#### 1. Template Data Structure

```typescript
// src/types/studio-templates.ts

interface SectionTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string; // Preview image URL
  tags: string[];
  isPremium: boolean; // Some templates require paid plan
  
  // The actual template data
  components: StudioComponent[]; // Array of components to insert
  
  // Customization
  colorTokens: Record<string, string>; // Tokens to replace with site colors
  textTokens: Record<string, string>; // Placeholder texts
}

type TemplateCategory = 
  | 'hero'
  | 'features'
  | 'pricing'
  | 'testimonials'
  | 'cta'
  | 'team'
  | 'faq'
  | 'contact'
  | 'footer'
  | 'gallery'
  | 'stats'
  | 'newsletter';

// Example template:
const heroTemplate: SectionTemplate = {
  id: 'hero-gradient-1',
  name: 'Gradient Hero with CTA',
  description: 'Modern hero section with gradient background and dual CTAs',
  category: 'hero',
  thumbnail: '/templates/hero-gradient-1.png',
  tags: ['modern', 'gradient', 'cta'],
  isPremium: false,
  components: [
    {
      id: 'hero-section',
      type: 'Section',
      props: {
        background: { type: 'gradient', colors: ['$primary', '$secondary'] },
        padding: { mobile: '64px 24px', tablet: '96px 48px', desktop: '128px 64px' },
      },
      children: ['hero-heading', 'hero-text', 'hero-buttons'],
    },
    {
      id: 'hero-heading',
      type: 'Heading',
      props: {
        text: '$headline',
        fontSize: { mobile: '32px', tablet: '48px', desktop: '64px' },
        textAlign: { mobile: 'center' },
        color: '#ffffff',
      },
      parentId: 'hero-section',
    },
    // ... more components
  ],
  colorTokens: {
    '$primary': 'primary',
    '$secondary': 'secondary',
  },
  textTokens: {
    '$headline': 'Build Something Amazing',
    '$subheadline': 'The platform that helps you create beautiful websites',
    '$cta1': 'Get Started',
    '$cta2': 'Learn More',
  },
};
```

#### 2. Template Library Store

```typescript
// src/lib/studio/store/template-store.ts

interface TemplateStore {
  templates: SectionTemplate[];
  categories: TemplateCategory[];
  selectedCategory: TemplateCategory | 'all';
  searchQuery: string;
  isLoading: boolean;
  
  // Actions
  fetchTemplates: () => Promise<void>;
  setCategory: (category: TemplateCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  getFilteredTemplates: () => SectionTemplate[];
}
```

#### 3. Template Browser UI

```typescript
// src/components/studio/features/template-browser.tsx

interface TemplateBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (template: SectionTemplate) => void;
  insertPosition?: 'top' | 'bottom' | 'after-selected';
}

export function TemplateBrowser({ isOpen, onClose, onInsert }: TemplateBrowserProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle>Insert Section</DialogTitle>
          <DialogDescription>Choose a pre-designed section to add to your page</DialogDescription>
        </DialogHeader>
        
        <div className="flex h-full">
          {/* Left: Categories */}
          <div className="w-48 border-r pr-4">
            <CategoryList 
              categories={categories}
              selected={selectedCategory}
              onSelect={setCategory}
            />
          </div>
          
          {/* Right: Template Grid */}
          <div className="flex-1 pl-4">
            <Input 
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="grid grid-cols-2 gap-4 mt-4 overflow-y-auto">
              {filteredTemplates.map(template => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => onInsert(template)}
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Template card with hover preview
function TemplateCard({ template, onSelect }: { template: SectionTemplate; onSelect: () => void }) {
  return (
    <div 
      className="group cursor-pointer border rounded-lg overflow-hidden hover:border-primary transition-colors"
      onClick={onSelect}
    >
      <div className="relative aspect-video">
        <img 
          src={template.thumbnail} 
          alt={template.name}
          className="w-full h-full object-cover"
        />
        {template.isPremium && (
          <Badge className="absolute top-2 right-2">Pro</Badge>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button>Insert Section</Button>
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-medium">{template.name}</h4>
        <p className="text-sm text-muted-foreground">{template.description}</p>
      </div>
    </div>
  );
}
```

#### 4. Template Insertion Logic

```typescript
// src/lib/studio/utils/template-utils.ts

export function insertTemplate(
  template: SectionTemplate,
  position: 'top' | 'bottom' | 'after-selected',
  siteColors: SiteColorScheme
): StudioComponent[] {
  // 1. Clone template components with new IDs
  const clonedComponents = cloneTemplateComponents(template.components);
  
  // 2. Replace color tokens with site colors
  const withColors = replaceColorTokens(clonedComponents, template.colorTokens, siteColors);
  
  // 3. Keep text tokens (user will customize)
  // But replace with actual text placeholders
  const withText = replaceTextTokens(withColors, template.textTokens);
  
  return withText;
}

function cloneTemplateComponents(components: StudioComponent[]): StudioComponent[] {
  const idMap = new Map<string, string>();
  
  // First pass: generate new IDs
  components.forEach(comp => {
    idMap.set(comp.id, generateId());
  });
  
  // Second pass: update references
  return components.map(comp => ({
    ...comp,
    id: idMap.get(comp.id)!,
    parentId: comp.parentId ? idMap.get(comp.parentId) : undefined,
    children: comp.children?.map(childId => idMap.get(childId)!),
  }));
}

function replaceColorTokens(
  components: StudioComponent[],
  tokens: Record<string, string>,
  siteColors: SiteColorScheme
): StudioComponent[] {
  return components.map(comp => ({
    ...comp,
    props: replaceTokensInObject(comp.props, tokens, siteColors),
  }));
}
```

#### 5. Toolbar Integration

```typescript
// Add "Add Section" button to toolbar
// When clicked, opens TemplateBrowser
// After selection, inserts at specified position

// In src/components/studio/layout/studio-toolbar.tsx:
<Button onClick={() => setTemplateBrowserOpen(true)}>
  <Plus className="w-4 h-4 mr-2" />
  Add Section
</Button>
```

#### 6. Sample Templates to Include

Create at least 12 starter templates:
- 2 Hero sections
- 2 Features sections
- 1 Pricing section
- 1 Testimonials section
- 2 CTA sections
- 1 Team section
- 1 FAQ section
- 1 Contact section
- 1 Footer section

---

## PHASE-STUDIO-25: Symbols (Reusable Components)

### Requirements

#### 1. Symbol Data Structure

```typescript
// src/types/studio-symbols.ts

interface StudioSymbol {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  
  // The source component tree
  sourceComponent: StudioComponent;
  sourceChildren?: StudioComponent[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  siteId: string; // Symbols are per-site
  
  // Usage tracking
  instanceCount: number;
}

// Symbol instance in page
interface SymbolInstance extends StudioComponent {
  symbolId: string; // Reference to source symbol
  overrides?: Record<string, unknown>; // Props that differ from source
  isUnlinked?: boolean; // If unlinked, no longer syncs
}
```

#### 2. Symbols Store

```typescript
// src/lib/studio/store/symbol-store.ts

interface SymbolStore {
  symbols: StudioSymbol[];
  isLoading: boolean;
  
  // Actions
  fetchSymbols: (siteId: string) => Promise<void>;
  createSymbol: (name: string, component: StudioComponent) => Promise<StudioSymbol>;
  updateSymbol: (id: string, updates: Partial<StudioSymbol>) => Promise<void>;
  deleteSymbol: (id: string) => Promise<void>;
  
  // Instance management
  insertSymbolInstance: (symbolId: string, position: InsertPosition) => void;
  updateAllInstances: (symbolId: string, newSource: StudioComponent) => void;
  unlinkInstance: (instanceId: string) => void;
}
```

#### 3. Create Symbol UI

```typescript
// Right-click context menu or "..." button on component wrapper:
// "Save as Symbol..."

// Dialog:
function CreateSymbolDialog({ component, onClose }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const handleCreate = async () => {
    await createSymbol({
      name,
      description,
      sourceComponent: component,
      sourceChildren: getChildren(component.id),
    });
    toast.success('Symbol created');
    onClose();
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save as Symbol</DialogTitle>
          <DialogDescription>
            Create a reusable symbol from this component. 
            Changes to the symbol will update all instances.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Symbol Name</Label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Header Navigation"
            />
          </div>
          <div>
            <Label>Description (optional)</Label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this symbol is used for..."
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name}>Create Symbol</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

#### 4. Symbols Panel

```typescript
// src/components/studio/panels/symbols-panel.tsx

// Accessed via left panel tab or separate button
function SymbolsPanel() {
  const { symbols, isLoading } = useSymbolStore();
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Symbols</h3>
        <span className="text-sm text-muted-foreground">{symbols.length} symbols</span>
      </div>
      
      {isLoading ? (
        <Spinner />
      ) : symbols.length === 0 ? (
        <EmptyState
          icon={<Puzzle className="w-12 h-12" />}
          title="No symbols yet"
          description="Right-click any component and 'Save as Symbol' to create reusable components."
        />
      ) : (
        <div className="space-y-2">
          {symbols.map(symbol => (
            <SymbolCard 
              key={symbol.id}
              symbol={symbol}
              onInsert={() => insertSymbolInstance(symbol.id)}
              onEdit={() => openSymbolEditor(symbol.id)}
              onDelete={() => deleteSymbol(symbol.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SymbolCard({ symbol, onInsert, onEdit, onDelete }: Props) {
  return (
    <div className="border rounded-lg p-3 group hover:border-primary transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{symbol.name}</h4>
          {symbol.description && (
            <p className="text-sm text-muted-foreground">{symbol.description}</p>
          )}
          <span className="text-xs text-muted-foreground">
            {symbol.instanceCount} instance{symbol.instanceCount !== 1 ? 's' : ''}
          </span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onInsert}>Insert on page</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>Edit symbol</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              Delete symbol
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Drag handle for inserting */}
      <DraggableSymbol symbolId={symbol.id} />
    </div>
  );
}
```

#### 5. Symbol Instance Rendering

```typescript
// When rendering a symbol instance:
// 1. Fetch source symbol
// 2. Apply overrides
// 3. Render with visual indicator

function SymbolInstanceWrapper({ instance }: { instance: SymbolInstance }) {
  const symbol = useSymbolStore(s => s.symbols.find(sy => sy.id === instance.symbolId));
  
  if (!symbol) {
    return <MissingSymbolPlaceholder instanceId={instance.id} />;
  }
  
  // Merge source props with overrides
  const effectiveProps = {
    ...symbol.sourceComponent.props,
    ...instance.overrides,
  };
  
  return (
    <div className="relative">
      {/* Symbol indicator */}
      <div className="absolute -top-6 left-0 flex items-center gap-1 text-xs text-muted-foreground">
        <Puzzle className="w-3 h-3" />
        <span>{symbol.name}</span>
        {instance.isUnlinked && <span className="text-orange-500">(unlinked)</span>}
      </div>
      
      <ComponentRenderer 
        component={{ ...symbol.sourceComponent, props: effectiveProps }}
      />
    </div>
  );
}
```

#### 6. Override Props System

```typescript
// When editing a symbol instance:
// - Show all fields as normal
// - Fields that differ from source show "override" indicator
// - "Reset to symbol" button to clear override
// - "Unlink" button to disconnect from symbol entirely

function SymbolPropertiesPanel({ instance }: Props) {
  const symbol = useSymbol(instance.symbolId);
  const overriddenFields = getOverriddenFields(symbol.sourceComponent.props, instance.overrides);
  
  return (
    <div className="space-y-4">
      {/* Symbol header */}
      <div className="flex justify-between items-center p-2 bg-muted rounded">
        <div className="flex items-center gap-2">
          <Puzzle className="w-4 h-4" />
          <span className="font-medium">{symbol.name}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => editSymbol(symbol.id)}>
            Edit Source
          </Button>
          <Button variant="ghost" size="sm" onClick={() => unlinkInstance(instance.id)}>
            Unlink
          </Button>
        </div>
      </div>
      
      {/* Fields */}
      {Object.entries(definition.fields).map(([key, field]) => (
        <div key={key} className="relative">
          <FieldEditor 
            field={field}
            value={instance.props[key]}
            onChange={(value) => updateInstanceProp(instance.id, key, value)}
          />
          
          {overriddenFields.includes(key) && (
            <button
              onClick={() => resetOverride(instance.id, key)}
              className="absolute top-0 right-0 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

#### 7. Update Propagation

```typescript
// When symbol source is edited:
// 1. Update all linked instances
// 2. Preserve their overrides
// 3. Toast notification: "Updated X instances"

async function updateSymbol(symbolId: string, newSource: StudioComponent) {
  // Save to database
  await db.symbols.update(symbolId, { sourceComponent: newSource });
  
  // Find all instances across all pages
  const instances = await findSymbolInstances(symbolId);
  
  // Update each instance (preserving overrides)
  for (const instance of instances) {
    if (!instance.isUnlinked) {
      await updatePage(instance.pageId, {
        components: {
          [instance.id]: {
            ...instance,
            // Source updated, overrides preserved
          },
        },
      });
    }
  }
  
  toast.success(`Updated ${instances.filter(i => !i.isUnlinked).length} instances`);
}
```

---

## PHASE-STUDIO-26: Onboarding & Help

### Requirements

#### 1. First-Time Tutorial

```typescript
// src/components/studio/onboarding/tutorial.tsx

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'drag' | 'type';
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DRAMAC Studio!',
    description: 'Let\'s take a quick tour of the editor. This will only take a minute.',
    target: 'body', // Center of screen
    position: 'bottom',
  },
  {
    id: 'components',
    title: 'Component Library',
    description: 'Drag components from here to add them to your page. Search or browse by category.',
    target: '[data-panel="left"]',
    position: 'right',
  },
  {
    id: 'canvas',
    title: 'Your Page Canvas',
    description: 'This is where you build your page. Click any component to select it.',
    target: '[data-panel="canvas"]',
    position: 'bottom',
  },
  {
    id: 'properties',
    title: 'Properties Panel',
    description: 'Edit the selected component\'s content, style, and settings here.',
    target: '[data-panel="right"]',
    position: 'left',
  },
  {
    id: 'ai',
    title: 'AI Assistant',
    description: 'Click "Ask AI" to get help editing any component using natural language.',
    target: '[data-ai-button]',
    position: 'left',
  },
  {
    id: 'layers',
    title: 'Layers Panel',
    description: 'See your page structure and reorder components easily.',
    target: '[data-panel="bottom"]',
    position: 'top',
  },
  {
    id: 'responsive',
    title: 'Responsive Preview',
    description: 'Switch between mobile, tablet, and desktop views to design for all screens.',
    target: '[data-responsive-controls]',
    position: 'bottom',
  },
  {
    id: 'save',
    title: 'Save Your Work',
    description: 'Click Save or press Ctrl+S to save. Your changes are also auto-saved.',
    target: '[data-save-button]',
    position: 'bottom',
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description: 'Start building by dragging a component to the canvas. Need help? Press ? for shortcuts.',
    target: 'body',
    position: 'bottom',
  },
];

export function Tutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const step = TUTORIAL_STEPS[currentStep];
  
  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };
  
  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('studio-tutorial-completed', 'true');
  };
  
  if (!isVisible) return null;
  
  return (
    <TutorialOverlay step={step} onNext={handleNext} onSkip={handleSkip}>
      <TutorialHighlight target={step.target} />
      <TutorialTooltip 
        step={step}
        currentIndex={currentStep}
        totalSteps={TUTORIAL_STEPS.length}
        onNext={handleNext}
        onSkip={handleSkip}
      />
    </TutorialOverlay>
  );
}
```

#### 2. Contextual Tooltips

```typescript
// src/components/studio/help/contextual-tooltips.tsx

// Add data-tooltip attributes to UI elements:
// data-tooltip="component-library"
// data-tooltip="properties-panel"
// etc.

const TOOLTIPS: Record<string, string> = {
  'component-library': 'Drag components from here to your page',
  'properties-panel': 'Edit the selected component here',
  'responsive-mobile': 'Preview how your page looks on mobile',
  'responsive-tablet': 'Preview how your page looks on tablet',
  'responsive-desktop': 'Preview how your page looks on desktop',
  'zoom-controls': 'Zoom in/out of the canvas (Ctrl +/-)',
  'undo-button': 'Undo last action (Ctrl+Z)',
  'redo-button': 'Redo last action (Ctrl+Shift+Z)',
  'save-button': 'Save your page (Ctrl+S)',
  'preview-button': 'Open page preview in new tab',
  'ai-button': 'Ask AI to help edit this component',
  'layers-panel': 'View and reorder page structure',
  'history-panel': 'View change history and restore versions',
};

// Use Floating UI for tooltips
export function ContextualTooltip({ children, tooltipKey }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Tooltip open={isOpen} onOpenChange={setIsOpen}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <p>{TOOLTIPS[tooltipKey]}</p>
      </TooltipContent>
    </Tooltip>
  );
}
```

#### 3. Help Panel

```typescript
// src/components/studio/features/help-panel.tsx

interface HelpSection {
  title: string;
  items: HelpItem[];
}

interface HelpItem {
  title: string;
  description: string;
  link?: string; // External documentation link
  video?: string; // Tutorial video URL
}

const HELP_SECTIONS: HelpSection[] = [
  {
    title: 'Getting Started',
    items: [
      { title: 'Adding Components', description: 'How to add components to your page', link: '/docs/adding-components' },
      { title: 'Editing Content', description: 'How to edit text, images, and more', link: '/docs/editing-content' },
      { title: 'Responsive Design', description: 'Making your site look great on all devices', link: '/docs/responsive' },
    ],
  },
  {
    title: 'Advanced Features',
    items: [
      { title: 'AI Assistant', description: 'Using AI to speed up your workflow', link: '/docs/ai-assistant' },
      { title: 'Symbols', description: 'Creating reusable components', link: '/docs/symbols' },
      { title: 'Templates', description: 'Using pre-designed sections', link: '/docs/templates' },
    ],
  },
  {
    title: 'Keyboard Shortcuts',
    items: [
      { title: 'View All Shortcuts', description: 'See the complete list of keyboard shortcuts', action: 'openShortcuts' },
    ],
  },
];

export function HelpPanel() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm">
          <HelpCircle className="w-4 h-4 mr-2" />
          Help
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Help & Resources</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-4">
          {HELP_SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="font-semibold mb-2">{section.title}</h3>
              <div className="space-y-2">
                {section.items.map(item => (
                  <HelpItemCard key={item.title} item={item} />
                ))}
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full" onClick={restartTutorial}>
              <Play className="w-4 h-4 mr-2" />
              Restart Tutorial
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

#### 4. What's New Panel

```typescript
// src/components/studio/features/whats-new-panel.tsx

interface ChangelogItem {
  version: string;
  date: string;
  changes: {
    type: 'feature' | 'improvement' | 'fix';
    title: string;
    description: string;
  }[];
}

const CHANGELOG: ChangelogItem[] = [
  {
    version: '1.0.0',
    date: '2026-02-03',
    changes: [
      { type: 'feature', title: 'AI Page Generator', description: 'Generate entire pages from text prompts' },
      { type: 'feature', title: 'Symbol System', description: 'Create reusable components that sync across pages' },
      { type: 'feature', title: 'Component States', description: 'Edit hover, active, and focus states' },
      { type: 'improvement', title: 'Performance', description: 'Editor now handles 500+ components smoothly' },
    ],
  },
];

export function WhatsNewPanel() {
  const [hasUnread, setHasUnread] = useState(false);
  
  useEffect(() => {
    const lastSeen = localStorage.getItem('studio-changelog-seen');
    const latestVersion = CHANGELOG[0].version;
    setHasUnread(lastSeen !== latestVersion);
  }, []);
  
  const markAsRead = () => {
    localStorage.setItem('studio-changelog-seen', CHANGELOG[0].version);
    setHasUnread(false);
  };
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative" onClick={markAsRead}>
          <Sparkles className="w-4 h-4" />
          {hasUnread && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <h3 className="font-semibold mb-2">What's New</h3>
        
        <ScrollArea className="h-64">
          {CHANGELOG.map(release => (
            <div key={release.version} className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <Badge>v{release.version}</Badge>
                <span className="text-xs text-muted-foreground">{release.date}</span>
              </div>
              
              <div className="space-y-2">
                {release.changes.map((change, i) => (
                  <div key={i} className="flex gap-2">
                    <Badge variant={change.type === 'feature' ? 'default' : 'secondary'}>
                      {change.type}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{change.title}</p>
                      <p className="text-xs text-muted-foreground">{change.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
```

#### 5. Empty State Guidance

```typescript
// When canvas is empty, show guidance:
function EmptyCanvasGuide() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <MousePointer className="w-8 h-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-xl font-semibold mb-2">Start Building Your Page</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Drag components from the left panel, or use one of these quick options:
      </p>
      
      <div className="flex gap-4">
        <Button onClick={openTemplateBrowser}>
          <LayoutTemplate className="w-4 h-4 mr-2" />
          Choose a Template
        </Button>
        <Button variant="outline" onClick={openAIGenerator}>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate with AI
        </Button>
      </div>
    </div>
  );
}
```

---

## Important Constraints

1. **Templates**: Store in database, support versioning
2. **Symbols**: Per-site, sync instantly on edit
3. **Tutorial**: Can be dismissed, restart available
4. **Tooltips**: Don't spam, show on hover with delay
5. **Help**: Links to actual documentation (create if needed)
6. **Performance**: Don't slow down editor with onboarding

---

## Wave 8 Checklist

After implementation, verify:

- [ ] Template browser opens from toolbar
- [ ] Can search and filter templates
- [ ] Template inserts at correct position
- [ ] Template adapts to site colors
- [ ] Can save component as symbol
- [ ] Symbol appears in symbols panel
- [ ] Can insert symbol instance
- [ ] Editing symbol updates all instances
- [ ] Can override instance props
- [ ] Can unlink instance
- [ ] Tutorial runs on first visit
- [ ] Can restart tutorial
- [ ] Tooltips show on hover
- [ ] Help panel has documentation links
- [ ] What's new shows changelog
- [ ] Empty canvas shows guidance

---

## Output Format

Generate each phase as a complete markdown document with full implementation details.

---

# MASTER PROMPT CONTEXT

[The master prompt PHASE-STUDIO-00-MASTER-PROMPT.md provides additional context about:
- Overall architecture
- Design system
- All previous waves (1-7) that are now complete]
