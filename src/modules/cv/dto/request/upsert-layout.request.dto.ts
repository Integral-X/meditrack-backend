import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsString,
  IsNotEmpty,
  MaxLength,
  ArrayMaxSize,
  IsObject,
  Validate,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

// Section keys are opaque strings (built-in section keys + custom-section ids),
// so the layout is validated structurally only — never against a section enum.
// See prismacv-ui/docs/backend-support-cv-editor.md § "Phase 0 — FROZEN contract".

const MAX_KEYS = 50;
const MAX_KEY_LENGTH = 100;
const MAX_TITLE_LENGTH = 120;

@ValidatorConstraint({ name: 'sectionTitleMap', async: false })
class SectionTitleMapConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > MAX_KEYS) return false;
    return entries.every(
      ([, title]) =>
        typeof title === 'string' && title.length <= MAX_TITLE_LENGTH,
    );
  }

  defaultMessage(): string {
    return `titles must be an object of at most ${MAX_KEYS} string values, each ≤ ${MAX_TITLE_LENGTH} characters`;
  }
}

export class UpsertLayoutRequestDto {
  @ApiProperty({
    type: [String],
    example: ['summary', 'experience', 'projects'],
    description: 'Ordered section keys rendered in the main column',
  })
  @IsArray()
  @ArrayMaxSize(MAX_KEYS)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(MAX_KEY_LENGTH, { each: true })
  mainOrder!: string[];

  @ApiProperty({
    type: [String],
    example: ['skills', 'education', 'certifications', 'languages'],
    description: 'Ordered section keys rendered in the side column',
  })
  @IsArray()
  @ArrayMaxSize(MAX_KEYS)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(MAX_KEY_LENGTH, { each: true })
  sideOrder!: string[];

  @ApiProperty({
    type: [String],
    example: ['certifications'],
    description: 'Section keys excluded from the rendered document',
  })
  @IsArray()
  @ArrayMaxSize(MAX_KEYS)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(MAX_KEY_LENGTH, { each: true })
  hidden!: string[];

  @ApiProperty({
    example: { experience: 'Work History' },
    description:
      'Per-section heading overrides (key → title); send {} when none',
  })
  @IsObject()
  @Validate(SectionTitleMapConstraint)
  titles!: Record<string, string>;
}
