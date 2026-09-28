import { BRAND } from './brand';

const COLORS = {
  ink: '#172554',
  navy: '#10213A',
  muted: '#64748B',
  pale: '#F1F5F9',
  line: '#DCE4EE',
  blue: '#2563EB',
  purple: '#7C3AED',
  teal: '#0F766E',
};

const valueOrDash = (value) => (value === null || value === undefined || value === '' ? '—' : String(value));
const prettyMood = (mood) => mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : '';
const readingMinutes = (text = '') => Math.max(1, Math.ceil(wordCount(text) / 200));
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};
const wordCount = (text = '') => text.trim().split(/\s+/).filter(Boolean).length;

let pdfMakePromise;
function getPdfMake() {
  if (!pdfMakePromise) {
    pdfMakePromise = Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts'),
    ]).then(([pdfMakeModule, fontsModule]) => {
      const pdfMake = pdfMakeModule.default || pdfMakeModule;
      const pdfFonts = fontsModule.default || fontsModule;
      pdfMake.addVirtualFileSystem(pdfFonts);
      return pdfMake;
    });
  }
  return pdfMakePromise;
}

export function preparePdfExport() {
  return getPdfMake();
}

function getPageLayout(pageSize) {
  if (pageSize === 'A3') {
    const margins = [56, 76, 56, 68];
    return { pageSize: 'A3', margins, contentWidth: 841.89 - margins[0] - margins[2], scale: 1.16 };
  }
  const margins = [48, 66, 48, 58];
  return { pageSize: 'A4', margins, contentWidth: 595.28 - margins[0] - margins[2], scale: 1 };
}

function documentShell(title, subtitle, countLabel, count, sections, pageSize) {
  const generatedAt = new Date();
  const layout = getPageLayout(pageSize);
  const [leftMargin, topMargin, rightMargin] = layout.margins;
  const scale = layout.scale;
  return {
    pageSize: layout.pageSize,
    pageMargins: layout.margins,
    defaultStyle: { font: 'Roboto', fontSize: 10 * scale, color: COLORS.ink, lineHeight: 1.35 },
    styles: {
      heroTitle: { fontSize: 27 * scale, bold: true, color: '#FFFFFF', characterSpacing: 0.25 },
      heroSubtitle: { fontSize: 10 * scale, color: '#DCE7F5', margin: [0, 5 * scale, 0, 0] },
      eyebrow: { fontSize: 8 * scale, bold: true, color: '#BFDBFE', characterSpacing: 1.6 },
      sectionTitle: { fontSize: 18 * scale, bold: true, color: COLORS.ink, margin: [0, 20 * scale, 0, 8 * scale] },
      label: { fontSize: 8 * scale, bold: true, color: COLORS.muted, characterSpacing: 0.8, margin: [0, 8 * scale, 0, 3 * scale] },
      body: { fontSize: 10.5 * scale, color: '#26364B', lineHeight: 1.45 },
      small: { fontSize: 8 * scale, color: COLORS.muted },
    },
    header: (currentPage) => currentPage === 1 ? null : ({
      columns: [
        { text: title.toUpperCase(), style: 'small', bold: true, characterSpacing: 0.8 },
        { text: `${BRAND.name.toUpperCase()} · PERSONAL COLLECTION`, style: 'small', alignment: 'right', characterSpacing: 0.5 },
      ],
      margin: [leftMargin, Math.max(20, topMargin * 0.38), rightMargin, 0],
    }),
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: `Created ${generatedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`, style: 'small' },
        { text: `${currentPage} / ${pageCount}`, style: 'small', alignment: 'right' },
      ],
      margin: [leftMargin, 0, rightMargin, 24],
    }),
    content: [
      {
        table: {
          widths: ['*'],
          body: [[{
            stack: [
              { text: subtitle.toUpperCase(), style: 'eyebrow' },
              { text: title, style: 'heroTitle', margin: [0, 9, 0, 0] },
              { text: `${count.toLocaleString()} ${countLabel} · Curated on ${formatDate(generatedAt)}`, style: 'heroSubtitle' },
            ],
            fillColor: COLORS.navy,
            margin: [22, 21, 22, 22],
            border: [false, false, false, false],
          }]],
        },
        layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
        margin: [0, 0, 0, 15],
      },
      {
        table: {
          widths: ['*'],
          body: [[{
            columns: [
              { width: '*', text: [{ text: String(count).padStart(2, '0'), bold: true, fontSize: 18, color: COLORS.blue }, { text: `  ${countLabel}`, fontSize: 9, color: COLORS.muted }] },
              { width: 'auto', text: 'A complete export of your saved collection', fontSize: 8, color: COLORS.muted, alignment: 'right', margin: [0, 5, 0, 0] },
            ],
            fillColor: COLORS.pale,
            margin: [13, 9, 13, 9],
            border: [false, false, false, false],
          }]],
        },
        layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
        margin: [0, 0, 0, 13],
      },
      ...sections,
    ],
    info: { title, subject: subtitle, creator: BRAND.name },
  };
}

