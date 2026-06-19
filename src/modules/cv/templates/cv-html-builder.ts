/**
 * Builds an HTML document from CV data for PDF rendering via Puppeteer.
 * Each template ID gets a slightly different visual layout.
 *
 * Section layout: when the CV has a `layout` blob (see
 * prismacv-ui/docs/backend-support-cv-editor.md § "Phase 0 — FROZEN contract"),
 * the renderer honours it — hidden sections are dropped, headings are renamed,
 * and sections render in the flattened `[...mainOrder, ...sideOrder]` order. The
 * render stays single-column (two-column parity is a separate template redesign).
 * When `layout` is absent the default fixed order is used, byte-for-byte unchanged.
 */

interface SectionLayoutData {
  mainOrder: string[];
  sideOrder: string[];
  hidden: string[];
  titles: Record<string, string>;
}

interface CvPdfData {
  title: string;
  templateId: string | null;
  personalInfo: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    location: string | null;
    website: string | null;
    linkedinUrl: string | null;
    summary: string | null;
  } | null;
  experiences: {
    company: string;
    title: string;
    location: string | null;
    startDate: Date;
    endDate: Date | null;
    current: boolean;
    description: string | null;
  }[];
  education: {
    institution: string;
    degree: string;
    field: string | null;
    startDate: Date;
    endDate: Date | null;
    gpa: string | null;
  }[];
  skills: {
    name: string;
    level: string;
    category: string | null;
  }[];
  certifications: {
    name: string;
    issuer: string | null;
    issueDate: Date | null;
    expiryDate: Date | null;
    credentialUrl: string | null;
  }[];
  projects: {
    name: string;
    description: string | null;
    url: string | null;
    startDate: Date | null;
    endDate: Date | null;
  }[];
  languages: {
    name: string;
    proficiency: string;
  }[];
  customSections: {
    id: string;
    title: string;
    entries: unknown;
  }[];
  layout?: unknown;
}

