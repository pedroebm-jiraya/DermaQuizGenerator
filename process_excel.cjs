const XLSX = require('xlsx');
const { randomUUID } = require('crypto');
const fs = require('fs');

// Read and process the Excel file
const filePath = 'attached_assets/banco_TED _2025_1759168910473.xlsx';

try {
  console.log('Reading Excel file:', filePath);
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Processing ${data.length} rows from Excel file`);

  const questions = [];
  let processedCount = 0;
  let skippedCount = 0;

  for (const row of data) {
    try {
      const rowData = row;
      
      // Extract and validate required fields
      const year = parseInt(String(rowData.Ano || rowData.Year || rowData.ano || '').trim());
      const statement = String(rowData.Pergunta || rowData.Statement || rowData.statement || rowData.Questao || '').trim();
      const correctAnswer = String(rowData.Gabarito || rowData.CorrectAnswer || rowData.correct_answer || rowData.Resposta || '').trim().toUpperCase();
      const chapter = String(rowData.Capitulo || rowData.Chapter || rowData.chapter || rowData.Tema || '').trim();
      
      // Collect options (A, B, C, D, E)
      const options = [];
      ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
        const option = String(rowData[letter] || rowData[`Opcao${letter}`] || rowData[`Option${letter}`] || '').trim();
        if (option) {
          options.push(option);
        }
      });

      // Validate required fields
      if (!year || isNaN(year) || !statement || !correctAnswer || options.length === 0 || !chapter) {
        console.log(`Skipping row due to missing data:`, { year, statement: statement.substring(0, 50), correctAnswer, optionsCount: options.length, chapter });
        skippedCount++;
        continue;
      }

      // Validate correct answer
      if (!['A', 'B', 'C', 'D', 'E'].includes(correctAnswer)) {
        console.log(`Skipping row due to invalid correct answer: ${correctAnswer}`);
        skippedCount++;
        continue;
      }

      // Create question object
      const question = {
        id: randomUUID(),
        year,
        statement,
        options,
        correctAnswer,
        chapter,
        book: String(rowData.Livro || rowData.Book || rowData.book || 'TED').trim(),
        section: String(rowData.Secao || rowData.Section || rowData.section || '').trim()
      };

      questions.push(question);
      processedCount++;
    } catch (error) {
      console.error('Error processing row:', error);
      skippedCount++;
    }
  }

  console.log(`\nProcessing Summary:`);
  console.log(`Total rows: ${data.length}`);
  console.log(`Valid questions: ${questions.length}`);
  console.log(`Processed: ${processedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  
  if (questions.length > 0) {
    console.log(`\nFirst question sample:`, questions[0]);
    
    // Save the processed questions to a JSON file for import
    fs.writeFileSync('questions_2025.json', JSON.stringify(questions, null, 2));
    console.log(`\nQuestions saved to questions_2025.json`);
  }

} catch (error) {
  console.error('Error processing Excel file:', error);
}