import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── Section Response DTOs ───────────────────────────────────────────────────

export class PersonalInfoResponseDto {
  @ApiProperty() id!: string;
  @ApiPropertyOptional() fullName?: string;
  @ApiPropertyOptional() email?: string;
  @ApiPropertyOptional() phone?: string;
  @ApiPropertyOptional() location?: string;
  @ApiPropertyOptional() website?: string;
  @ApiPropertyOptional() linkedinUrl?: string;
  @ApiPropertyOptional() summary?: string;
  @ApiPropertyOptional() avatarUrl?: string;
}

export class ExperienceResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() company!: string;
  @ApiProperty() title!: string;
  @ApiPropertyOptional() location?: string;
  @ApiProperty() startDate!: string;
  @ApiPropertyOptional() endDate?: string;
  @ApiProperty() current!: boolean;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() sortOrder!: number;
}

export class EducationResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() institution!: string;
  @ApiProperty() degree!: string;
  @ApiPropertyOptional() field?: string;
  @ApiProperty() startDate!: string;
  @ApiPropertyOptional() endDate?: string;
  @ApiPropertyOptional() gpa?: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() sortOrder!: number;
}

export class SkillResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() level!: string;
  @ApiPropertyOptional() category?: string;
  @ApiProperty() sortOrder!: number;
}

export class CertificationResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() issuer?: string;
  @ApiPropertyOptional() issueDate?: string;
  @ApiPropertyOptional() expiryDate?: string;
  @ApiPropertyOptional() credentialUrl?: string;
  @ApiProperty() sortOrder!: number;
}

export class ProjectResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() description?: string;
  @ApiPropertyOptional() url?: string;
  @ApiPropertyOptional() startDate?: string;
  @ApiPropertyOptional() endDate?: string;
  @ApiProperty() sortOrder!: number;
}

export class LanguageResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() proficiency!: string;
  @ApiProperty() sortOrder!: number;
}

export class CustomSectionResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() entries!: Record<string, unknown>[];
  @ApiProperty() sortOrder!: number;
}

export class CvLayoutResponseDto {
  @ApiProperty({
    type: [String],
    example: ['summary', 'experience', 'projects'],
  })
  mainOrder!: string[];
  @ApiProperty({
    type: [String],
    example: ['skills', 'education', 'languages'],
  })
  sideOrder!: string[];
  @ApiProperty({ type: [String], example: ['certifications'] })
  hidden!: string[];
  @ApiProperty({ example: { experience: 'Work History' } })
  titles!: Record<string, string>;
}

// ─── CV Response DTOs ────────────────────────────────────────────────────────

export class CvResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() templateId?: string;
  @ApiProperty() isDefault!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
  @ApiPropertyOptional({ type: PersonalInfoResponseDto })
  personalInfo?: PersonalInfoResponseDto;
  @ApiProperty({ type: [ExperienceResponseDto] })
  experiences!: ExperienceResponseDto[];
  @ApiProperty({ type: [EducationResponseDto] })
  education!: EducationResponseDto[];
  @ApiProperty({ type: [SkillResponseDto] }) skills!: SkillResponseDto[];
  @ApiProperty({ type: [CertificationResponseDto] })
  certifications!: CertificationResponseDto[];
  @ApiProperty({ type: [ProjectResponseDto] }) projects!: ProjectResponseDto[];
  @ApiProperty({ type: [LanguageResponseDto] })
  languages!: LanguageResponseDto[];
  @ApiProperty({ type: [CustomSectionResponseDto] })
  customSections!: CustomSectionResponseDto[];
  @ApiPropertyOptional({ type: CvLayoutResponseDto })
  layout?: CvLayoutResponseDto;
}

export class CvListItemResponseDto {
  @ApiProperty() id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() slug!: string;
  @ApiProperty() status!: string;
  @ApiPropertyOptional() templateId?: string;
  @ApiProperty() isDefault!: boolean;
  @ApiProperty() createdAt!: string;
  @ApiProperty() updatedAt!: string;
}
