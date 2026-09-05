import { buildCvHtml } from '@/modules/cv/templates/cv-html-builder';

// buildCvHtml's input type is internal; construct a structurally-complete CV and
// override per-test. Cast is only to satisfy the non-exported interface.
function makeCv(overrides: Record<string, unknown> = {}): any {
  return {
    title: 'My CV',
    templateId: '1',
    personalInfo: {
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
      phone: null,
      location: null,
      website: null,
      linkedinUrl: null,
      summary: 'Pioneering programmer.',
    },
    experiences: [
      {
        company: 'Analytical Engine Co',
        title: 'Engineer',
        location: null,
        startDate: new Date('2020-01-01'),
        endDate: null,
        current: true,
        description: 'Wrote the first algorithm.',
      },
    ],
    education: [
      {
        institution: 'Home Tutoring',
        degree: 'Mathematics',
        field: null,
        startDate: new Date('1830-01-01'),
        endDate: new Date('1835-01-01'),
        gpa: null,
      },
    ],
    skills: [{ name: 'Algorithms', level: 'EXPERT', category: null }],
    certifications: [
      {
        name: 'Certified Visionary',
        issuer: 'Royal Society',
        issueDate: new Date('1843-01-01'),
        expiryDate: null,
        credentialUrl: null,
      },
    ],
    projects: [
      {
        name: 'Note G',
        description: 'Bernoulli numbers.',
        url: null,
        startDate: null,
        endDate: null,
      },
    ],
    languages: [{ name: 'English', proficiency: 'NATIVE' }],
    customSections: [],
    ...overrides,
  };
}

describe('buildCvHtml', () => {
  describe('default render (no layout)', () => {
    it('renders sections in the default fixed order', () => {
      const html = buildCvHtml(makeCv());
      const order = [
        'Experience',
        'Education',
        'Skills',
        'Certifications',
        'Projects',
        'Languages',
      ].map(h => html.indexOf(`<h2>${h}</h2>`));

      expect(order.every(i => i >= 0)).toBe(true);
      const sorted = [...order].sort((a, b) => a - b);
      expect(order).toEqual(sorted);
    });

    it('renders the summary inside the header (headingless)', () => {
      const html = buildCvHtml(makeCv());
      expect(html).toContain(
        '<div class="summary">Pioneering programmer.</div>',
      );
      expect(html).not.toContain('<h2>Summary</h2>');
    });

    it('treats a null layout as no layout', () => {
      const html = buildCvHtml(makeCv({ layout: null }));
      expect(html).toContain('<h2>Experience</h2>');
    });

    it('treats an all-empty layout blob as no layout (default order)', () => {
      const html = buildCvHtml(
        makeCv({
          layout: { mainOrder: [], sideOrder: [], hidden: [], titles: {} },
        }),
      );
      const exp = html.indexOf('<h2>Experience</h2>');
      const edu = html.indexOf('<h2>Education</h2>');
      expect(exp).toBeLessThan(edu);
    });
  });

  describe('layout-driven render', () => {
    it('honours order from flattened main + side', () => {
      const html = buildCvHtml(
        makeCv({
          layout: {
            mainOrder: ['education', 'experience'],
            sideOrder: ['languages', 'skills'],
            hidden: [],
            titles: {},
          },
        }),
      );
      const seq = ['Education', 'Experience', 'Languages', 'Skills'].map(h =>
        html.indexOf(`<h2>${h}</h2>`),
      );
      expect(seq.every(i => i >= 0)).toBe(true);
      expect(seq).toEqual([...seq].sort((a, b) => a - b));
    });

    it('omits hidden sections', () => {
      const html = buildCvHtml(
        makeCv({
          layout: {
            mainOrder: ['experience', 'education'],
            sideOrder: ['skills', 'certifications', 'languages'],
            hidden: ['certifications'],
            titles: {},
          },
        }),
      );
      expect(html).not.toContain('Certified Visionary');
      expect(html).not.toContain('<h2>Certifications</h2>');
      expect(html).toContain('<h2>Experience</h2>');
    });

    it('drops a hidden summary entirely', () => {
      const html = buildCvHtml(
        makeCv({
          layout: {
            mainOrder: ['experience'],
            sideOrder: [],
            hidden: ['summary'],
            titles: {},
          },
        }),
      );
      expect(html).not.toContain('Pioneering programmer.');
    });

    it('applies title overrides to headings', () => {
      const html = buildCvHtml(
        makeCv({
          layout: {
            mainOrder: ['experience'],
            sideOrder: [],
            hidden: [],
            titles: { experience: 'Work History' },
          },
        }),
      );
      expect(html).toContain('<h2>Work History</h2>');
      expect(html).not.toContain('<h2>Experience</h2>');
    });

    it('escapes a malicious title override', () => {
      const html = buildCvHtml(
        makeCv({
          layout: {
            mainOrder: ['experience'],
            sideOrder: [],
            hidden: [],
            titles: { experience: '<script>alert(1)</script>' },
          },
        }),
      );
      expect(html).not.toContain('<script>alert(1)</script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('appends present-but-unlisted sections in default order', () => {
      const html = buildCvHtml(
        makeCv({
          layout: {
            mainOrder: ['skills'],
            sideOrder: [],
            hidden: [],
            titles: {},
          },
        }),
      );
      // skills first (explicitly listed), then the rest by default order.
      expect(html.indexOf('<h2>Skills</h2>')).toBeLessThan(
        html.indexOf('<h2>Experience</h2>'),
      );
      expect(html).toContain('<h2>Languages</h2>');
    });

    it('resolves a duplicate key to its last occurrence', () => {
      const html = buildCvHtml(
        makeCv({
          layout: {
            mainOrder: ['experience', 'skills'],
            sideOrder: ['experience'],
            hidden: [],
            titles: {},
          },
        }),
      );
      // experience appears once, after skills (its last position).
      expect(html.indexOf('<h2>Skills</h2>')).toBeLessThan(
        html.indexOf('<h2>Experience</h2>'),
      );
      expect(html.split('<h2>Experience</h2>').length - 1).toBe(1);
    });

    it('renders a custom section referenced by id, with override title', () => {
      const html = buildCvHtml(
        makeCv({
          customSections: [
            {
              id: 'cs-1',
              title: 'Volunteer Work',
              entries: [{ detail: 'Red Cross' }],
            },
          ],
          layout: {
            mainOrder: ['cs-1', 'experience'],
            sideOrder: [],
            hidden: [],
            titles: { 'cs-1': 'Community' },
          },
        }),
      );
      expect(html).toContain('<h2>Community</h2>');
      expect(html).toContain('Red Cross');
      expect(html.indexOf('<h2>Community</h2>')).toBeLessThan(
        html.indexOf('<h2>Experience</h2>'),
      );
    });
  });
});
