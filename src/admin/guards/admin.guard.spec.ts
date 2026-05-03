import { Test, TestingModule } from '@nestjs/testing'
import { ForbiddenException } from '@nestjs/common'
import { AdminGuard } from './admin.guard'

function createMockContext(user: Record<string, unknown>) {
  const request = { user }
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }
}

describe('AdminGuard', () => {
  let guard: AdminGuard

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminGuard],
    }).compile()

    guard = module.get<AdminGuard>(AdminGuard)
  })

  describe('canActivate', () => {
    it('should return true when user has ADMIN role', () => {
      const ctx = createMockContext({ sub: 'user-1', role: 'ADMIN' })

      const result = guard.canActivate(ctx as any)

      expect(result).toBe(true)
    })

    it('should throw ForbiddenException when user has TRADER role', () => {
      const ctx = createMockContext({ sub: 'user-1', role: 'TRADER' })

      expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException)
      expect(() => guard.canActivate(ctx as any)).toThrow(
        'Admin access required',
      )
    })

    it('should throw ForbiddenException when user has no role', () => {
      const ctx = createMockContext({ sub: 'user-1' })

      expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException)
    })

    it('should throw ForbiddenException when user is undefined', () => {
      const ctx = createMockContext({})

      expect(() => guard.canActivate(ctx as any)).toThrow(ForbiddenException)
    })
  })
})
