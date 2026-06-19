import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/config/prisma.service';
import { generateUuidv7 } from '@/shared/utils/uuid.util';
import { PaginationQueryDto } from '@/shared/dto/pagination-query.dto';
import { PaginatedResponseDto } from '@/shared/dto/paginated-response.dto';
import { generateSlug, ensureUniqueSlug } from './slug.util';
import { CV_INCLUDE_ALL } from './cv.constants';
import { CreateCvRequestDto } from './dto/request/create-cv.request.dto';
import { UpdateCvRequestDto } from './dto/request/update-cv.request.dto';
import { UpsertPersonalInfoRequestDto } from './dto/request/upsert-personal-info.request.dto';
import { UpsertLayoutRequestDto } from './dto/request/upsert-layout.request.dto';
import {
  BulkUpsertExperienceRequestDto,
  BulkUpsertEducationRequestDto,
  BulkUpsertSkillsRequestDto,
  BulkUpsertCertificationsRequestDto,
  BulkUpsertProjectsRequestDto,
  BulkUpsertLanguagesRequestDto,
  BulkUpsertCustomSectionsRequestDto,
} from './dto/request/upsert-sections.request.dto';
import type { PersonalInfo, Prisma } from '@prisma/client';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Helpers ─────────────────────────────────────────────────────────────

  private async findCvOrThrow(cvId: string, userId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: CV_INCLUDE_ALL,
    });

    if (!cv) {
      throw new NotFoundException(`CV with id ${cvId} not found`);
    }

    if (cv.userId !== userId) {
      throw new ForbiddenException('You do not have access to this CV');
    }

    return cv;
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateCvRequestDto) {
    const slug = await ensureUniqueSlug(
      this.prisma,
      userId,
      generateSlug(dto.title),
    );

    const cv = await this.prisma.cv.create({
      data: {
        id: generateUuidv7(),
        userId,
        title: dto.title,
        slug,
        templateId: dto.templateId,
      },
      include: CV_INCLUDE_ALL,
    });

    this.logger.log(`CV created: ${cv.id} for user ${userId}`);
    return cv;
  }

  async findAllByUser(userId: string, pagination: PaginationQueryDto) {
    const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'status'];
    const sortBy =
      pagination.sortBy && allowedSortFields.includes(pagination.sortBy)
        ? pagination.sortBy
        : 'updatedAt';

    const where = { userId };

    const [cvs, total] = await Promise.all([
      this.prisma.cv.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [sortBy]: pagination.sortOrder },
      }),
      this.prisma.cv.count({ where }),
    ]);

    return PaginatedResponseDto.create(
      cvs,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findOne(cvId: string, userId: string) {
    return this.findCvOrThrow(cvId, userId);
  }

  async update(cvId: string, userId: string, dto: UpdateCvRequestDto) {
    await this.findCvOrThrow(cvId, userId);

    const data: Prisma.CvUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title;
      data.slug = await ensureUniqueSlug(
        this.prisma,
        userId,
        generateSlug(dto.title),
        cvId,
      );
    }
    if (dto.templateId !== undefined) data.templateId = dto.templateId;
    if (dto.status !== undefined) data.status = dto.status;

    if (dto.isDefault !== undefined) {
      data.isDefault = dto.isDefault;
    }

    const cv = await this.prisma.$transaction(async tx => {
      if (dto.isDefault) {
        await tx.cv.updateMany({
          where: { userId, isDefault: true, id: { not: cvId } },
          data: { isDefault: false },
        });
      }

      return tx.cv.update({
        where: { id: cvId },
        data,
        include: CV_INCLUDE_ALL,
      });
    });

    this.logger.log(`CV updated: ${cvId}`);
    return cv;
  }

  async remove(cvId: string, userId: string): Promise<void> {
    await this.findCvOrThrow(cvId, userId);
    await this.prisma.cv.delete({ where: { id: cvId } });
    this.logger.log(`CV deleted: ${cvId}`);
  }

  // Full-replace of the section layout blob (reorder / hide / rename headings).
  // Keys stay opaque; the DTO has already validated structure. See
  // prismacv-ui/docs/backend-support-cv-editor.md § "Phase 0 — FROZEN contract".
  async updateLayout(
    cvId: string,
    userId: string,
    dto: UpsertLayoutRequestDto,
  ) {
    await this.findCvOrThrow(cvId, userId);

    const cv = await this.prisma.cv.update({
      where: { id: cvId },
      data: {
        layout: {
          mainOrder: dto.mainOrder,
          sideOrder: dto.sideOrder,
          hidden: dto.hidden,
          titles: dto.titles,
        },
      },
      include: CV_INCLUDE_ALL,
    });

    this.logger.log(`CV layout updated: ${cvId}`);
    return cv;
  }

  async duplicate(cvId: string, userId: string) {
    const source = await this.findCvOrThrow(cvId, userId);
    const newId = generateUuidv7();
    const newTitle = `${source.title} (Copy)`;
    const slug = await ensureUniqueSlug(
      this.prisma,
      userId,
      generateSlug(newTitle),
    );

    const cv = await this.prisma.$transaction(async tx => {
      const created = await tx.cv.create({
        data: {
          id: newId,
          userId,
          title: newTitle,
          slug,
          templateId: source.templateId,
        },
      });

      if (source.personalInfo) {
        await tx.personalInfo.create({
          data: {
            id: generateUuidv7(),
            cvId: newId,
            fullName: source.personalInfo.fullName,
            email: source.personalInfo.email,
            phone: source.personalInfo.phone,
            location: source.personalInfo.location,
            website: source.personalInfo.website,
            linkedinUrl: source.personalInfo.linkedinUrl,
            summary: source.personalInfo.summary,
            avatarUrl: source.personalInfo.avatarUrl,
          },
        });
      }

      if (source.experiences?.length) {
        await tx.experience.createMany({
          data: source.experiences.map(e => ({
            id: generateUuidv7(),
            cvId: newId,
            company: e.company,
            title: e.title,
            location: e.location,
            startDate: e.startDate,
            endDate: e.endDate,
            current: e.current,
            description: e.description,
            sortOrder: e.sortOrder,
          })),
        });
      }

      if (source.education?.length) {
        await tx.education.createMany({
          data: source.education.map(e => ({
            id: generateUuidv7(),
            cvId: newId,
            institution: e.institution,
            degree: e.degree,
            field: e.field,
            startDate: e.startDate,
            endDate: e.endDate,
            gpa: e.gpa,
            description: e.description,
            sortOrder: e.sortOrder,
          })),
        });
      }

      if (source.skills?.length) {
        await tx.skill.createMany({
          data: source.skills.map(s => ({
            id: generateUuidv7(),
            cvId: newId,
            name: s.name,
            level: s.level,
            category: s.category,
            sortOrder: s.sortOrder,
          })),
        });
      }

      if (source.certifications?.length) {
        await tx.certification.createMany({
          data: source.certifications.map(c => ({
            id: generateUuidv7(),
            cvId: newId,
            name: c.name,
            issuer: c.issuer,
            issueDate: c.issueDate,
            expiryDate: c.expiryDate,
            credentialUrl: c.credentialUrl,
            sortOrder: c.sortOrder,
          })),
        });
      }

      if (source.projects?.length) {
        await tx.project.createMany({
          data: source.projects.map(p => ({
            id: generateUuidv7(),
            cvId: newId,
            name: p.name,
            description: p.description,
            url: p.url,
            startDate: p.startDate,
            endDate: p.endDate,
            sortOrder: p.sortOrder,
          })),
        });
      }

      if (source.languages?.length) {
        await tx.language.createMany({
          data: source.languages.map(l => ({
            id: generateUuidv7(),
            cvId: newId,
            name: l.name,
            proficiency: l.proficiency,
            sortOrder: l.sortOrder,
          })),
        });
      }

      if (source.customSections?.length) {
        await tx.customSection.createMany({
          data: source.customSections.map(cs => ({
            id: generateUuidv7(),
            cvId: newId,
            title: cs.title,
            entries: (cs.entries ?? []) as any,
            sortOrder: cs.sortOrder,
          })) as any,
        });
      }

      return tx.cv.findUnique({
        where: { id: created.id },
        include: CV_INCLUDE_ALL,
      });
    });

    this.logger.log(`CV duplicated: ${cvId} -> ${newId}`);
    return cv!;
  }

  // ─── Section Upserts ────────────────────────────────────────────────────

  async upsertPersonalInfo(
    cvId: string,
    userId: string,
    dto: UpsertPersonalInfoRequestDto,
  ): Promise<PersonalInfo> {
    await this.findCvOrThrow(cvId, userId);

    const existing = await this.prisma.personalInfo.findUnique({
      where: { cvId },
    });

    if (existing) {
      return this.prisma.personalInfo.update({
        where: { cvId },
        data: dto,
      });
    }

    return this.prisma.personalInfo.create({
      data: {
        id: generateUuidv7(),
        cvId,
        ...dto,
      },
    });
  }

  async bulkUpsertExperiences(
    cvId: string,
    userId: string,
    dto: BulkUpsertExperienceRequestDto,
  ) {
    await this.findCvOrThrow(cvId, userId);

    return this.prisma.$transaction(async tx => {
      const incomingIds = dto.items
        .filter(item => item.id)
        .map(item => item.id!);

      await tx.experience.deleteMany({
        where: { cvId, id: { notIn: incomingIds } },
      });

      for (const item of dto.items) {
        const data = {
          company: item.company,
          title: item.title,
          location: item.location ?? null,
          startDate: item.startDate,
          endDate: item.endDate ?? null,
          current: item.current ?? false,
          description: item.description ?? null,
          sortOrder: item.sortOrder ?? 0,
        };

        if (item.id) {
          const updated = await tx.experience.updateMany({
            where: { id: item.id, cvId },
            data,
          });
          if (updated.count === 0) {
            throw new BadRequestException(
              `Experience item ${item.id} not found on this CV`,
            );
          }
        } else {
          await tx.experience.create({
            data: { id: generateUuidv7(), cvId, ...data },
          });
        }
      }

      return tx.experience.findMany({
        where: { cvId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async bulkUpsertEducation(
    cvId: string,
    userId: string,
    dto: BulkUpsertEducationRequestDto,
  ) {
    await this.findCvOrThrow(cvId, userId);

    return this.prisma.$transaction(async tx => {
      const incomingIds = dto.items
        .filter(item => item.id)
        .map(item => item.id!);

      await tx.education.deleteMany({
        where: { cvId, id: { notIn: incomingIds } },
      });

      for (const item of dto.items) {
        const data = {
          institution: item.institution,
          degree: item.degree,
          field: item.field ?? null,
          startDate: item.startDate,
          endDate: item.endDate ?? null,
          gpa: item.gpa ?? null,
          description: item.description ?? null,
          sortOrder: item.sortOrder ?? 0,
        };

        if (item.id) {
          const updated = await tx.education.updateMany({
            where: { id: item.id, cvId },
            data,
          });
          if (updated.count === 0) {
            throw new BadRequestException(
              `Education item ${item.id} not found on this CV`,
            );
          }
        } else {
          await tx.education.create({
            data: { id: generateUuidv7(), cvId, ...data },
          });
        }
      }

      return tx.education.findMany({
        where: { cvId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async bulkUpsertSkills(
    cvId: string,
    userId: string,
    dto: BulkUpsertSkillsRequestDto,
  ) {
    await this.findCvOrThrow(cvId, userId);

    return this.prisma.$transaction(async tx => {
      const incomingIds = dto.items
        .filter(item => item.id)
        .map(item => item.id!);

      await tx.skill.deleteMany({
        where: { cvId, id: { notIn: incomingIds } },
      });

      for (const item of dto.items) {
        const data = {
          name: item.name,
          level: item.level ?? ('INTERMEDIATE' as const),
          category: item.category ?? null,
          sortOrder: item.sortOrder ?? 0,
        };

        if (item.id) {
          const updated = await tx.skill.updateMany({
            where: { id: item.id, cvId },
            data,
          });
          if (updated.count === 0) {
            throw new BadRequestException(
              `Skill item ${item.id} not found on this CV`,
            );
          }
        } else {
          await tx.skill.create({
            data: { id: generateUuidv7(), cvId, ...data },
          });
        }
      }

      return tx.skill.findMany({
        where: { cvId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async bulkUpsertCertifications(
    cvId: string,
    userId: string,
    dto: BulkUpsertCertificationsRequestDto,
  ) {
    await this.findCvOrThrow(cvId, userId);

    return this.prisma.$transaction(async tx => {
      const incomingIds = dto.items
        .filter(item => item.id)
        .map(item => item.id!);

      await tx.certification.deleteMany({
        where: { cvId, id: { notIn: incomingIds } },
      });

      for (const item of dto.items) {
        const data = {
          name: item.name,
          issuer: item.issuer ?? null,
          issueDate: item.issueDate ?? null,
          expiryDate: item.expiryDate ?? null,
          credentialUrl: item.credentialUrl ?? null,
          sortOrder: item.sortOrder ?? 0,
        };

        if (item.id) {
          const updated = await tx.certification.updateMany({
            where: { id: item.id, cvId },
            data,
          });
          if (updated.count === 0) {
            throw new BadRequestException(
              `Certification item ${item.id} not found on this CV`,
            );
          }
        } else {
          await tx.certification.create({
            data: { id: generateUuidv7(), cvId, ...data },
          });
        }
      }

      return tx.certification.findMany({
        where: { cvId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async bulkUpsertProjects(
    cvId: string,
    userId: string,
    dto: BulkUpsertProjectsRequestDto,
  ) {
    await this.findCvOrThrow(cvId, userId);

    return this.prisma.$transaction(async tx => {
      const incomingIds = dto.items
        .filter(item => item.id)
        .map(item => item.id!);

      await tx.project.deleteMany({
        where: { cvId, id: { notIn: incomingIds } },
      });

      for (const item of dto.items) {
        const data = {
          name: item.name,
          description: item.description ?? null,
          url: item.url ?? null,
          startDate: item.startDate ?? null,
          endDate: item.endDate ?? null,
          sortOrder: item.sortOrder ?? 0,
        };

        if (item.id) {
          const updated = await tx.project.updateMany({
            where: { id: item.id, cvId },
            data,
          });
          if (updated.count === 0) {
            throw new BadRequestException(
              `Project item ${item.id} not found on this CV`,
            );
          }
        } else {
          await tx.project.create({
            data: { id: generateUuidv7(), cvId, ...data },
          });
        }
      }

      return tx.project.findMany({
        where: { cvId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async bulkUpsertLanguages(
    cvId: string,
    userId: string,
    dto: BulkUpsertLanguagesRequestDto,
  ) {
    await this.findCvOrThrow(cvId, userId);

    return this.prisma.$transaction(async tx => {
      const incomingIds = dto.items
        .filter(item => item.id)
        .map(item => item.id!);

      await tx.language.deleteMany({
        where: { cvId, id: { notIn: incomingIds } },
      });

      for (const item of dto.items) {
        const data = {
          name: item.name,
          proficiency: item.proficiency ?? ('INTERMEDIATE' as const),
          sortOrder: item.sortOrder ?? 0,
        };

        if (item.id) {
          const updated = await tx.language.updateMany({
            where: { id: item.id, cvId },
            data,
          });
          if (updated.count === 0) {
            throw new BadRequestException(
              `Language item ${item.id} not found on this CV`,
            );
          }
        } else {
          await tx.language.create({
            data: { id: generateUuidv7(), cvId, ...data },
          });
        }
      }

      return tx.language.findMany({
        where: { cvId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  async bulkUpsertCustomSections(
    cvId: string,
    userId: string,
    dto: BulkUpsertCustomSectionsRequestDto,
  ) {
    await this.findCvOrThrow(cvId, userId);

    return this.prisma.$transaction(async tx => {
      const incomingIds = dto.items
        .filter(item => item.id)
        .map(item => item.id!);

      await tx.customSection.deleteMany({
        where: { cvId, id: { notIn: incomingIds } },
      });

      for (const item of dto.items) {
        const entries = item.entries as unknown as Prisma.InputJsonValue;
        const data = {
          title: item.title,
          entries,
          sortOrder: item.sortOrder ?? 0,
        };

        if (item.id) {
          const updated = await tx.customSection.updateMany({
            where: { id: item.id, cvId },
            data,
          });
          if (updated.count === 0) {
            throw new BadRequestException(
              `Custom section item ${item.id} not found on this CV`,
            );
          }
        } else {
          await tx.customSection.create({
            data: { id: generateUuidv7(), cvId, ...data },
          });
        }
      }

      return tx.customSection.findMany({
        where: { cvId },
        orderBy: { sortOrder: 'asc' },
      });
    });
  }

  // ─── Sharing ─────────────────────────────────────────────────────────────

  async shareCv(cvId: string, userId: string, isPublic: boolean) {
    await this.findCvOrThrow(cvId, userId);

    const existing = await this.prisma.cvShare.findUnique({
      where: { cvId },
    });

    if (existing) {
      const updated = await this.prisma.cvShare.update({
        where: { cvId },
        data: { isPublic },
      });
      return this.mapShareResponse(updated);
    }

    const shareSlug = `${generateUuidv7().slice(0, 8)}-${Date.now().toString(36)}`;
    const share = await this.prisma.cvShare.create({
      data: {
        id: generateUuidv7(),
        cvId,
        shareSlug,
        isPublic,
      },
    });

    this.logger.log(`CV ${cvId} shared with slug ${shareSlug}`);
    return this.mapShareResponse(share);
  }

  async unshareCv(cvId: string, userId: string) {
    await this.findCvOrThrow(cvId, userId);

    await this.prisma.cvShare.deleteMany({ where: { cvId } });
    this.logger.log(`CV ${cvId} unshared`);
  }

  async getShareInfo(cvId: string, userId: string) {
    await this.findCvOrThrow(cvId, userId);

    const share = await this.prisma.cvShare.findUnique({ where: { cvId } });
    return share ? this.mapShareResponse(share) : null;
  }

  async getPublicCv(shareSlug: string) {
    const share = await this.prisma.cvShare.findUnique({
      where: { shareSlug },
      include: {
        cv: { include: CV_INCLUDE_ALL },
      },
    });

    if (!share || !share.isPublic) {
      throw new NotFoundException('Shared CV not found');
    }

    await this.prisma.cvShare.update({
      where: { shareSlug },
      data: {
        viewCount: { increment: 1 },
        lastViewedAt: new Date(),
      },
    });

    return share.cv;
  }

  private mapShareResponse(share: any) {
    return {
      id: share.id,
      cvId: share.cvId,
      shareSlug: share.shareSlug,
      isPublic: share.isPublic,
      viewCount: share.viewCount,
      downloadCount: share.downloadCount,
      lastViewedAt: share.lastViewedAt?.toISOString() ?? undefined,
      createdAt: share.createdAt.toISOString(),
    };
  }
}
