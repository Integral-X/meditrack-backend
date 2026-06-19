import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { CvStatus } from '@prisma/client';
import { CvService } from '../../../src/modules/cv/cv.service';
import { PrismaService } from '../../../src/config/prisma.service';

describe('CvService', () => {
  let service: CvService;
  let prisma: DeepMockProxy<PrismaService>;

  const userId = '019abc12-3456-7890-abcd-ef0123456789';
  const cvId = '019def12-3456-7890-abcd-ef0123456789';

  const mockCv = {
    id: cvId,
    userId,
    title: 'Test CV',
    slug: 'test-cv',
    status: CvStatus.DRAFT,
    templateId: null,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    personalInfo: null,
    experiences: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: [],
    customSections: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvService,
        { provide: PrismaService, useValue: mockDeep<PrismaService>() },
      ],
    }).compile();

    service = module.get<CvService>(CvService);
    prisma = module.get(PrismaService);
    prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new CV with DRAFT status', async () => {
      prisma.cv.findUnique.mockResolvedValue(null);
      prisma.cv.create.mockResolvedValue(mockCv as any);

      const result = await service.create(userId, { title: 'Test CV' });

      expect(result).toBeDefined();
      expect(prisma.cv.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            title: 'Test CV',
          }),
        }),
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return paginated CVs for a user', async () => {
      prisma.cv.findMany.mockResolvedValue([mockCv] as any);
      prisma.cv.count.mockResolvedValue(1);

      const result = await service.findAllByUser(userId, {
        page: 1,
        limit: 10,
      } as any);

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
      expect(prisma.cv.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a CV if it belongs to the user', async () => {
      prisma.cv.findUnique.mockResolvedValue(mockCv as any);

      const result = await service.findOne(cvId, userId);

      expect(result.id).toBe(cvId);
    });

    it('should throw NotFoundException if CV does not exist', async () => {
      prisma.cv.findUnique.mockResolvedValue(null);

      await expect(service.findOne(cvId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if CV belongs to another user', async () => {
      prisma.cv.findUnique.mockResolvedValue({
        ...mockCv,
        userId: 'another-user-id',
      } as any);

      await expect(service.findOne(cvId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update CV metadata', async () => {
      prisma.cv.findUnique.mockResolvedValue(mockCv as any);
      prisma.cv.update.mockResolvedValue({
        ...mockCv,
        title: 'Updated CV',
      } as any);

      const result = await service.update(cvId, userId, {
        title: 'Updated CV',
      });

      expect(result.title).toBe('Updated CV');
    });

    it('should throw NotFoundException for non-existent CV', async () => {
      prisma.cv.findUnique.mockResolvedValue(null);

      await expect(
        service.update(cvId, userId, { title: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a CV that belongs to the user', async () => {
      prisma.cv.findUnique.mockResolvedValue(mockCv as any);
      prisma.cv.delete.mockResolvedValue(mockCv as any);

      await service.remove(cvId, userId);

      expect(prisma.cv.delete).toHaveBeenCalledWith({
        where: { id: cvId },
      });
    });

    it('should throw ForbiddenException if user does not own the CV', async () => {
      prisma.cv.findUnique.mockResolvedValue({
        ...mockCv,
        userId: 'other-user',
      } as any);

      await expect(service.remove(cvId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateLayout', () => {
    const layoutDto = {
      mainOrder: ['summary', 'experience'],
      sideOrder: ['skills'],
      hidden: ['certifications'],
      titles: { experience: 'Work History' },
    };

    it('should persist the layout blob as-is', async () => {
      prisma.cv.findUnique.mockResolvedValue(mockCv as any);
      prisma.cv.update.mockResolvedValue({
        ...mockCv,
        layout: layoutDto,
      } as any);

      const result = await service.updateLayout(cvId, userId, layoutDto);

      expect(prisma.cv.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: cvId },
          data: { layout: layoutDto },
        }),
      );
      expect((result as any).layout).toEqual(layoutDto);
    });

    it('should throw NotFoundException for a non-existent CV', async () => {
      prisma.cv.findUnique.mockResolvedValue(null);

      await expect(
        service.updateLayout(cvId, userId, layoutDto),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.cv.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if the user does not own the CV', async () => {
      prisma.cv.findUnique.mockResolvedValue({
        ...mockCv,
        userId: 'other-user',
      } as any);

      await expect(
        service.updateLayout(cvId, userId, layoutDto),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.cv.update).not.toHaveBeenCalled();
    });
  });
});
