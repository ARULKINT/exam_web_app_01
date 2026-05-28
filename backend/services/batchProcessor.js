const { supabase } = require('./supabase');
const { extractQuestionsFromText } = require('./geminiAI');
const { extractTextFromPDF, splitIntoColumns } = require('./pdfProcessor');

const DAILY_LIMIT = 1500;
const BATCH_INSERT_SIZE = 500;

let usedToday = 0;
let lastResetDate = new Date().toDateString();

function checkAndResetDailyLimit() {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    usedToday = 0;
    lastResetDate = today;
  }
}

async function processPDF(uploadLogId, pdfBuffer, subjectId, sourceBook, difficulty = 'medium') {
  const { pages, numPages } = await extractTextFromPDF(pdfBuffer);

  const { data: logData } = await supabase
    .from('pdf_upload_logs')
    .select('processed_pages')
    .eq('id', uploadLogId)
    .single();

  let startPage = logData?.processed_pages || 0;

  await supabase
    .from('pdf_upload_logs')
    .update({ status: 'processing' })
    .eq('id', uploadLogId);

  let allQuestions = [];

  for (let i = startPage; i < pages.length; i++) {
    checkAndResetDailyLimit();

    if (usedToday >= DAILY_LIMIT) {
      await supabase
        .from('pdf_upload_logs')
        .update({ processed_pages: i, status: 'paused' })
        .eq('id', uploadLogId);

      scheduleResume(uploadLogId, pdfBuffer, subjectId, sourceBook, difficulty);
      return { paused: true, processedPages: i, totalPages: numPages };
    }

    const columns = splitIntoColumns(pages[i]);
    for (const col of columns) {
      if (usedToday >= DAILY_LIMIT) break;
      try {
        const questions = await extractQuestionsFromText(col);
        usedToday++;
        allQuestions.push(...questions.map(q => ({
          subject_id: subjectId,
          question: q.question,
          option_a: q.option_a,
          option_b: q.option_b,
          option_c: q.option_c,
          option_d: q.option_d,
          correct_ans: q.correct_answer,
          explanation: q.explanation || null,
          difficulty,
          source_book: sourceBook,
          page_no: i + 1,
        })));
      } catch (err) {
        console.error(`Error on page ${i + 1}:`, err.message);
      }
    }

    if (allQuestions.length >= BATCH_INSERT_SIZE) {
      await batchInsert(allQuestions, uploadLogId, i + 1);
      allQuestions = [];
    }
  }

  if (allQuestions.length > 0) {
    await batchInsert(allQuestions, uploadLogId, pages.length);
  }

  await supabase
    .from('pdf_upload_logs')
    .update({
      status: 'completed',
      processed_pages: numPages,
      completed_at: new Date().toISOString(),
    })
    .eq('id', uploadLogId);

  return { completed: true, totalPages: numPages };
}

async function batchInsert(questions, uploadLogId, currentPage) {
  const { error } = await supabase.from('questions').insert(questions);
  if (!error) {
    const { data: log } = await supabase
      .from('pdf_upload_logs')
      .select('total_questions')
      .eq('id', uploadLogId)
      .single();

    await supabase
      .from('pdf_upload_logs')
      .update({
        total_questions: (log?.total_questions || 0) + questions.length,
        processed_pages: currentPage,
      })
      .eq('id', uploadLogId);
  }
}

function scheduleResume(uploadLogId, pdfBuffer, subjectId, sourceBook, difficulty) {
  const msUntilMidnight = getMsUntilMidnight();
  setTimeout(() => {
    processPDF(uploadLogId, pdfBuffer, subjectId, sourceBook, difficulty);
  }, msUntilMidnight + 60000);
}

function getMsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight - now;
}

module.exports = { processPDF, usedToday: () => usedToday, dailyLimit: DAILY_LIMIT };
