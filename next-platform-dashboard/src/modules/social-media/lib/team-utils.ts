import type { TeamRole } from '../types'

/**
 * Get default permissions for a team role
 */
export function getRoleDefaults(role: TeamRole): Record<string, boolean> {
  switch (role) {
    case 'admin':
      return {
        canManageAccounts: true,
        canConnectAccounts: true,
        canCreatePosts: true,
        canEditAllPosts: true,
        canSchedulePosts: true,
        canPublishPosts: true,
        canApprovePosts: true,
        canDeletePosts: true,
        canViewAnalytics: true,
        canExportData: true,
        canManageInbox: true,
        canRespondInbox: true,
        canManageCampaigns: true,
        canManageTeam: true,
        canUseAiFeatures: true,
      }
    case 'manager':
      return {
        canManageAccounts: false,
        canConnectAccounts: false,
        canCreatePosts: true,
        canEditAllPosts: true,
        canSchedulePosts: true,
        canPublishPosts: true,
        canApprovePosts: true,
        canDeletePosts: true,
        canViewAnalytics: true,
        canExportData: true,
        canManageInbox: true,
        canRespondInbox: true,
        canManageCampaigns: true,
        canManageTeam: false,
        canUseAiFeatures: true,
      }
    case 'publisher':
      return {
        canManageAccounts: false,
        canConnectAccounts: false,
        canCreatePosts: true,
        canEditAllPosts: false,
        canSchedulePosts: true,
        canPublishPosts: true,
        canApprovePosts: false,
        canDeletePosts: false,
        canViewAnalytics: true,
        canExportData: false,
        canManageInbox: false,
        canRespondInbox: true,
        canManageCampaigns: false,
        canManageTeam: false,
        canUseAiFeatures: true,
      }
    case 'creator':
      return {
        canManageAccounts: false,
        canConnectAccounts: false,
        canCreatePosts: true,
        canEditAllPosts: false,
        canSchedulePosts: false,
        canPublishPosts: false,
        canApprovePosts: false,
        canDeletePosts: false,
        canViewAnalytics: true,
        canExportData: false,
        canManageInbox: false,
        canRespondInbox: false,
        canManageCampaigns: false,
        canManageTeam: false,
        canUseAiFeatures: true,
      }
    case 'viewer':
    default:
      return {
        canManageAccounts: false,
        canConnectAccounts: false,
        canCreatePosts: false,
        canEditAllPosts: false,
        canSchedulePosts: false,
        canPublishPosts: false,
        canApprovePosts: false,
        canDeletePosts: false,
        canViewAnalytics: true,
        canExportData: false,
        canManageInbox: false,
        canRespondInbox: false,
        canManageCampaigns: false,
        canManageTeam: false,
        canUseAiFeatures: false,
      }
  }
}
