import { Module } from '@nestjs/common'
import { ConfigModule } from '#config/config.module'
import { MockJwtAuthGuard } from './guards/mock-jwt-auth.guard'
import { SupabaseJwtAuthGuard } from './guards/supabase-jwt-auth.guard'

@Module({
  imports: [ConfigModule],
  providers: [MockJwtAuthGuard, SupabaseJwtAuthGuard],
  exports: [MockJwtAuthGuard, SupabaseJwtAuthGuard],
})
export class AuthModule {}