function field(label, value, options = {}) {
  const text = valueOrDash(value);
  return {
    stack: [
      { text: label.toUpperCase(), style: 'label' },
      { text, style: options.italic ? { ...options.style, italics: true } : (options.style || 'body') },
    ],
    margin: [0, 0, 0, 2],
  };
}

function itemHeading(index, title, type, scale = 1) {
  const accent = type === 'PHRASE' ? COLORS.purple : COLORS.blue;
  return {
    table: {
      widths: [34, '*', 'auto'],
      body: [[
        { text: String(index).padStart(2, '0'), color: '#FFFFFF', bold: true, fontSize: 9 * scale, alignment: 'center', fillColor: accent, margin: [0, 9 * scale, 0, 9 * scale], border: [false, false, false, false] },
        { text: title, bold: true, fontSize: 15 * scale, color: COLORS.ink, margin: [9 * scale, 8 * scale, 5 * scale, 8 * scale], border: [false, false, false, false] },
        { text: type === 'PHRASE' ? 'PHRASE' : 'WORD', fontSize: 7 * scale, bold: true, color: accent, alignment: 'right', margin: [2, 10 * scale, 10 * scale, 7 * scale], border: [false, false, false, false] },
      ]],
    },
    layout: { hLineWidth: () => 0, vLineWidth: () => 0, fillColor: () => '#F3F6FB' },
    margin: [0, 13 * scale, 0, 0],
  };
}

export async function downloadWordsPdf(words, pdfMakeInstance, pageSize = 'A4') {
  const layout = getPageLayout(pageSize);
  const scale = layout.scale;
  const byTypeAndAlphabet = (a, b) => (a.word || '').localeCompare(b.word || '', undefined, { sensitivity: 'base' });
  const wordEntries = words.filter((word) => word.entryType !== 'PHRASE').sort(byTypeAndAlphabet);
  const phraseEntries = words.filter((word) => word.entryType === 'PHRASE').sort(byTypeAndAlphabet);
  const renderEntries = (entries, type) => entries.flatMap((word, index) => {
    const examples = (word.exampleSentence || '').split(/\n+/).map((example) => example.replace(/^\s*(?:[•*-]|\d+[.)])\s*/, '').trim()).filter(Boolean);
    const items = [{
      ...itemHeading(index + 1, valueOrDash(word.word), type, scale),
      pageBreak: 'before',
    }];
    if (word.categoryName) items.push(field('Category', word.categoryName));
    items.push(field('Meaning', word.definition));
    if (examples.length) {
      items.push({
        stack: [
          { text: examples.length === 1 ? 'EXAMPLE' : 'EXAMPLES', style: 'label', margin: [0, 8, 0, 3] },
          { ul: examples.map((example) => ({ text: example, italics: true, fontSize: 10 * scale, color: '#334155', margin: [0, 2 * scale, 0, 2 * scale] })), margin: [0, 0, 0, 2] },
        ],
      });
    }
    if (word.notes) items.push(field('Notes', word.notes));

    if (word.imageUrl) items.push(field('Image link', word.imageUrl, { style: 'small' }));
    if (word.audioUrl) items.push(field('Audio link', word.audioUrl, { style: 'small' }));
    items.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: layout.contentWidth, y2: 0, lineWidth: 0.5, lineColor: COLORS.line }], margin: [0, 4 * scale, 0, 4 * scale] });
    return items;
  });

  const sections = [];
  if (wordEntries.length) {
    sections.push(...renderEntries(wordEntries, 'WORD'));
  }
  if (phraseEntries.length) {
    sections.push(...renderEntries(phraseEntries, 'PHRASE'));
  }
  const doc = documentShell(`${BRAND.name} · Vocabulary`, 'Word & phrase library', 'entries', words.length, [
    ...sections,
  ], pageSize);
  const pdfMake = pdfMakeInstance || await getPdfMake();
  pdfMake.createPdf(doc).download(`my-words-and-phrases-${pageSize.toLowerCase()}.pdf`);
}

