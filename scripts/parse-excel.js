const XLSX = require('xlsx');
const fs = require('fs');

// 读取Excel文件
const workbook = XLSX.readFile('/tmp/student_list.xlsx');

// 获取所有工作表名称
const sheetNames = workbook.SheetNames;
console.log('工作表名称:', sheetNames);

// 遍历每个工作表
const allData = {};
sheetNames.forEach(sheetName => {
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  allData[sheetName] = jsonData;
  console.log(`\n${sheetName} 工作表数据 (共${jsonData.length}条):`);
  console.log(JSON.stringify(jsonData.slice(0, 5), null, 2)); // 显示前5条
});

// 保存为JSON文件
fs.writeFileSync('/tmp/students.json', JSON.stringify(allData, null, 2));
console.log('\n数据已保存到 /tmp/students.json');
