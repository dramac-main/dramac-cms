/**
 * CRM Module Context Provider
 * 
 * Phase EM-50: CRM Module - Enterprise Ready
 * 
 * Provides CRM state management and actions to all child components
 */
'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { 
  getContacts, getCompanies, getDeals, getPipelines, getStages, getActivities, getTags,
  createContact, updateContact, deleteContact,
  createCompany, updateCompany, deleteCompany,
  createDeal, updateDeal, deleteDeal, moveDealToStage,
  createActivity, updateActivity, deleteActivity,
  createPipeline, updatePipeline,
  createPipelineStage, updatePipelineStage,
  createTag, deleteTag,
  globalSearch,
  initializeCRMForSite
} from '../actions/crm-actions'
import type { 
  Contact, ContactInput, ContactUpdate,
  Company, CompanyInput, CompanyUpdate,
  Deal, DealInput, DealUpdate,
  Pipeline, PipelineInput, PipelineUpdate,
  PipelineStage, PipelineStageInput, PipelineStageUpdate,
  Activity, ActivityInput, ActivityUpdate,
  Tag, TagInput,
  CRMSettings,
  CRMSearchResult
} from '../types/crm-types'

// ============================================================================
// CONTEXT TYPE
// ============================================================================

interface CRMContextType {
  // Data
  contacts: Contact[]
  companies: Company[]
  deals: Deal[]
  pipelines: Pipeline[]
  stages: PipelineStage[]
  activities: Activity[]
  tags: Tag[]
  
  // State
  isLoading: boolean
  error: string | null
  isInitialized: boolean
  
  // Contact actions
  addContact: (data: Partial<ContactInput>) => Promise<Contact>
  editContact: (id: string, data: ContactUpdate) => Promise<Contact>
  removeContact: (id: string) => Promise<void>
  
  // Company actions
  addCompany: (data: Partial<CompanyInput>) => Promise<Company>
  editCompany: (id: string, data: CompanyUpdate) => Promise<Company>
  removeCompany: (id: string) => Promise<void>
  
  // Deal actions
  addDeal: (data: Partial<DealInput>) => Promise<Deal>
  editDeal: (id: string, data: DealUpdate) => Promise<Deal>
  removeDeal: (id: string) => Promise<void>
  moveDeal: (dealId: string, newStageId: string) => Promise<Deal>
  
  // Activity actions
  addActivity: (data: Partial<ActivityInput>) => Promise<Activity>
  editActivity: (id: string, data: ActivityUpdate) => Promise<Activity>
  removeActivity: (id: string) => Promise<void>
  
  // Pipeline actions
  addPipeline: (data: Partial<PipelineInput>) => Promise<Pipeline>
  editPipeline: (id: string, data: PipelineUpdate) => Promise<Pipeline>
  addStage: (pipelineId: string, data: Partial<PipelineStageInput>) => Promise<PipelineStage>
  editStage: (id: string, data: PipelineStageUpdate) => Promise<PipelineStage>
  getStages: (pipelineId: string) => Promise<PipelineStage[]>
  
  // Tag actions
  addTag: (data: Partial<TagInput>) => Promise<Tag>
  removeTag: (id: string) => Promise<void>
  
  // Search
  search: (query: string) => Promise<CRMSearchResult>
  
  // Refresh
  refresh: () => Promise<void>
  refreshContacts: () => Promise<void>
  refreshCompanies: () => Promise<void>
  refreshDeals: () => Promise<void>
  refreshActivities: () => Promise<void>
  
  // Settings
  settings: CRMSettings
  siteId: string
}

// ============================================================================
// CONTEXT
// ============================================================================

const CRMContext = createContext<CRMContextType | null>(null)

export function useCRM() {
  const context = useContext(CRMContext)
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider')
  }
  return context
}

// ============================================================================
// PROVIDER PROPS
// ============================================================================

interface CRMProviderProps {
  children: ReactNode
  siteId: string
  settings?: CRMSettings
}

// ============================================================================
// PROVIDER
// ============================================================================

