import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Request } from 'express'
import { jwtVerify, createRemoteJWKSet } from 'jose'

@Injectable()
export class SupabaseJwtAuthGuard implements CanActivate {
  private jwkSet: ReturnType<typeof createRemoteJWKSet> | null = null

  constructor(private configService: ConfigService) {}

  private getJwkSet() {
    if (!this.jwkSet) {
      const supabaseUrl = this.configService.get<string>('SUPABASE_URL')
      if (!supabaseUrl) {
        throw new Error('SUPABASE_URL is required for JWT validation')
      }
      this.jwkSet = createRemoteJWKSet(
        new URL(`${supabaseUrl}/.well-known/jwks.json`),
      )
    }
    return this.jwkSet
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: Record<string, unknown> }>()
    const authHeader = request.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header')
    }

    const token = authHeader.split(' ')[1]

    try {
      const { payload } = await jwtVerify(token, this.getJwkSet())
      request.user = payload
      return true
    } catch {
      throw new UnauthorizedException('Invalid or expired token')
    }
  }

  getRequest(
    context: ExecutionContext,
  ): Request & { user?: Record<string, unknown> } {
    return context.switchToHttp().getRequest()
  }
}
