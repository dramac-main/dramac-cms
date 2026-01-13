# Known Issues & Technical Debt

## Current Issues

### Issue 1: Middleware Deprecation Warning
- **Severity**: Low
- **Description**: Next.js 16 deprecates the "middleware" file convention in favor of "proxy"
- **Impact**: Build warning displayed, no functionality impact
- **Planned Fix**: Phase 44 (Production Performance)

### Issue 2: @types/node Outdated
- **Severity**: Low
- **Description**: @types/node is at 20.x while latest is 25.x
- **Impact**: No functionality impact, TypeScript definitions may be slightly behind
- **Planned Fix**: Update during next major upgrade cycle

## Technical Debt

### Debt 1: Unused redirectTo Parameter in LoginForm
- **Type**: Code
- **Description**: The redirectTo prop is accepted but not utilized for post-login redirect
- **Priority**: Low
- **Notes**: May be needed when implementing custom redirect flows

## Resolved Issues

### Resolved 1: ESLint Unused Variable Warnings
- **Resolved In**: Phase 10
- **Solution**: Updated ESLint config to allow underscore-prefixed unused variables (argsIgnorePattern, varsIgnorePattern, caughtErrorsIgnorePattern)
