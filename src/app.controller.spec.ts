// Set env vars before importing AppModule (ConfigModule validates at import time)
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.PORT = '3000'

import { Test, TestingModule } from '@nestjs/testing'
import { AppController } from './app.controller'
import { AppService } from './app.service'

describe('AppController', () => {
  let appController: AppController

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile()

    appController = app.get<AppController>(AppController)
  })

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!')
    })
  })

  describe('health', () => {
    it('should return health status', () => {
      const result = appController.getHealth()
      expect(result.status).toBe('ok')
      expect(typeof result.timestamp).toBe('string')
    })
  })
})
