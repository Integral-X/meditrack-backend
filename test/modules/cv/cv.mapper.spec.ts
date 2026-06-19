import { CvMapper } from '../../../src/modules/cv/mappers/cv.mapper';
import { CvStatus, SkillLevel, LanguageProficiency } from '@prisma/client';

describe('CvMapper', () => {
  let mapper: CvMapper;

  const now = new Date();

  const mockFullCv = {
    id: 'cv-1',
    userId: 'user-1',
    title: 'My CV',
    slug: 'my-cv',
    status: CvStatus.DRAFT,
    templateId: 'classic',
    isDefault: false,
    createdAt: now,
    updatedAt: now,
    personalInfo: {
      id: 'pi-1',
      cvId: 'cv-1',
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+1234567890',
      location: 'Berlin',
      website: 'https://jane.dev',
      linkedinUrl: 'https://linkedin.com/in/jane',
      summary: 'Full-stack developer',
      avatarUrl: null,
    },
    experiences: [
      {
        id: 'exp-1',
        cvId: 'cv-1',
        company: 'Acme',
        title: 'Engineer',
        location: 'Remote',
        startDate: now,
        endDate: null,
        current: true,
        description: 'Building things',
        sortOrder: 0,
      },
    ],
    education: [
      {
        id: 'edu-1',
        cvId: 'cv-1',
        institution: 'MIT',
        degree: 'BSc',
        field: 'CS',
        startDate: now,
        endDate: now,
        gpa: '3.9',
        description: null,
        sortOrder: 0,
      },
    ],
    skills: [
      {
        id: 'sk-1',
        cvId: 'cv-1',
        name: 'TypeScript',
        level: SkillLevel.EXPERT,
        category: 'Programming',
        sortOrder: 0,
      },
    ],
    certifications: [],
    projects: [],
    languages: [
      {
        id: 'lang-1',
        cvId: 'cv-1',
        name: 'English',
        proficiency: LanguageProficiency.NATIVE,
        sortOrder: 0,
      },
    ],
    customSections: [],
  };

  beforeEach(() => {
    mapper = new CvMapper();
  });

  it('should be defined', () => {
    expect(mapper).toBeDefined();
  });

  describe('cvToResponse', () => {
    it('should map a full CV to response DTO', () => {
      const result = mapper.cvToResponse(mockFullCv as any);

      expect(result.id).toBe('cv-1');
      expect(result.title).toBe('My CV');
      expect(result.status).toBe('DRAFT');
      expect(result.personalInfo).toBeDefined();
      expect(result.personalInfo!.fullName).toBe('Jane Doe');
      expect(result.experiences).toHaveLength(1);
      expect(result.experiences[0].company).toBe('Acme');
      expect(result.education).toHaveLength(1);
      expect(result.skills).toHaveLength(1);
      expect(result.languages).toHaveLength(1);
    });

    it('should handle CV with no personal info', () => {
      const cv = { ...mockFullCv, personalInfo: null };
      const result = mapper.cvToResponse(cv as any);

      expect(result.personalInfo).toBeFalsy();
    });

    it('should include the layout when present', () => {
      const layout = {
        mainOrder: ['summary', 'experience'],
        sideOrder: ['skills'],
        hidden: ['certifications'],
        titles: { experience: 'Work History' },
      };
      const result = mapper.cvToResponse({ ...mockFullCv, layout } as any);

      expect(result.layout).toEqual(layout);
    });

    it('should omit layout when the column is null', () => {
      const result = mapper.cvToResponse({
        ...mockFullCv,
        layout: null,
      } as any);

      expect(result.layout).toBeUndefined();
    });
  });

  describe('layoutToResponse', () => {
    it('maps a stored blob into the layout DTO', () => {
      const result = mapper.layoutToResponse({
        mainOrder: ['summary'],
        sideOrder: ['skills'],
        hidden: [],
        titles: { skills: 'Toolbox' },
      } as any);

      expect(result).toEqual({
        mainOrder: ['summary'],
        sideOrder: ['skills'],
        hidden: [],
        titles: { skills: 'Toolbox' },
      });
    });

    it('returns undefined for null or a non-object', () => {
      expect(mapper.layoutToResponse(null)).toBeUndefined();
      expect(mapper.layoutToResponse([] as any)).toBeUndefined();
      expect(mapper.layoutToResponse('nope' as any)).toBeUndefined();
    });

    it('coerces malformed fields defensively', () => {
      const result = mapper.layoutToResponse({
        mainOrder: ['ok', 42, null],
        sideOrder: 'not-an-array',
        titles: ['not-an-object'],
      } as any);

      expect(result).toEqual({
        mainOrder: ['ok'],
        sideOrder: [],
        hidden: [],
        titles: {},
      });
    });
  });

  describe('cvToListItemResponse', () => {
    it('should map CV to list item DTO (metadata only)', () => {
      const result = mapper.cvToListItemResponse(mockFullCv as any);

      expect(result.id).toBe('cv-1');
      expect(result.title).toBe('My CV');
      expect(result.status).toBe('DRAFT');
      // list item should not have section details
      expect((result as any).experiences).toBeUndefined();
    });
  });
});
