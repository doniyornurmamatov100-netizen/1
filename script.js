// LocalStorage kalitlari
const STORAGE_KEYS = {
  HISTORY: 'uzum_calc_history',
  PRODUCTS: 'uzum_calc_products',
  SETTINGS: 'uzum_calc_settings'
};

// Statik Komissiya Ma'lumotlari
const COMMISSION_DATA = [
  { category: "Eski elektronika", subcategory: "Smartfonlar", rate: 8 },
  { category: "Kiyim va poyabzal", subcategory: "Erkaklar kiyimi", rate: 15 },
  { category: "Kiyim va poyabzal", subcategory: "Ayollar kiyimi", rate: 18 },
  { category: "Uy-ro'zg'or buyumlari", subcategory: "Oshxona jihozlari", rate: 12 },
  { category: "Go'zallik va parvarish", subcategory: "Kosmetika", rate: 14 },
  { category: "Aksessuarlar", subcategory: "Soatlar va taqinchoqlar", rate: 20 }
];

let expensesChart = null;

// Tizimni ishga tushirish
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initCalculator();
  initCommissionTable();
  loadHistoryTable();
  loadProductsTable();
  initSettings();
});

// 1. Tablar navigatsiyasi
function initNavigation() {
  const menuItems = document.querySelectorAll('.menu-item');
  const tabContents = document.querySelectorAll('.tab-content');

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      menuItems.forEach(m => m.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));

      item.classList.add('active');
      document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
  });
}

// 2. Kalkulyator mantigi va Grafik
function initCalculator() {
  const inputs = ['sotuvNarxi', 'tannarx', 'komissiya', 'soliq', 'logistika', 'reklama'];
  
  inputs.forEach(id => {
    document.getElementById(id).addEventListener('input', calculateResults);
  });

  document.getElementById('saveResultBtn').addEventListener('click', saveToHistory);
  document.getElementById('saveProductBtn').addEventListener('click', saveToProducts);

  initChart();
  calculateResults();
}

function calculateResults() {
  const sotuvNarxi = parseFloat(document.getElementById('sotuvNarxi').value) || 0;
  const tannarx = parseFloat(document.getElementById('tannarx').value) || 0;
  const komissiyaFoiz = parseFloat(document.getElementById('komissiya').value) || 0;
  const soliqFoiz = parseFloat(document.getElementById('soliq').value) || 0;
  const logistika = parseFloat(document.getElementById('logistika').value) || 0;
  const reklama = parseFloat(document.getElementById('reklama').value) || 0;

  // Formulalar
  const komissiyaSumma = sotuvNarxi * (komissiyaFoiz / 100);
  const soliqSumma = sotuvNarxi * (soliqFoiz / 100);
  const umumiyXarajat = tannarx + komissiyaSumma + soliqSumma + logistika + reklama;
  const sofFoyda = sotuvNarxi - umumiyXarajat;

  const marja = sotuvNarxi > 0 ? (sofFoyda / sotuvNarxi) * 100 : 0;
  const roi = tannarx > 0 ? (sofFoyda / tannarx) * 100 : 0;

  // UI yangilash
  document.getElementById('resSofFoyda').innerText = formatNumber(sofFoyda);
  document.getElementById('resMarja').innerText = marja.toFixed(1).replace('.', ',') + '%';
  document.getElementById('resROI').innerText = roi.toFixed(1).replace('.', ',') + '%';

  // Grafikni yangilash
  updateChart([tannarx, komissiyaSumma, logistika, soliqSumma, reklama, Math.max(0, sofFoyda)]);
}

function initChart() {
  const ctx = document.getElementById('expensesChart').getContext('2d');
  expensesChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Tannarx', 'Komis.', 'Logist.', 'Soliq', 'Reklama', 'Foyda'],
      datasets: [{
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: [
          '#0b1a48',
          '#3b82f6',
          '#60a5fa',
          '#6366f1',
          '#818cf8',
          '#0091ff'
        ],
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: { display: false }
      }
    }
  });
}

function updateChart(data) {
  if (expensesChart) {
    expensesChart.data.datasets[0].data = data;
    expensesChart.update();
  }
}

// 3. Tarix va Mahsulotlarni Saqlash
function saveToHistory() {
  const data = getFormData();
  let history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
  history.unshift({
    id: Date.now(),
    date: new Date().toLocaleDateString('uz-UZ'),
    ...data
  });
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  loadHistoryTable();
  alert("Hisob-kitob tarixga saqlandi!");
}

function saveToProducts() {
  const name = prompt("Mahsulot nomini kiriting:");
  if (!name) return;

  const data = getFormData();
  let products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
  products.unshift({
    id: Date.now(),
    name: name,
    ...data
  });
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  loadProductsTable();
  alert("Mahsulot muvaffaqiyatli saqlandi!");
}

