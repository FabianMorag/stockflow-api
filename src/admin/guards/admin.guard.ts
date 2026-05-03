import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { JwtUserPayload } from '#auth/decorators/current-user.decorator'

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: JwtUserPayload }>()
    const user = request.user

    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required')
    }

    return true
  }
}