function esc(val: string | null | undefined): string {
  if (!val) return '';
  return val
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function dateRange(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  current?: boolean,
): string {
  const s = fmtDate(start);
  const e = current ? 'Present' : fmtDate(end);
  if (!s && !e) return '';
  return `${s} – ${e}`;
}

export function buildCvHtml(cv: CvPdfData): string {
  const pi = cv.personalInfo;
  const accentColor = getAccentColor(cv.templateId);
  const layout = normalizeLayout(cv.layout);
  const body = layout
    ? buildOrderedSections(cv, layout)
    : buildDefaultSections(cv);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 10pt; line-height: 1.45; color: #222; }
  h1 { font-size: 22pt; color: ${accentColor}; margin-bottom: 2pt; }
  h2 { font-size: 12pt; color: ${accentColor}; border-bottom: 1.5px solid ${accentColor}; padding-bottom: 3pt; margin: 14pt 0 8pt; text-transform: uppercase; letter-spacing: 0.5pt; }
  h3 { font-size: 10.5pt; font-weight: 600; margin-bottom: 1pt; }
  .contact { font-size: 9pt; color: #555; margin-bottom: 4pt; }
  .contact span { margin-right: 10pt; }
  .summary { font-size: 10pt; color: #333; margin: 8pt 0 4pt; }
  .entry { margin-bottom: 10pt; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; }
  .entry-header .right { font-size: 9pt; color: #666; white-space: nowrap; }
  .entry-sub { font-size: 9pt; color: #555; margin-bottom: 2pt; }
  .entry-desc { font-size: 9.5pt; color: #333; }
  .skills-grid { display: flex; flex-wrap: wrap; gap: 4pt 16pt; }
  .skill-item { font-size: 9.5pt; }
  .skill-level { color: #888; font-size: 8.5pt; }
  .lang-item { display: inline-block; margin-right: 18pt; font-size: 9.5pt; }
  .lang-prof { color: #888; font-size: 8.5pt; }
  .custom-entries { font-size: 9.5pt; color: #333; }
  a { color: ${accentColor}; text-decoration: none; }
</style>
</head>
<body>
${buildHeader(pi, !layout)}
${body}
</body>
</html>`;
}

function getAccentColor(templateId: string | null): string {
  const colors: Record<string, string> = {
    '1': '#1a5276',
    '2': '#2e86c1',
    '3': '#8e44ad',
    '4': '#1a5276',
    '5': '#2e86c1',
    '6': '#8e44ad',
    '7': '#1a5276',
    '8': '#2e86c1',
    '9': '#8e44ad',
  };
  return colors[templateId ?? ''] ?? '#1a5276';
}

// `includeSummary` keeps the summary in the header for the default render;
// when a layout is present, summary becomes a reorderable/hideable section.
function buildHeader(
  pi: CvPdfData['personalInfo'],
  includeSummary: boolean,
): string {
  if (!pi) return '';
  const parts: string[] = [];
  if (pi.email) parts.push(`<span>${esc(pi.email)}</span>`);
  if (pi.phone) parts.push(`<span>${esc(pi.phone)}</span>`);
  if (pi.location) parts.push(`<span>${esc(pi.location)}</span>`);
  if (pi.website)
    parts.push(
      `<span><a href="${esc(pi.website)}">${esc(pi.website)}</a></span>`,
    );
  if (pi.linkedinUrl)
    parts.push(`<span><a href="${esc(pi.linkedinUrl)}">LinkedIn</a></span>`);

  const summary =
    includeSummary && pi.summary
      ? `\n<div class="summary">${esc(pi.summary)}</div>`
      : '';

  return `
<h1>${esc(pi.fullName)}</h1>
<div class="contact">${parts.join('')}</div>${summary}`;
}

// ─── Default render (no layout) — fixed order, unchanged output ───────────────

function buildDefaultSections(cv: CvPdfData): string {
  return [
    buildSection('Experience', cv.experiences, buildExperience),
    buildSection('Education', cv.education, buildEducation),
    buildSkillsSection(cv.skills),
    buildSection('Certifications', cv.certifications, buildCertification),
    buildSection('Projects', cv.projects, buildProject),
    buildLanguagesSection(cv.languages),
    buildCustomSections(cv.customSections),
  ].join('\n');
}

// ─── Layout-driven render — honour order / hidden / titles ────────────────────

const DEFAULT_SECTION_ORDER = [
  'summary',
  'experience',
  'projects',
  'skills',
  'education',
  'certifications',
  'languages',
];

const DEFAULT_SECTION_TITLES: Record<string, string> = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  certifications: 'Certifications',
  projects: 'Projects',
  languages: 'Languages',
};

function buildOrderedSections(
  cv: CvPdfData,
  layout: SectionLayoutData,
): string {
  // key -> rendered body (no heading). Custom sections are keyed by their id.
  const bodies: Record<string, string> = {
    summary: cv.personalInfo?.summary
      ? `<div class="summary">${esc(cv.personalInfo.summary)}</div>`
      : '',
    experience: cv.experiences.map(buildExperience).join('\n'),
    education: cv.education.map(buildEducation).join('\n'),
    skills: buildSkillsBody(cv.skills),
    certifications: cv.certifications.map(buildCertification).join('\n'),
    projects: cv.projects.map(buildProject).join('\n'),
    languages: buildLanguagesBody(cv.languages),
  };
  const customTitles: Record<string, string> = {};
  for (const cs of cv.customSections) {
    bodies[cs.id] =
      `<div class="custom-entries">${buildCustomEntries(cs.entries)}</div>`;
    customTitles[cs.id] = cs.title;
  }

  const hidden = new Set(layout.hidden);
  const availableKeys = [
    ...DEFAULT_SECTION_ORDER,
    ...cv.customSections.map(cs => cs.id),
  ];

  // Flatten main + side; duplicates resolve to their LAST occurrence (frozen
  // contract: "last column wins"). Then append any present-but-unlisted keys.
  const sequence = [...layout.mainOrder, ...layout.sideOrder];
  const placed = new Set<string>();
  const orderedReversed: string[] = [];
  for (let i = sequence.length - 1; i >= 0; i--) {
    const key = sequence[i];
    if (hidden.has(key) || placed.has(key)) continue;
    placed.add(key);
    orderedReversed.push(key);
  }
  const order = orderedReversed.reverse();
  for (const key of availableKeys) {
    if (!placed.has(key) && !hidden.has(key)) {
      placed.add(key);
      order.push(key);
    }
  }

  return order
    .filter(key => key in bodies)
    .map(key => {
      const body = bodies[key];
      if (!body) return '';
      const overridden = Object.prototype.hasOwnProperty.call(
        layout.titles,
        key,
      );
      // Summary stays headingless (matching the header style) unless renamed.
      if (key === 'summary' && !overridden) return body;
      const title =
        layout.titles[key] ??
        DEFAULT_SECTION_TITLES[key] ??
        customTitles[key] ??
        '';
      return `<h2>${esc(title)}</h2>\n${body}`;
    })
    .filter(Boolean)
    .join('\n');
}

// Reads the opaque JSON column defensively. Returns null when there is nothing
// meaningful to honour, so the default render path is used.
function normalizeLayout(raw: unknown): SectionLayoutData | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const toStringArray = (value: unknown): string[] =>
    Array.isArray(value)
      ? value.filter((v): v is string => typeof v === 'string')
      : [];

  const mainOrder = toStringArray(obj.mainOrder);
  const sideOrder = toStringArray(obj.sideOrder);
  const hidden = toStringArray(obj.hidden);
  const titles =
    obj.titles && typeof obj.titles === 'object' && !Array.isArray(obj.titles)
      ? (Object.fromEntries(
          Object.entries(obj.titles as Record<string, unknown>).filter(
            ([, v]) => typeof v === 'string',
          ),
        ) as Record<string, string>)
      : {};

  if (
    !mainOrder.length &&
    !sideOrder.length &&
    !hidden.length &&
    !Object.keys(titles).length
  ) {
    return null;
  }
  return { mainOrder, sideOrder, hidden, titles };
}

// ─── Section renderers ────────────────────────────────────────────────────────

function buildSection<T>(
  title: string,
  items: T[],
  renderFn: (item: T) => string,
): string {
  if (!items.length) return '';
  return `<h2>${title}</h2>\n${items.map(renderFn).join('\n')}`;
}

function buildExperience(exp: CvPdfData['experiences'][0]): string {
  return `<div class="entry">
  <div class="entry-header"><h3>${esc(exp.title)}</h3><span class="right">${dateRange(exp.startDate, exp.endDate, exp.current)}</span></div>
  <div class="entry-sub">${esc(exp.company)}${exp.location ? ` · ${esc(exp.location)}` : ''}</div>
  ${exp.description ? `<div class="entry-desc">${esc(exp.description)}</div>` : ''}
</div>`;
}

function buildEducation(edu: CvPdfData['education'][0]): string {
  const degree = [edu.degree, edu.field].filter(Boolean).join(' in ');
  return `<div class="entry">
  <div class="entry-header"><h3>${esc(edu.institution)}</h3><span class="right">${dateRange(edu.startDate, edu.endDate)}</span></div>
  <div class="entry-sub">${esc(degree)}${edu.gpa ? ` — GPA: ${esc(edu.gpa)}` : ''}</div>
</div>`;
}

function buildSkillsBody(skills: CvPdfData['skills']): string {
  if (!skills.length) return '';
  const items = skills
    .map(
      s =>
        `<div class="skill-item">${esc(s.name)} <span class="skill-level">${esc(s.level)}</span></div>`,
    )
    .join('\n');
  return `<div class="skills-grid">${items}</div>`;
}

function buildSkillsSection(skills: CvPdfData['skills']): string {
  const body = buildSkillsBody(skills);
  return body ? `<h2>Skills</h2>\n${body}` : '';
}

function buildCertification(cert: CvPdfData['certifications'][0]): string {
  const link = cert.credentialUrl
    ? ` <a href="${esc(cert.credentialUrl)}">[link]</a>`
    : '';
  return `<div class="entry">
  <div class="entry-header"><h3>${esc(cert.name)}${link}</h3><span class="right">${fmtDate(cert.issueDate)}</span></div>
  ${cert.issuer ? `<div class="entry-sub">${esc(cert.issuer)}</div>` : ''}
</div>`;
}

function buildProject(proj: CvPdfData['projects'][0]): string {
  const link = proj.url ? ` <a href="${esc(proj.url)}">[link]</a>` : '';
  return `<div class="entry">
  <div class="entry-header"><h3>${esc(proj.name)}${link}</h3><span class="right">${dateRange(proj.startDate, proj.endDate)}</span></div>
  ${proj.description ? `<div class="entry-desc">${esc(proj.description)}</div>` : ''}
</div>`;
}

function buildLanguagesBody(langs: CvPdfData['languages']): string {
  if (!langs.length) return '';
  const items = langs
    .map(
      l =>
        `<span class="lang-item">${esc(l.name)} <span class="lang-prof">${esc(l.proficiency)}</span></span>`,
    )
    .join('\n');
  return `<div>${items}</div>`;
}

function buildLanguagesSection(langs: CvPdfData['languages']): string {
  const body = buildLanguagesBody(langs);
  return body ? `<h2>Languages</h2>\n${body}` : '';
}

function buildCustomEntries(entries: unknown): string {
  if (!Array.isArray(entries)) return '';
  return entries
    .map(e => {
      const vals = Object.values(e as Record<string, unknown>)
        .filter(Boolean)
        .map(v => esc(String(v)));
      return `<div class="entry-desc">${vals.join(' · ')}</div>`;
    })
    .join('\n');
}

function buildCustomSections(sections: CvPdfData['customSections']): string {
  if (!sections.length) return '';
  return sections
    .map(s => {
      const entries = buildCustomEntries(s.entries);
      return `<h2>${esc(s.title)}</h2>\n<div class="custom-entries">${entries}</div>`;
    })
    .join('\n');
}