function getFormData() {
  const sotuvNarxi = parseFloat(document.getElementById('sotuvNarxi').value) || 0;
  const tannarx = parseFloat(document.getElementById('tannarx').value) || 0;
  const komissiya = parseFloat(document.getElementById('komissiya').value) || 0;
  const soliq = parseFloat(document.getElementById('soliq').value) || 0;
  const logistika = parseFloat(document.getElementById('logistika').value) || 0;
  const reklama = parseFloat(document.getElementById('reklama').value) || 0;

  const komissiyaSumma = sotuvNarxi * (komissiya / 100);
  const soliqSumma = sotuvNarxi * (soliq / 100);
  const sofFoyda = sotuvNarxi - (tannarx + komissiyaSumma + soliqSumma + logistika + reklama);
  const marja = sotuvNarxi > 0 ? (sofFoyda / sotuvNarxi) * 100 : 0;
  const roi = tannarx > 0 ? (sofFoyda / tannarx) * 100 : 0;

  return { sotuvNarxi, tannarx, komissiya, soliq, logistika, reklama, sofFoyda, marja, roi };
}

// 4. Jadvallarni yuklash va render qilish
function loadHistoryTable() {
  const tbody = document.getElementById('historyTableBody');
  const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
  
  if (history.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color: #94a3b8;">Tarix mavjud emas</td></tr>`;
    return;
  }

  tbody.innerHTML = history.map(item => `
    <tr>
      <td>${item.date}</td>
      <td>${formatNumber(item.sotuvNarxi)} so'm</td>
      <td>${formatNumber(item.tannarx)} so'm</td>
      <td>${item.komissiya}%</td>
      <td>${item.soliq}%</td>
      <td>${formatNumber(item.logistika)} so'm</td>
      <td>${formatNumber(item.reklama)} so'm</td>
      <td style="font-weight:700; color:var(--primary-blue);">${formatNumber(item.sofFoyda)} so'm</td>
      <td><button class="btn btn-sm btn-outline-danger" onclick="deleteHistoryItem(${item.id})">O'chirish</button></td>
    </tr>
  `).join('');
}

function loadProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  const products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: #94a3b8;">Mahsulotlar mavjud emas</td></tr>`;
    return;
  }

  tbody.innerHTML = products.map(item => {
    const xarajatlar = item.sotuvNarxi - item.sofFoyda - item.tannarx;
    return `
      <tr>
        <td style="font-weight:600;">${item.name}</td>
        <td>${formatNumber(item.sotuvNarxi)} so'm</td>
        <td>${formatNumber(item.tannarx)} so'm</td>
        <td>${formatNumber(xarajatlar)} so'm</td>
        <td style="font-weight:700; color:var(--primary-blue);">${formatNumber(item.sofFoyda)} so'm</td>
        <td>${item.marja.toFixed(1)}%</td>
        <td>${item.roi.toFixed(1)}%</td>
        <td><button class="btn btn-sm btn-outline-danger" onclick="deleteProductItem(${item.id})">O'chirish</button></td>
      </tr>
    `;
  }).join('');
}

function initCommissionTable() {
  const tbody = document.getElementById('commissionTableBody');
  tbody.innerHTML = COMMISSION_DATA.map(item => `
    <tr>
      <td>${item.category}</td>
      <td>${item.subcategory}</td>
      <td style="font-weight:600;">${item.rate}%</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="applyCommission(${item.rate})">Kalkulyatorga o'tkazish</button>
      </td>
    </tr>
  `).join('');
}

function applyCommission(rate) {
  document.getElementById('komissiya').value = rate;
  document.querySelector('[data-tab="calc"]').click();
  calculateResults();
}

// O'chirish funktsiyalari
window.deleteHistoryItem = function(id) {
  let history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');
  history = history.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  loadHistoryTable();
};

window.deleteProductItem = function(id) {
  let products = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS) || '[]');
  products = products.filter(item => item.id !== id);
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  loadProductsTable();
};

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  if (confirm("Barcha tarixni o'chirib tashlamoqchimisiz?")) {
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    loadHistoryTable();
  }
});

// Sozlamalar
function initSettings() {
  const settings = JSON.parse(localStorage.getItem(STORAGE_KEYS.SETTINGS) || '{"tax": 4}');
  document.getElementById('defaultTax').value = settings.tax;

  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const tax = parseFloat(document.getElementById('defaultTax').value) || 0;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ tax }));
    document.getElementById('soliq').value = tax;
    calculateResults();
    alert("Sozlamalar saqlandi!");
  });
}

