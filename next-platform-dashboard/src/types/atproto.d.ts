// Ambient type declarations for optional dependencies

declare module '@atproto/api' {
  export class BskyAgent {
    constructor(opts: { service: string })
    login(opts: { identifier: string; password: string }): Promise<{
      data: {
        did: string
        accessJwt: string
        refreshJwt: string
      }
    }>
    getProfile(opts: { actor: string }): Promise<{
      data: {
        displayName?: string
        avatar?: string
      }
    }>
  }
  export const AtpAgent: typeof BskyAgent
}
