const pdfParse = require('pdf-parse');

async function extractTextFromPDF(buffer) {
  const data = await pdfParse(buffer);
  return {
    text: data.text,
    numPages: data.numpages,
    pages: splitIntoPages(data.text, data.numpages),
  };
}

function splitIntoPages(fullText, numPages) {
  const lines = fullText.split('\n');
  const linesPerPage = Math.ceil(lines.length / numPages);
  const pages = [];
  for (let i = 0; i < numPages; i++) {
    const start = i * linesPerPage;
    const end = start + linesPerPage;
    pages.push(lines.slice(start, end).join('\n'));
  }
  return pages;
}

function splitIntoColumns(pageText) {
  const lines = pageText.split('\n');
  const midpoint = Math.floor(lines.length / 2);

  const col1 = lines.slice(0, Math.floor(midpoint * 0.5)).join('\n');
  const col2 = lines.slice(Math.floor(midpoint * 0.5), midpoint).join('\n');
  const col3 = lines.slice(midpoint).join('\n');

  return [col1, col2, col3].filter(c => c.trim().length > 20);
}

module.exports = { extractTextFromPDF, splitIntoColumns };
