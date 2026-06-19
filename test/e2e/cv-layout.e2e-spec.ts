import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../../src/app.module';
import { JwtUserAuthGuard } from '@/modules/auth/guards/jwt-user-auth.guard';
import { RequiresPlanGuard } from '@/modules/billing/requires-plan.guard';
import { CvService } from '@/modules/cv/cv.service';
import { PrismaService } from '@/config/prisma.service';

// HTTP-level integration for PUT /cv/:id/layout. The service is mocked (no DB);
// the real CvMapper + global ValidationPipe run, so this proves the route wiring,
// the layout round-trip, and request validation at the boundary.
describe('CV section layout (e2e)', () => {
  let app: INestApplication;
  let cvService: { updateLayout: jest.Mock };

  const mockUser = {
    id: 'user-layout-e2e',
    email: 'layout@example.com',
    role: 'REGULAR',
    isMasterAdmin: false,
  };

  const cvId = '22222222-2222-2222-2222-222222222222';

  const layout = {
    mainOrder: ['summary', 'experience'],
    sideOrder: ['skills'],
    hidden: ['certifications'],
    titles: { experience: 'Work History' },
  };

  beforeAll(async () => {
    cvService = {
      updateLayout: jest.fn().mockResolvedValue({ id: cvId, layout }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtUserAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockUser;
          return true;
        },
      })
      .overrideGuard(RequiresPlanGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(CvService)
      .useValue(cvService)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('PUT /cv/:id/layout persists and returns the layout blob', async () => {
    const response = await request(app.getHttpServer())
      .put(`/cv/${cvId}/layout`)
      .send(layout)
      .expect(200);

    expect(cvService.updateLayout).toHaveBeenCalledWith(
      cvId,
      mockUser.id,
      expect.objectContaining({ mainOrder: ['summary', 'experience'] }),
    );
    expect(response.body).toEqual(layout);
  });

  it('rejects a malformed layout body with 400', async () => {
    await request(app.getHttpServer())
      .put(`/cv/${cvId}/layout`)
      .send({
        mainOrder: 'not-an-array',
        sideOrder: [],
        hidden: [],
        titles: {},
      })
      .expect(400);

    expect(cvService.updateLayout).not.toHaveBeenCalledWith(
      cvId,
      mockUser.id,
      expect.objectContaining({ mainOrder: 'not-an-array' }),
    );
  });

  it('rejects an invalid CV id with 400', async () => {
    await request(app.getHttpServer())
      .put('/cv/not-a-uuid/layout')
      .send(layout)
      .expect(400);
  });
});