// Yordamchi funktsiya: raqamlarni formatlash (100000 -> 100 000)
function formatNumber(num) {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
// Excel faylni o'qish va yuklash
function handleExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      
      // Birinchi sahifani o'qish
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // JSON formatga o'tkazish (Massiv)
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        alert("Fayl bo'sh yoki noto'g'ri formatda!");
        return;
      }

      console.log("Yuklangan ma'lumotlar:", jsonData.length);

      // Ma'lumotlarni moslashtirish (Kategoriya, Sub-kategoriya, Rate ustunlarini qidirish)
      const formattedData = jsonData.map(item => ({
        category: item['Kategoriya'] || item['Category'] || 'Boshqa',
        subcategory: item['Sub-kategoriya'] || item['Subcategory'] || item['Nomi'] || 'Nomaʼlum',
        rate: parseFloat(item['Komissiya'] || item['Rate'] || item['Foiz'] || 10)
      }));

      // LocalStorage ga saqlash yoki Backendga yuborish
      localStorage.setItem('uzum_commission_data', JSON.stringify(formattedData));
      
      // Jadvalni yangilash
      loadCustomCommissionTable(formattedData);
      alert(`Muvaffaqiyatli! ${formattedData.length} ta ma'lumot yuklandi.`);

    } catch (error) {
      console.error(error);
      alert("Faylni o'qishda xatolik yuz berdi!");
    }
  };
  reader.readAsArrayBuffer(file);
}

// Yuklangan ma'lumotlarni jadvalga chiqarish (sahifalash yoki to'liq ko'rsatish)
function loadCustomCommissionTable(data) {
  const tbody = document.getElementById('commissionTableBody');
  
  // 5000 tadan ko'p bo'lsa brauzer qotib qolmasligi uchun birinchi 100 tasini ko'rsatib turishimiz mumkin, qolgani qidiruv yoki baza uchun saqlanadi
  const displayData = data.slice(0, 100); 

  tbody.innerHTML = displayData.map(item => `
    <tr>
      <td>${item.category}</td>
      <td>${item.subcategory}</td>
      <td style="font-weight:600;">${item.rate}%</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="applyCommission(${item.rate})">Kalkulyatorga o'tkazish</button>
      </td>
    </tr>
  `).join('');

  if (data.length > 100) {
    console.log(`Jami ${data.length} tadan 100 tasi jadvalda ko'rsatildi. Qolganlari xotirada saqlandi.`);
  }
}
let allCommissionsData = []; // Barcha yuklangan ma'lumotlarni saqlash uchun massiv

// Excel yuklanganda ma'lumotni shu o'zgaruvchiga ham saqlaymiz
function handleExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        alert("Fayl bo'sh!");
        return;
      }

      // Ma'lumotlarni moslashtiramiz
      allCommissionsData = jsonData.map(item => ({
        category: item['Kategoriya'] || item['Category'] || 'Boshqa',
        subcategory: item['Sub-kategoriya'] || item['Subcategory'] || item['Nomi'] || 'Nomaʼlum',
        rate: parseFloat(item['Komissiya'] || item['Rate'] || item['Foiz'] || 10)
      }));

      localStorage.setItem('uzum_commission_data', JSON.stringify(allCommissionsData));
      renderCommissionTable(allCommissionsData.slice(0, 50)); // Birinchi 50 tasini chiqaramiz
      alert(`Muvaffaqiyatli! ${allCommissionsData.length} ta ma'lumot yuklandi.`);

    } catch (error) {
      console.error(error);
      alert("Faylni o'qishda xatolik!");
    }
  };
  reader.readAsArrayBuffer(file);
}

// Qidirish funksiyasi
function filterCommissions() {
  const query = document.getElementById('commissionSearch').value.toLowerCase();
  
  // Agar ma'lumot localStorangete bo'lsa uni ham olamiz
  if (allCommissionsData.length === 0) {
    allCommissionsData = JSON.parse(localStorage.getItem('uzum_commission_data') || '[]');
  }

  const filtered = allCommissionsData.filter(item => 
    item.category.toLowerCase().includes(query) || 
    item.subcategory.toLowerCase().includes(query)
  );

  renderCommissionTable(filtered.slice(0, 50)); // Natijaning birinchi 50 tasini ko'rsatish
}

function renderCommissionTable(data) {
  const tbody = document.getElementById('commissionTableBody');
  if (data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">Ma'lumot topilmadi</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(item => `
    <tr>
      <td>${item.category}</td>
      <td>${item.subcategory}</td>
      <td style="font-weight:600;">${item.rate}%</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="applyCommission(${item.rate})">Kalkulyatorga o'tkazish</button>
      </td>
    </tr>
  `).join('');
}