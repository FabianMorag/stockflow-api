// Set env vars BEFORE importing ConfigModule (validation runs at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.PORT = '3000';

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConfigModule } from './config.module';

describe('ConfigModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide ConfigService', () => {
    const configService = module.get(ConfigService);
    expect(configService).toBeDefined();
  });

  it('should expose DATABASE_URL from env', () => {
    const configService = module.get(ConfigService);
    expect(configService.get<string>('DATABASE_URL')).toBe(
      'postgresql://test:test@localhost:5432/test',
    );
  });

  it('should expose PORT as number from env', () => {
    const configService = module.get(ConfigService);
    expect(configService.get<number>('PORT')).toBe(3000);
  });
});
