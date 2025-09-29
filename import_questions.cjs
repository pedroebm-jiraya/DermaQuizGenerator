const fs = require('fs');

// Import questions to database using the API
async function importQuestions() {
  try {
    console.log('Reading processed questions...');
    const questionsData = JSON.parse(fs.readFileSync('questions_2025.json', 'utf8'));
    
    console.log(`Found ${questionsData.length} questions to import`);
    
    // First, get admin credentials
    const credentials = Buffer.from('dermatoufs:Fedr0p0rtugal').toString('base64');
    
    // Create a form data like structure
    const FormData = require('form-data');
    const form = new FormData();
    
    // Convert questions back to Excel-like structure for the API
    const XLSX = require('xlsx');
    
    // Create workbook with the questions data
    const worksheet = XLSX.utils.json_to_sheet(questionsData.map(q => ({
      ' Ano da Prova ': q.year,
      ' Enunciado da Questão ': q.statement,
      ' Alternativa a ': q.options[0] || '',
      ' Alternativa b ': q.options[1] || '',
      ' Alternativa c ': q.options[2] || '',
      ' Alternativa d ': q.options[3] || '',
      ' Alternativa e ': q.options[4] || '',
      ' Gabarito ': q.correctAnswer.toLowerCase(),
      'Tema': q.chapter,
      'Parte': q.section
    })));
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Questions');
    
    // Write to buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Create form data with file
    form.append('file', buffer, {
      filename: 'questions_2025.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    
    // Make request to upload API
    const response = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('Import successful:', result);
    
  } catch (error) {
    console.error('Error importing questions:', error);
  }
}

importQuestions();