const XLSX = require('xlsx');
const { randomUUID } = require('crypto');
const fs = require('fs');

// Read and process the Excel file with correct column names
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
      
      // Extract and validate required fields using correct column names
      const year = parseInt(String(rowData[' Ano da Prova '] || '').trim());
      const statement = String(rowData[' Enunciado da Questão '] || '').trim();
      const correctAnswer = String(rowData[' Gabarito '] || '').trim().toUpperCase();
      const chapter = String(rowData['Tema'] || '').trim();
      
      // Collect options (a, b, c, d, e) and convert to A, B, C, D, E
      const options = [];
      const optionLetters = ['a', 'b', 'c', 'd', 'e'];
      optionLetters.forEach(letter => {
        const option = String(rowData[` Alternativa ${letter} `] || '').trim();
        if (option) {
          options.push(option);
        }
      });

      // Validate required fields
      if (!year || isNaN(year) || !statement || !correctAnswer || options.length === 0 || !chapter) {
        console.log(`Skipping row due to missing data:`, { 
          year, 
          statement: statement.substring(0, 50), 
          correctAnswer, 
          optionsCount: options.length, 
          chapter: chapter.substring(0, 30)
        });
        skippedCount++;
        continue;
      }

      // Convert lowercase gabarito to uppercase
      const correctAnswerUpper = correctAnswer.toUpperCase();
      
      // Validate correct answer
      if (!['A', 'B', 'C', 'D', 'E'].includes(correctAnswerUpper)) {
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
        correctAnswer: correctAnswerUpper,
        chapter,
        book: 'TED',
        section: String(rowData['Parte'] || '').trim()
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
    console.log(`\nFirst question sample:`);
    console.log(`Year: ${questions[0].year}`);
    console.log(`Statement: ${questions[0].statement.substring(0, 100)}...`);
    console.log(`Options: ${questions[0].options.length} options`);
    console.log(`Correct Answer: ${questions[0].correctAnswer}`);
    console.log(`Chapter: ${questions[0].chapter}`);
    
    // Save the processed questions to a JSON file for import
    fs.writeFileSync('questions_2025.json', JSON.stringify(questions, null, 2));
    console.log(`\nQuestions saved to questions_2025.json`);
  }

} catch (error) {
  console.error('Error processing Excel file:', error);
}