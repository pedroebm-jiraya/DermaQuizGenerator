// Extract specific batch of questions for import
const fs = require('fs');

const startIndex = parseInt(process.argv[2]) || 20;
const batchSize = parseInt(process.argv[3]) || 10;

async function extractBatch() {
  try {
    const questions = JSON.parse(fs.readFileSync('questions_2025.json', 'utf8'));
    
    const batch = questions.slice(startIndex, startIndex + batchSize);
    
    console.log(`Extracting questions ${startIndex} to ${startIndex + batch.length - 1}`);
    
    // Create SQL values
    const values = batch.map(q => {
      const optionsJson = JSON.stringify(q.options).replace(/'/g, "''");
      const statementEscaped = q.statement.replace(/'/g, "''");
      const chapterEscaped = q.chapter.replace(/'/g, "''");
      const bookSection = `TED - Parte ${q.section}`;
      
      return `('${q.id}', ${q.year}, '${statementEscaped}', '${optionsJson}', '${q.correctAnswer}', '${chapterEscaped}', '${bookSection}')`;
    }).join(',\n');

    const sql = `INSERT INTO questions (id, year, statement, options, correct_answer, chapter, book_section) VALUES\n${values};`;

    console.log(sql);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

extractBatch();