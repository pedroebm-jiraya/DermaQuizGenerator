const fs = require('fs');

// Read processed questions and create corrected SQL
const questions = JSON.parse(fs.readFileSync('questions_2025.json', 'utf8'));

console.log(`Creating corrected SQL for ${questions.length} questions`);

// Skip the first 5 that were already inserted
const remainingQuestions = questions.slice(5);

const sqlStatements = remainingQuestions.map(q => {
  const optionsJson = JSON.stringify(q.options).replace(/'/g, "''");
  const statementEscaped = q.statement.replace(/'/g, "''");
  const chapterEscaped = q.chapter.replace(/'/g, "''");
  const bookSection = `TED - Parte ${q.section}`;
  
  return `('${q.id}', ${q.year}, '${statementEscaped}', '${optionsJson}', '${q.correctAnswer}', '${chapterEscaped}', '${bookSection}')`;
}).join(',\n');

const fullSQL = `INSERT INTO questions (id, year, statement, options, correct_answer, chapter, book_section) VALUES\n${sqlStatements};`;

fs.writeFileSync('import_remaining.sql', fullSQL);
console.log(`SQL file created with ${remainingQuestions.length} remaining questions`);
console.log('File: import_remaining.sql');