import { Test, TestingModule } from '@nestjs/testing'
import { ExecutionContext } from '@nestjs/common'
import { MockJwtAuthGuard, MockJwtUser } from './mock-jwt-auth.guard'

function createMockContext(headers: Record<string, string>): ExecutionContext {
  const request: { headers: Record<string, string>; user?: MockJwtUser } = {
    headers,
  }
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext
}

describe('MockJwtAuthGuard', () => {
  let guard: MockJwtAuthGuard

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MockJwtAuthGuard],
    }).compile()

    guard = module.get<MockJwtAuthGuard>(MockJwtAuthGuard)
  })

  describe('canActivate', () => {
    it('should return true for request with valid JWT structure', () => {
      const ctx = createMockContext({
        authorization:
          'Bearer eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEB0ZXN0LmNvbSJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.sig',
      })

      const result = guard.canActivate(ctx)

      expect(result).toBe(true)
    })

    it('should return true even with minimal JWT structure', () => {
      const ctx = createMockContext({
        authorization: 'Bearer minimal.token.here',
      })

      const result = guard.canActivate(ctx)

      expect(result).toBe(true)
    })

    it('should return true when no authorization header present (dev mode)', () => {
      const ctx = createMockContext({})

      const result = guard.canActivate(ctx)

      expect(result).toBe(true)
    })

    it('should attach decoded user payload to request when JWT is present', () => {
      // JWT payload: {"sub":"user-123","email":"test@test.com"}
      const payload = Buffer.from(
        JSON.stringify({ sub: 'user-123', email: 'test@test.com' }),
      ).toString('base64url')
      const token = `header.${payload}.sig`

      const ctx = createMockContext({
        authorization: `Bearer ${token}`,
      })

      guard.canActivate(ctx)
      const request = ctx.switchToHttp().getRequest<{ user?: MockJwtUser }>()

      expect(request.user?.sub).toBe('user-123')
      expect(request.user?.email).toBe('test@test.com')
    })

    it('should attach dev-anonymous user when no auth header', () => {
      const ctx = createMockContext({})

      guard.canActivate(ctx)
      const request = ctx.switchToHttp().getRequest<{ user?: MockJwtUser }>()

      expect(request.user?.sub).toBe('dev-anonymous')
    })
  })

  describe('getRequest', () => {
    it('should return the request object', () => {
      const ctx = createMockContext({})

      const result = guard.getRequest(ctx)

      expect(result).toHaveProperty('headers')
    })
  })
})
