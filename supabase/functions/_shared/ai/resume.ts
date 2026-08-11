import type { ResumeContent } from './types.ts';

export const RESUME_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'contactLines', 'summary', 'experiences', 'skills', 'education', 'gaps'],
  properties: {
    name: { type: 'string' },
    contactLines: { type: 'array', items: { type: 'string' } },
    summary: { type: 'string' },
    experiences: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['heading', 'dates', 'bullets'],
        properties: {
          heading: { type: 'string' },
          dates: { type: 'string' },
          bullets: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    skills: { type: 'array', items: { type: 'string' } },
    education: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['heading', 'details'],
        properties: { heading: { type: 'string' }, details: { type: 'string' } },
      },
    },
    gaps: { type: 'array', items: { type: 'string' } },
  },
};

const latexCharacters: Record<string, string> = {
  '\\': '\\textbackslash{}', '&': '\\&', '%': '\\%', '$': '\\$', '#': '\\#',
  '_': '\\_', '{': '\\{', '}': '\\}', '~': '\\textasciitilde{}', '^': '\\textasciicircum{}',
};
const latexEscape = (value: string) => value.replace(/[\\&%$#_{}~^]/g, (character) => latexCharacters[character]);

const cleanString = (value: unknown, max = 1_000) => {
  if (typeof value !== 'string') return '';
  return value.replace(/\u0000/g, '').trim().slice(0, max);
};

const cleanStringArray = (value: unknown, maxItems: number, maxLength = 500) =>
  Array.isArray(value)
    ? value.slice(0, maxItems).map((item) => cleanString(item, maxLength)).filter(Boolean)
    : [];

export const validateContent = (raw: unknown): ResumeContent => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('invalid_model_output');
  const source = raw as Record<string, unknown>;
  const experiences = Array.isArray(source.experiences)
    ? source.experiences.slice(0, 15).map((item) => {
        const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
        return {
          heading: cleanString(row.heading, 300),
          dates: cleanString(row.dates, 100),
          bullets: cleanStringArray(row.bullets, 10, 600),
        };
      }).filter((item) => item.heading || item.bullets.length)
    : [];
  const education = Array.isArray(source.education)
    ? source.education.slice(0, 10).map((item) => {
        const row = item && typeof item === 'object' ? item as Record<string, unknown> : {};
        return { heading: cleanString(row.heading, 300), details: cleanString(row.details, 500) };
      }).filter((item) => item.heading || item.details)
    : [];

  const content: ResumeContent = {
    name: cleanString(source.name, 200),
    contactLines: cleanStringArray(source.contactLines, 6, 300),
    summary: cleanString(source.summary, 1_500),
    experiences,
    skills: cleanStringArray(source.skills, 50, 150),
    education,
    gaps: cleanStringArray(source.gaps, 30, 300),
  };
  if (!content.name && !content.summary && !content.experiences.length) throw new Error('invalid_model_output');
  return content;
};

export const renderLatex = (content: ResumeContent) => {
  const items = (values: string[]) => values.length
    ? `\\begin{itemize}\n${values.map((value) => `  \\item ${latexEscape(value)}`).join('\n')}\n\\end{itemize}`
    : '';
  const experience = content.experiences.map((entry) => [
    `\\textbf{${latexEscape(entry.heading)}}${entry.dates ? ` \\hfill ${latexEscape(entry.dates)}` : ''}`,
    items(entry.bullets),
  ].filter(Boolean).join('\n')).join('\n\\vspace{0.35em}\n');
  const education = content.education.map((entry) =>
    `\\textbf{${latexEscape(entry.heading)}}${entry.details ? ` \\hfill ${latexEscape(entry.details)}` : ''}`
  ).join('\n\\par\n');

  return `\\documentclass[10pt,a4paper]{article}
\\usepackage[T1]{fontenc}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1.6cm]{geometry}
\\usepackage{titlesec}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\setlist[itemize]{leftmargin=*,nosep}
\\titleformat{\\section}{\\large\\bfseries}{}{0pt}{}[\\titlerule]
\\pagestyle{empty}
\\begin{document}
\\begin{center}
{\\LARGE\\bfseries ${latexEscape(content.name || 'Currículo')}}\\par
${content.contactLines.map(latexEscape).join(' \\textbar{} ')}
\\end{center}
${content.summary ? `\\section*{Resumo Profissional}\n${latexEscape(content.summary)}` : ''}
${experience ? `\\section*{Experiência}\n${experience}` : ''}
${content.skills.length ? `\\section*{Habilidades}\n${latexEscape(content.skills.join(' • '))}` : ''}
${education ? `\\section*{Formação}\n${education}` : ''}
\\end{document}`.trim();
};
