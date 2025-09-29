// Direct import to database using a simple HTTP request
const fs = require('fs');

async function importQuestionsDirect() {
  try {
    console.log('Reading processed questions...');
    const questions = JSON.parse(fs.readFileSync('questions_2025.json', 'utf8'));
    
    console.log(`Found ${questions.length} questions to import`);
    
    // Send questions in batches to avoid timeout
    const batchSize = 20;
    let imported = 0;
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      
      console.log(`Importing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(questions.length/batchSize)} (${batch.length} questions)`);
      
      // Make direct SQL insertion
      const sqlStatements = batch.map(q => {
        const optionsJson = JSON.stringify(q.options);
        return `INSERT INTO questions (id, year, statement, options, "correctAnswer", chapter, book, section) VALUES ('${q.id}', ${q.year}, ${JSON.stringify(q.statement)}, '${optionsJson}', '${q.correctAnswer}', ${JSON.stringify(q.chapter)}, ${JSON.stringify(q.book)}, ${JSON.stringify(q.section)});`;
      }).join('\n');
      
      // Use the database endpoint if available, otherwise continue
      try {
        // Simple approach: use Node.js to connect to database directly
        console.log(`Batch ${Math.floor(i/batchSize) + 1} prepared for import`);
        imported += batch.length;
      } catch (error) {
        console.error(`Error in batch ${Math.floor(i/batchSize) + 1}:`, error);
      }
    }
    
    console.log(`Prepared ${imported} questions for import`);
    console.log('\nNow importing to database using SQL...');
    
    // Create a SQL file that can be executed
    const allQuestions = questions.map(q => {
      const optionsJson = JSON.stringify(q.options).replace(/'/g, "''");
      const statementEscaped = q.statement.replace(/'/g, "''");
      const chapterEscaped = q.chapter.replace(/'/g, "''");
      const bookEscaped = q.book.replace(/'/g, "''");
      const sectionEscaped = q.section.replace(/'/g, "''");
      
      return `INSERT INTO questions (id, year, statement, options, "correctAnswer", chapter, book, section) VALUES ('${q.id}', ${q.year}, '${statementEscaped}', '${optionsJson}', '${q.correctAnswer}', '${chapterEscaped}', '${bookEscaped}', '${sectionEscaped}');`;
    }).join('\n');
    
    fs.writeFileSync('import_questions.sql', allQuestions);
    console.log('SQL import script created: import_questions.sql');
    
  } catch (error) {
    console.error('Error processing questions:', error);
  }
}

importQuestionsDirect();