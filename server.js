const express = require('express');
const multer = require('multer');
const XLSX = require('xlsx');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// SQLite bazasini ulash (fayl sifatida saqlanadi)
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) console.error('Bazaga ulanishda xatolik:', err.message);
  else console.log("SQLite bazasiga ulandi");
});

// Komissiyalar jadvalini yaratish
db.run(`CREATE TABLE IF NOT EXISTS commissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT,
  subcategory TEXT,
  rate REAL
)`);

// 1. Excel faylni qabul qilib bazaga yozish API
app.post('/api/upload-excel', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fayl yuklanmadi' });

  try {
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Eski ma'lumotlarni tozalab, yangi 5000 ta ma'lumotni kiritamiz
    db.run("DELETE FROM commissions", () => {
      const stmt = db.prepare("INSERT INTO commissions (category, subcategory, rate) VALUES (?, ?, ?)");
      
      sheetData.forEach(row => {
        stmt.run(
          row['Kategoriya'] || row['Category'] || 'Boshqa',
          row['Sub-kategoriya'] || row['Subcategory'] || 'Nomaʼlum',
          parseFloat(row['Komissiya'] || row['Rate'] || row['Foiz'] || 10)
        );
      });
      stmt.finalize();

      res.json({ success: true, message: `${sheetData.length} ta ma'lumot bazaga muvaffaqiyatli saqlandi!` });
    });
  } catch (err) {
    res.status(500).json({ error: 'Excel faylni o\'qishda xatolik yuz berdi' });
  }
});

// 2. Ma'lumotlarni bazadan olish va Qidirish API (Qidiurv va sahifalash bilan)
app.get('/api/commissions', (req, res) => {
  const search = req.query.search || '';
  const query = `SELECT * FROM commissions WHERE category LIKE ? OR subcategory LIKE ? LIMIT 100`;
  
  db.all(query, [`%${search}%`, `%${search}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Serverni ishga tushirish
app.listen(5000, () => {
  console.log('Server 5000-portda ishlamoqda...');
});