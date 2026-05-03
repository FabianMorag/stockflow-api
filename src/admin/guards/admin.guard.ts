import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common'
import { JwtUserPayload } from '../../auth/decorators/current-user.decorator'

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const user = request.user as JwtUserPayload | undefined

    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException('Admin access required')
    }

    return true
  }
}