export function CRMProvider({ children, siteId, settings = {} }: CRMProviderProps) {
  // Data state
  const [contacts, setContacts] = useState<Contact[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  
  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const refreshContacts = useCallback(async () => {
    try {
      const data = await getContacts(siteId)
      setContacts(data)
    } catch (err: unknown) {
      console.error('Error fetching contacts:', err)
    }
  }, [siteId])

  const refreshCompanies = useCallback(async () => {
    try {
      const data = await getCompanies(siteId)
      setCompanies(data)
    } catch (err: unknown) {
      console.error('Error fetching companies:', err)
    }
  }, [siteId])

  const refreshDeals = useCallback(async () => {
    try {
      const data = await getDeals(siteId)
      setDeals(data)
    } catch (err: unknown) {
      console.error('Error fetching deals:', err)
    }
  }, [siteId])

  const refreshPipelines = useCallback(async () => {
    try {
      const [pipelinesData, stagesData] = await Promise.all([
        getPipelines(siteId),
        getStages(siteId)
      ])
      setPipelines(pipelinesData)
      setStages(stagesData)
    } catch (err: unknown) {
      console.error('Error fetching pipelines:', err)
    }
  }, [siteId])

  const refreshActivities = useCallback(async () => {
    try {
      const data = await getActivities(siteId)
      setActivities(data)
    } catch (err: unknown) {
      console.error('Error fetching activities:', err)
    }
  }, [siteId])

  const refreshTags = useCallback(async () => {
    try {
      const data = await getTags(siteId)
      setTags(data)
    } catch (err: unknown) {
      console.error('Error fetching tags:', err)
    }
  }, [siteId])

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        refreshContacts(),
        refreshCompanies(),
        refreshDeals(),
        refreshPipelines(),
        refreshActivities(),
        refreshTags()
      ])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load CRM data'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [refreshContacts, refreshCompanies, refreshDeals, refreshPipelines, refreshActivities, refreshTags])

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useEffect(() => {
    async function initialize() {
      setIsLoading(true)
      setError(null)
      
      try {
        // Initialize CRM for site (creates default pipeline if needed)
        const result = await initializeCRMForSite(siteId)
        if (!result.success) {
          console.warn('CRM initialization warning:', result.error)
        }
        
        // Load all data
        await refresh()
        setIsInitialized(true)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to initialize CRM'
        setError(message)
        console.error('CRM initialization error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [siteId, refresh])

  // ============================================================================
  // CONTACT ACTIONS
  // ============================================================================

  const addContact = useCallback(async (data: Partial<ContactInput>): Promise<Contact> => {
    const contact = await createContact(siteId, data)
    setContacts(prev => [contact, ...prev])
    return contact
  }, [siteId])

  const editContact = useCallback(async (id: string, data: ContactUpdate): Promise<Contact> => {
    const contact = await updateContact(siteId, id, data)
    setContacts(prev => prev.map(c => c.id === id ? contact : c))
    return contact
  }, [siteId])

  const removeContact = useCallback(async (id: string): Promise<void> => {
    await deleteContact(siteId, id)
    setContacts(prev => prev.filter(c => c.id !== id))
  }, [siteId])

  // ============================================================================
  // COMPANY ACTIONS
  // ============================================================================

  const addCompany = useCallback(async (data: Partial<CompanyInput>): Promise<Company> => {
    const company = await createCompany(siteId, data)
    setCompanies(prev => [company, ...prev])
    return company
  }, [siteId])

  const editCompany = useCallback(async (id: string, data: CompanyUpdate): Promise<Company> => {
    const company = await updateCompany(siteId, id, data)
    setCompanies(prev => prev.map(c => c.id === id ? company : c))
    return company
  }, [siteId])

  const removeCompany = useCallback(async (id: string): Promise<void> => {
    await deleteCompany(siteId, id)
    setCompanies(prev => prev.filter(c => c.id !== id))
  }, [siteId])

  // ============================================================================
  // DEAL ACTIONS
  // ============================================================================

  const addDeal = useCallback(async (data: Partial<DealInput>): Promise<Deal> => {
    const deal = await createDeal(siteId, data)
    setDeals(prev => [deal, ...prev])
    return deal
  }, [siteId])

  const editDeal = useCallback(async (id: string, data: DealUpdate): Promise<Deal> => {
    const deal = await updateDeal(siteId, id, data)
    setDeals(prev => prev.map(d => d.id === id ? deal : d))
    return deal
  }, [siteId])

  const removeDeal = useCallback(async (id: string): Promise<void> => {
    await deleteDeal(siteId, id)
    setDeals(prev => prev.filter(d => d.id !== id))
  }, [siteId])

  const moveDeal = useCallback(async (dealId: string, newStageId: string): Promise<Deal> => {
    const deal = await moveDealToStage(siteId, dealId, newStageId)
    setDeals(prev => prev.map(d => d.id === dealId ? deal : d))
    return deal
  }, [siteId])

  // ============================================================================
  // ACTIVITY ACTIONS
  // ============================================================================

  const addActivity = useCallback(async (data: Partial<ActivityInput>): Promise<Activity> => {
    const activity = await createActivity(siteId, data)
    setActivities(prev => [activity, ...prev])
    return activity
  }, [siteId])

  const editActivity = useCallback(async (id: string, data: ActivityUpdate): Promise<Activity> => {
    const activity = await updateActivity(siteId, id, data)
    setActivities(prev => prev.map(a => a.id === id ? activity : a))
    return activity
  }, [siteId])

  const removeActivity = useCallback(async (id: string): Promise<void> => {
    await deleteActivity(siteId, id)
    setActivities(prev => prev.filter(a => a.id !== id))
  }, [siteId])

  // ============================================================================
  // PIPELINE ACTIONS
  // ============================================================================

  const addPipeline = useCallback(async (data: Partial<PipelineInput>): Promise<Pipeline> => {
    const pipeline = await createPipeline(siteId, data)
    setPipelines(prev => [...prev, pipeline])
    // Refresh stages since default stages were created
    await refreshPipelines()
    return pipeline
  }, [siteId, refreshPipelines])

  const editPipeline = useCallback(async (id: string, data: PipelineUpdate): Promise<Pipeline> => {
    const pipeline = await updatePipeline(siteId, id, data)
    setPipelines(prev => prev.map(p => p.id === id ? pipeline : p))
    return pipeline
  }, [siteId])

  const addStage = useCallback(async (pipelineId: string, data: Partial<PipelineStageInput>): Promise<PipelineStage> => {
    const stage = await createPipelineStage(siteId, pipelineId, data)
    setStages(prev => [...prev, stage])
    return stage
  }, [siteId])

  const editStage = useCallback(async (id: string, data: PipelineStageUpdate): Promise<PipelineStage> => {
    const stage = await updatePipelineStage(siteId, id, data)
    setStages(prev => prev.map(s => s.id === id ? stage : s))
    return stage
  }, [siteId])

  const getStagesForPipeline = useCallback(async (pipelineId: string): Promise<PipelineStage[]> => {
    // Return stages from state filtered by pipeline ID
    // This avoids a server call since we already have stages loaded
    return stages.filter(s => s.pipeline_id === pipelineId).sort((a, b) => a.position - b.position)
  }, [stages])

  // ============================================================================
  // TAG ACTIONS
  // ============================================================================

  const addTag = useCallback(async (data: Partial<TagInput>): Promise<Tag> => {
    const tag = await createTag(siteId, data)
    setTags(prev => [...prev, tag])
    return tag
  }, [siteId])

  const removeTag = useCallback(async (id: string): Promise<void> => {
    await deleteTag(siteId, id)
    setTags(prev => prev.filter(t => t.id !== id))
  }, [siteId])

  // ============================================================================
  // SEARCH
  // ============================================================================

  const search = useCallback(async (query: string): Promise<CRMSearchResult> => {
    return globalSearch(siteId, query)
  }, [siteId])

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: CRMContextType = {
    // Data
    contacts,
    companies,
    deals,
    pipelines,
    stages,
    activities,
    tags,
    
    // State
    isLoading,
    error,
    isInitialized,
    
    // Contact actions
    addContact,
    editContact,
    removeContact,
    
    // Company actions
    addCompany,
    editCompany,
    removeCompany,
    
    // Deal actions
    addDeal,
    editDeal,
    removeDeal,
    moveDeal,
    
    // Activity actions
    addActivity,
    editActivity,
    removeActivity,
    
    // Pipeline actions
    addPipeline,
    editPipeline,
    addStage,
    editStage,
    getStages: getStagesForPipeline,
    
    // Tag actions
    addTag,
    removeTag,
    
    // Search
    search,
    
    // Refresh
    refresh,
    refreshContacts,
    refreshCompanies,
    refreshDeals,
    refreshActivities,
    
    // Settings
    settings,
    siteId
  }

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  )
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to get a specific contact by ID
 */
export function useContact(contactId: string | null) {
  const { contacts, isLoading } = useCRM()
  const contact = contactId ? contacts.find(c => c.id === contactId) : null
  return { contact, isLoading }
}

/**
 * Hook to get a specific company by ID
 */
export function useCompany(companyId: string | null) {
  const { companies, isLoading } = useCRM()
  const company = companyId ? companies.find(c => c.id === companyId) : null
  return { company, isLoading }
}

/**
 * Hook to get a specific deal by ID
 */
export function useDeal(dealId: string | null) {
  const { deals, isLoading } = useCRM()
  const deal = dealId ? deals.find(d => d.id === dealId) : null
  return { deal, isLoading }
}

/**
 * Hook to get deals for a specific pipeline
 */
export function usePipelineDeals(pipelineId: string | null) {
  const { deals, stages, isLoading } = useCRM()
  
  const pipelineStages = pipelineId 
    ? stages.filter(s => s.pipeline_id === pipelineId).sort((a, b) => a.position - b.position)
    : []
  
  const pipelineDeals = pipelineId
    ? deals.filter(d => d.pipeline_id === pipelineId && d.status === 'open')
    : []
  
  const dealsByStage = new Map<string, Deal[]>()
  pipelineStages.forEach(s => dealsByStage.set(s.id, []))
  pipelineDeals.forEach(d => {
    if (d.stage_id && dealsByStage.has(d.stage_id)) {
      dealsByStage.get(d.stage_id)!.push(d)
    }
  })
  
  return { pipelineStages, pipelineDeals, dealsByStage, isLoading }
}

/**
 * Hook to get activities for a specific contact
 */
export function useContactActivities(contactId: string | null) {
  const { activities, isLoading } = useCRM()
  const contactActivities = contactId 
    ? activities.filter(a => a.contact_id === contactId)
    : []
  return { activities: contactActivities, isLoading }
}

/**
 * Hook to get activities for a specific deal
 */
export function useDealActivities(dealId: string | null) {
  const { activities, isLoading } = useCRM()
  const dealActivities = dealId 
    ? activities.filter(a => a.deal_id === dealId)
    : []
  return { activities: dealActivities, isLoading }
}
