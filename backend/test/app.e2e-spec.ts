import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/health/live (GET)', () => {
    return request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toEqual('ok');
      });
  });

  // Example placeholder for Auth E2E test.
  // In a real scenario, this would use a seeded test database.
  it('/auth/login (POST) with invalid credentials should return 401', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@invalid.com', password: 'wrongpassword' })
      .expect(401);
  });
});