export async function downloadJournalPdf(entries, pdfMakeInstance, pageSize = 'A4') {
  const layout = getPageLayout(pageSize);
  const scale = layout.scale;
  const sortedEntries = [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sections = sortedEntries.flatMap((entry, index) => {
    const paragraphs = (entry.content || '').split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
    const mood = prettyMood(entry.mood);
    const items = [
      {
        table: {
          widths: [38, '*'],
          body: [[{
            text: String(index + 1).padStart(2, '0'),
            fontSize: 10 * scale,
            bold: true,
            color: '#FFFFFF',
            alignment: 'center',
            fillColor: COLORS.teal,
            margin: [0, 13, 0, 13],
            border: [false, false, false, false],
          }, {
            stack: [
              { text: entry.title || 'Untitled entry', fontSize: 16 * scale, bold: true, color: COLORS.ink, lineHeight: 1.15 },
              {
                text: [formatDate(entry.createdAt), `${readingMinutes(entry.content)} min read`, entry.category, mood].filter(Boolean).join('   ·   '),
                fontSize: 8.5 * scale,
                color: COLORS.muted,
                margin: [0, 5, 0, 0],
              },
            ],
            fillColor: '#F1F7F7',
            margin: [13, 10, 13, 10],
            border: [false, false, false, false],
          }]],
        },
        layout: { hLineWidth: () => 0, vLineWidth: () => 0 },
        margin: [0, index ? 17 : 0, 0, 0],
        pageBreak: 'before',
      },
    ];
    paragraphs.forEach((paragraph) => {
      items.push({
        text: paragraph,
        fontSize: 11 * scale,
        color: '#26364B',
        lineHeight: 1.5,
        margin: [2 * scale, 9 * scale, 2 * scale, 3 * scale],
      });
    });
    if (entry.articleTitle || entry.articleUrl) {
      const sourceLabel = entry.articleTitle || 'Open referenced article';
      items.push({
        text: [{ text: 'READING NOTE   ', bold: true, color: COLORS.muted }, { text: sourceLabel, color: COLORS.blue, decoration: 'underline', ...(entry.articleUrl ? { link: entry.articleUrl } : {}) }],
        fontSize: 8.5 * scale,
        margin: [2, 9, 1, 0],
      });
    }
    if (entry.usedWords?.length) {
      items.push({
        text: `Vocabulary in this entry  ·  ${entry.usedWords.length}`,
        fontSize: 9 * scale,
        bold: true,
        color: COLORS.teal,
        margin: [2, 12, 0, 5],
      });
      items.push({
        ul: entry.usedWords.map((word) => ({
          text: [
            { text: word.word || 'Word', bold: true, color: COLORS.teal },
            word.definition ? { text: `  —  ${word.definition}`, color: '#475569' } : '',
          ],
          fontSize: 9 * scale,
          lineHeight: 1.3,
          margin: [0, 2, 0, 2],
        })),
        margin: [1, 0, 0, 2],
      });
    }
    items.push({ canvas: [{ type: 'line', x1: 0, y1: 0, x2: layout.contentWidth, y2: 0, lineWidth: 0.6, lineColor: '#C9DAD9' }], margin: [0, 15 * scale, 0, 1] });
    return items;
  });

  const totalWords = entries.reduce((total, entry) => total + wordCount(entry.content || ''), 0);
  const vocabularyMentions = entries.reduce((total, entry) => total + (entry.usedWords?.length || 0), 0);
  const doc = documentShell(`${BRAND.name} · Journal`, 'Personal reflections & vocabulary practice', 'entries', entries.length, [
    {
      table: {
        widths: ['*', '*', '*'],
        body: [[
          { text: [{ text: totalWords.toLocaleString(), fontSize: 15 * scale, bold: true, color: COLORS.teal }, { text: '\nWORDS WRITTEN', fontSize: 7.5 * scale, bold: true, color: COLORS.muted }], margin: [11, 8 * scale, 8, 8 * scale], border: [false, false, false, false] },
          { text: [{ text: entries.length.toLocaleString(), fontSize: 15 * scale, bold: true, color: COLORS.blue }, { text: '\nJOURNAL ENTRIES', fontSize: 7.5 * scale, bold: true, color: COLORS.muted }], margin: [11, 8 * scale, 8, 8 * scale], border: [false, false, false, false] },
          { text: [{ text: vocabularyMentions.toLocaleString(), fontSize: 15 * scale, bold: true, color: COLORS.purple }, { text: '\nVOCAB LINKS', fontSize: 7.5 * scale, bold: true, color: COLORS.muted }], margin: [11, 8 * scale, 8, 8 * scale], border: [false, false, false, false] },
        ]],
      },
      layout: { fillColor: () => COLORS.pale, hLineWidth: () => 0, vLineWidth: () => 0 },
      margin: [0, 9, 0, 8],
    },
    ...sections,
  ], pageSize);
  const pdfMake = pdfMakeInstance || await getPdfMake();
  pdfMake.createPdf(doc).download(`my-journal-${pageSize.toLowerCase()}.pdf`);
}
