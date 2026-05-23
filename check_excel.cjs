const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const files = fs.readdirSync(__dirname).filter((name) => 
  name.toLowerCase().endsWith(".xlsx") && !name.startsWith("~$")
);

files.forEach(excelFile => {
  const excelPath = path.join(__dirname, excelFile);
  console.log('--- Checking file:', excelFile);
  try {
    const workbook = xlsx.readFile(excelPath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const p522 = rows.find(row => row[1] === 'P522');
    if (p522) {
      console.log('Found P522:', p522);
    } else {
      console.log('P522 not found');
    }
    const p577 = rows.find(row => row[1] === 'P577');
    if (p577) {
      console.log('Found P577:', p577);
    } else {
      console.log('P577 not found');
    }
  } catch (err) {
    console.error('Error reading', excelFile, err.message);
  }
});
