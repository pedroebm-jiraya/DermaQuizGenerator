const XLSX = require('xlsx');

// Read and examine the Excel file structure
const filePath = 'attached_assets/banco_TED _2025_1759168910473.xlsx';

try {
  console.log('Examining Excel file:', filePath);
  const workbook = XLSX.readFile(filePath);
  
  console.log('\nWorkbook sheets:', workbook.SheetNames);
  
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`\nSheet: ${sheetName}`);
  console.log(`Total rows: ${data.length}`);
  
  if (data.length > 0) {
    console.log('\nColumn names in first row:');
    const firstRow = data[0];
    Object.keys(firstRow).forEach((key, index) => {
      console.log(`${index + 1}. "${key}": "${firstRow[key]}"`);
    });
    
    console.log('\nFirst few rows of data:');
    for (let i = 0; i < Math.min(3, data.length); i++) {
      console.log(`\nRow ${i + 1}:`);
      const row = data[i];
      Object.keys(row).forEach(key => {
        const value = String(row[key]).substring(0, 100);
        console.log(`  ${key}: ${value}`);
      });
    }
  }

} catch (error) {
  console.error('Error examining Excel file:', error);
}