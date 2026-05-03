import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Request } from 'express'

export interface MockJwtUser {
  sub: string
  email?: string
  role?: string
  [key: string]: unknown
}

@Injectable()
export class MockJwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: MockJwtUser }>()
    const authHeader = request.headers.authorization

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      try {
        const payload = JSON.parse(
          Buffer.from(token.split('.')[1], 'base64url').toString(),
        ) as MockJwtUser
        request.user = payload
      } catch {
        request.user = { sub: 'dev-anonymous' }
      }
    } else {
      request.user = { sub: 'dev-anonymous' }
    }

    return true
  }

  getRequest(context: ExecutionContext): Request & { user?: MockJwtUser } {
    return context.switchToHttp().getRequest()
  }
}
