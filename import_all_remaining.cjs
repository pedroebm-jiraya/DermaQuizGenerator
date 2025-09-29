// Import all remaining questions at once using bulk insert
const fs = require('fs');

async function importAllRemaining() {
  try {
    const questions = JSON.parse(fs.readFileSync('questions_2025.json', 'utf8'));
    
    // Skip the first 15 that were already inserted
    const remainingQuestions = questions.slice(15);
    
    console.log(`Preparing to import ${remainingQuestions.length} remaining questions`);
    
    // Create bulk insert values
    const values = remainingQuestions.map(q => {
      const optionsJson = JSON.stringify(q.options).replace(/'/g, "''");
      const statementEscaped = q.statement.replace(/'/g, "''");
      const chapterEscaped = q.chapter.replace(/'/g, "''");
      const bookSection = `TED - Parte ${q.section}`;
      
      return `('${q.id}', ${q.year}, '${statementEscaped}', '${optionsJson}', '${q.correctAnswer}', '${chapterEscaped}', '${bookSection}')`;
    }).join(',\n');

    const bulkSQL = `INSERT INTO questions (id, year, statement, options, correct_answer, chapter, book_section) VALUES\n${values};`;

    // Write to file for execution
    fs.writeFileSync('bulk_import.sql', bulkSQL);
    console.log('Bulk import SQL created: bulk_import.sql');
    console.log(`File contains ${remainingQuestions.length} questions`);
    
  } catch (error) {
    console.error('Error creating bulk import:', error);
  }
}

importAllRemaining();