import { Injectable } from '@nestjs/common';
import {
  CvResponseDto,
  CvListItemResponseDto,
  PersonalInfoResponseDto,
  ExperienceResponseDto,
  EducationResponseDto,
  SkillResponseDto,
  CertificationResponseDto,
  ProjectResponseDto,
  LanguageResponseDto,
  CustomSectionResponseDto,
  CvLayoutResponseDto,
} from '../dto/response/cv.response.dto';
import type {
  Cv as PrismaCv,
  PersonalInfo as PrismaPersonalInfo,
  Experience as PrismaExperience,
  Education as PrismaEducation,
  Skill as PrismaSkill,
  Certification as PrismaCertification,
  Project as PrismaProject,
  Language as PrismaLanguage,
  CustomSection as PrismaCustomSection,
} from '@prisma/client';

type PrismaCvWithRelations = PrismaCv & {
  personalInfo?: PrismaPersonalInfo | null;
  experiences?: PrismaExperience[];
  education?: PrismaEducation[];
  skills?: PrismaSkill[];
  certifications?: PrismaCertification[];
  projects?: PrismaProject[];
  languages?: PrismaLanguage[];
  customSections?: PrismaCustomSection[];
};

@Injectable()
export class CvMapper {
  cvToResponse(cv: PrismaCvWithRelations): CvResponseDto {
    const dto = new CvResponseDto();
    dto.id = cv.id;
    dto.title = cv.title;
    dto.slug = cv.slug;
    dto.status = cv.status;
    dto.templateId = cv.templateId ?? undefined;
    dto.isDefault = cv.isDefault;
    dto.createdAt = cv.createdAt.toISOString();
    dto.updatedAt = cv.updatedAt.toISOString();
    dto.personalInfo = cv.personalInfo
      ? this.personalInfoToResponse(cv.personalInfo)
      : undefined;
    dto.experiences = (cv.experiences ?? []).map(e =>
      this.experienceToResponse(e),
    );
    dto.education = (cv.education ?? []).map(e => this.educationToResponse(e));
    dto.skills = (cv.skills ?? []).map(s => this.skillToResponse(s));
    dto.certifications = (cv.certifications ?? []).map(c =>
      this.certificationToResponse(c),
    );
    dto.projects = (cv.projects ?? []).map(p => this.projectToResponse(p));
    dto.languages = (cv.languages ?? []).map(l => this.languageToResponse(l));
    dto.customSections = (cv.customSections ?? []).map(cs =>
      this.customSectionToResponse(cs),
    );
    dto.layout = this.layoutToResponse(cv.layout);
    return dto;
  }

  // Layout is stored as opaque JSON; map defensively in case the column was
  // hand-edited or predates the validated write path. `null` / non-object → absent.
  layoutToResponse(
    layout: PrismaCv['layout'],
  ): CvLayoutResponseDto | undefined {
    if (!layout || typeof layout !== 'object' || Array.isArray(layout)) {
      return undefined;
    }
    const raw = layout as Record<string, unknown>;
    const toStringArray = (value: unknown): string[] =>
      Array.isArray(value)
        ? value.filter((v): v is string => typeof v === 'string')
        : [];

    const dto = new CvLayoutResponseDto();
    dto.mainOrder = toStringArray(raw.mainOrder);
    dto.sideOrder = toStringArray(raw.sideOrder);
    dto.hidden = toStringArray(raw.hidden);
    dto.titles =
      raw.titles && typeof raw.titles === 'object' && !Array.isArray(raw.titles)
        ? (raw.titles as Record<string, string>)
        : {};
    return dto;
  }

  cvToListItemResponse(cv: PrismaCv): CvListItemResponseDto {
    const dto = new CvListItemResponseDto();
    dto.id = cv.id;
    dto.title = cv.title;
    dto.slug = cv.slug;
    dto.status = cv.status;
    dto.templateId = cv.templateId ?? undefined;
    dto.isDefault = cv.isDefault;
    dto.createdAt = cv.createdAt.toISOString();
    dto.updatedAt = cv.updatedAt.toISOString();
    return dto;
  }

  personalInfoToResponse(pi: PrismaPersonalInfo): PersonalInfoResponseDto {
    const dto = new PersonalInfoResponseDto();
    dto.id = pi.id;
    dto.fullName = pi.fullName ?? undefined;
    dto.email = pi.email ?? undefined;
    dto.phone = pi.phone ?? undefined;
    dto.location = pi.location ?? undefined;
    dto.website = pi.website ?? undefined;
    dto.linkedinUrl = pi.linkedinUrl ?? undefined;
    dto.summary = pi.summary ?? undefined;
    dto.avatarUrl = pi.avatarUrl ?? undefined;
    return dto;
  }

  experienceToResponse(exp: PrismaExperience): ExperienceResponseDto {
    const dto = new ExperienceResponseDto();
    dto.id = exp.id;
    dto.company = exp.company;
    dto.title = exp.title;
    dto.location = exp.location ?? undefined;
    dto.startDate = exp.startDate.toISOString();
    dto.endDate = exp.endDate?.toISOString();
    dto.current = exp.current;
    dto.description = exp.description ?? undefined;
    dto.sortOrder = exp.sortOrder;
    return dto;
  }

  educationToResponse(edu: PrismaEducation): EducationResponseDto {
    const dto = new EducationResponseDto();
    dto.id = edu.id;
    dto.institution = edu.institution;
    dto.degree = edu.degree;
    dto.field = edu.field ?? undefined;
    dto.startDate = edu.startDate.toISOString();
    dto.endDate = edu.endDate?.toISOString();
    dto.gpa = edu.gpa ?? undefined;
    dto.description = edu.description ?? undefined;
    dto.sortOrder = edu.sortOrder;
    return dto;
  }

  skillToResponse(skill: PrismaSkill): SkillResponseDto {
    const dto = new SkillResponseDto();
    dto.id = skill.id;
    dto.name = skill.name;
    dto.level = skill.level;
    dto.category = skill.category ?? undefined;
    dto.sortOrder = skill.sortOrder;
    return dto;
  }

  certificationToResponse(cert: PrismaCertification): CertificationResponseDto {
    const dto = new CertificationResponseDto();
    dto.id = cert.id;
    dto.name = cert.name;
    dto.issuer = cert.issuer ?? undefined;
    dto.issueDate = cert.issueDate?.toISOString();
    dto.expiryDate = cert.expiryDate?.toISOString();
    dto.credentialUrl = cert.credentialUrl ?? undefined;
    dto.sortOrder = cert.sortOrder;
    return dto;
  }

  projectToResponse(proj: PrismaProject): ProjectResponseDto {
    const dto = new ProjectResponseDto();
    dto.id = proj.id;
    dto.name = proj.name;
    dto.description = proj.description ?? undefined;
    dto.url = proj.url ?? undefined;
    dto.startDate = proj.startDate?.toISOString();
    dto.endDate = proj.endDate?.toISOString();
    dto.sortOrder = proj.sortOrder;
    return dto;
  }

  languageToResponse(lang: PrismaLanguage): LanguageResponseDto {
    const dto = new LanguageResponseDto();
    dto.id = lang.id;
    dto.name = lang.name;
    dto.proficiency = lang.proficiency;
    dto.sortOrder = lang.sortOrder;
    return dto;
  }

  customSectionToResponse(cs: PrismaCustomSection): CustomSectionResponseDto {
    const dto = new CustomSectionResponseDto();
    dto.id = cs.id;
    dto.title = cs.title;
    dto.entries = cs.entries as Record<string, unknown>[];
    dto.sortOrder = cs.sortOrder;
    return dto;
  }
}
