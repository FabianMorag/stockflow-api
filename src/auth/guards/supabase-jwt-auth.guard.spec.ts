// Set env vars BEFORE importing ConfigModule (validation runs at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5435/test'
process.env.PORT = '3000'

import { Test, TestingModule } from '@nestjs/testing'
import { UnauthorizedException } from '@nestjs/common'
import { SupabaseJwtAuthGuard } from './supabase-jwt-auth.guard'
import { ConfigService } from '@nestjs/config'

function createMockContext(headers: Record<string, string>) {
  const request = { headers, user: undefined as unknown }
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }
}

// Mock jose library (ESM-only)
const mockJwtVerify = jest.fn()
const mockCreateRemoteJWKSet = jest.fn()

jest.mock('jose', () => ({
  jwtVerify: (...args: unknown[]) => mockJwtVerify(...args),
  createRemoteJWKSet: (...args: unknown[]) => mockCreateRemoteJWKSet(...args),
}))

describe('SupabaseJwtAuthGuard', () => {
  let guard: SupabaseJwtAuthGuard

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SUPABASE_URL') return 'https://test.supabase.co'
      if (key === 'SUPABASE_JWT_SECRET') return 'test-secret'
      return undefined
    }),
  }

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseJwtAuthGuard,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile()

    guard = module.get<SupabaseJwtAuthGuard>(SupabaseJwtAuthGuard)
  })

  describe('canActivate', () => {
    it('should throw UnauthorizedException when no authorization header', async () => {
      const ctx = createMockContext({})

      await expect(guard.canActivate(ctx as any)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should throw UnauthorizedException when header does not start with Bearer', async () => {
      const ctx = createMockContext({
        authorization: 'Basic abc123',
      })

      await expect(guard.canActivate(ctx as any)).rejects.toThrow(
        UnauthorizedException,
      )
    })

    it('should return true and attach user when JWT is valid', async () => {
      mockJwtVerify.mockResolvedValue({
        payload: { sub: 'user-123', email: 'test@test.com' },
      })

      const ctx = createMockContext({
        authorization: 'Bearer valid.token.here',
      })

      const result = await guard.canActivate(ctx as any)

      expect(result).toBe(true)
      const request = (ctx as any).switchToHttp().getRequest()
      expect(request.user.sub).toBe('user-123')
    })

    it('should throw UnauthorizedException when JWT verification fails', async () => {
      mockJwtVerify.mockRejectedValue(new Error('invalid token'))

      const ctx = createMockContext({
        authorization: 'Bearer invalid.token.here',
      })

      await expect(guard.canActivate(ctx as any)).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })

  describe('getRequest', () => {
    it('should return the request object', () => {
      const ctx = createMockContext({})

      const result = guard.getRequest(ctx as any)

      expect(result).toHaveProperty('headers')
    })
  })
})
