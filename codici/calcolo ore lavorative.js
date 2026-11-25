const STORAGE_KEY = 'calcolo_ore_lavorative_data';

let records = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

const form = document.getElementById('workForm');
const tableBody = document.getElementById('workTableBody');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');
const editIndexInput = document.getElementById('editIndex');
const submitBtn = document.getElementById('submitBtn');

const filterStatus = document.getElementById('filterStatus');
const filterLocation = document.getElementById('filterLocation');
const filterPeriod = document.getElementById('filterPeriod');
const customDateContainer = document.getElementById('customDateContainer');
const customStart = document.getElementById('customStart');
const customEnd = document.getElementById('customEnd');
const totalEarningsEl = document.getElementById('totalEarnings');

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function calculateHours(start, end) {
  const diffMs = new Date(end) - new Date(start);
  return (diffMs / (1000 * 60 * 60));
}

function updateLocationDropdown() {
  const currentSelection = filterLocation.value;
  const locations = [...new Set(records.map(r => `${r.location} - ${r.city}`))];
  
  filterLocation.innerHTML = '<option value="all">Tutte le sedi</option>';
  locations.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = loc;
    filterLocation.appendChild(opt);
  });
  filterLocation.value = locations.includes(currentSelection) ? currentSelection : 'all';
}

function checkPeriod(endDateStr, period, startCustom, endCustom) {
  const recordDate = new Date(endDateStr);
  const now = new Date();

  if (period === 'week') {
    const startOfWeek = new Date(now);
    const day = now.getDay() || 7;
    if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
    startOfWeek.setHours(0,0,0,0);
    return recordDate >= startOfWeek && recordDate <= now;
  }
  
  if (period === 'month') {
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  }
  
  if (period === 'year') {
    return recordDate.getFullYear() === now.getFullYear();
  }

  if (period === 'custom' && startCustom && endCustom) {
    const start = new Date(startCustom);
    start.setHours(0,0,0,0);
    const end = new Date(endCustom);
    end.setHours(23,59,59,999);
    return recordDate >= start && recordDate <= end;
  }

  return true;
}

function saveAndRender() {
  records.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  updateLocationDropdown();
  filterAndRender();
}

function filterAndRender() {
  tableBody.innerHTML = '';
  
  const statusVal = filterStatus.value;
  const locationVal = filterLocation.value;
  const periodVal = filterPeriod.value;
  const cStart = customStart.value;
  const cEnd = customEnd.value;

  let totalEarnings = 0;

  records.forEach((rec, index) => {
    // Filtro Stato
    const isPaid = rec.paid || false;
    if (statusVal === 'paid' && !isPaid) return;
    if (statusVal === 'unpaid' && isPaid) return;

    // Filtro Sede
    const recLocationStr = `${rec.location} - ${rec.city}`;
    if (locationVal !== 'all' && recLocationStr !== locationVal) return;

    // Filtro Periodo
    if (!checkPeriod(rec.endDate, periodVal, cStart, cEnd)) return;

    const hours = calculateHours(rec.startDate, rec.endDate);
    const totalPay = hours * rec.hourlyRate;
    totalEarnings += totalPay;

    const paidButtonText = isPaid ? "Pagato ✓" : "Da pagare";
    const paidClass = isPaid ? "btn-paid" : "btn-unpaid";
    const disabledAttr = isPaid ? "disabled" : "";

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(rec.startDate)}</td>
      <td>${formatDate(rec.endDate)}</td>
      <td>${hours.toFixed(2)} h</td>
      <td>€ ${parseFloat(rec.hourlyRate).toFixed(2)}</td>
      <td><strong>€ ${totalPay.toFixed(2)}</strong></td>
      <td>${rec.location}, ${rec.street}, ${rec.city}</td>
      <td>
        <button class="btn ${paidClass}" onclick="togglePaid(${index})" ${disabledAttr}>${paidButtonText}</button>
      </td>
      <td>
        <button class="btn btn-warning" onclick="editRecord(${index})">Modifica</button>
        <button class="btn btn-danger" onclick="deleteRecord(${index})">Elimina</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  totalEarningsEl.textContent = `€ ${totalEarnings.toFixed(2)}`;
}

filterPeriod.addEventListener('change', () => {
  if (filterPeriod.value === 'custom') {
    customDateContainer.style.display = 'grid';
  } else {
    customDateContainer.style.display = 'none';
    filterAndRender();
  }
});

filterStatus.addEventListener('change', filterAndRender);
filterLocation.addEventListener('change', filterAndRender);
customStart.addEventListener('change', filterAndRender);
customEnd.addEventListener('change', filterAndRender);

form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;
  
  if (new Date(endDate) <= new Date(startDate)) {
    alert("La data/ora di fine deve essere successiva a quella di inizio!");
    return;
  }

  const editIndex = parseInt(editIndexInput.value);

  const newRecord = {
    startDate,
    endDate,
    hourlyRate: parseFloat(document.getElementById('hourlyRate').value),
    city: document.getElementById('city').value,
    street: document.getElementById('street').value,
    location: document.getElementById('location').value,
    paid: editIndex !== -1 ? records[editIndex].paid : false
  };

  if (editIndex === -1) {
    records.push(newRecord);
  } else {
    records[editIndex] = newRecord;
    editIndexInput.value = -1;
    submitBtn.textContent = "Aggiungi Turno";
  }

  saveAndRender();
  form.reset();
});

window.togglePaid = function(index) {
  if (!records[index].paid) {
    records[index].paid = true;
    saveAndRender();
  }
};

window.editRecord = function(index) {
  const rec = records[index];
  document.getElementById('startDate').value = rec.startDate;
  document.getElementById('endDate').value = rec.endDate;
  document.getElementById('hourlyRate').value = rec.hourlyRate;
  document.getElementById('city').value = rec.city;
  document.getElementById('street').value = rec.street;
  document.getElementById('location').value = rec.location;

  editIndexInput.value = index;
  submitBtn.textContent = "Salva Modifiche";
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.deleteRecord = function(index) {
  records.splice(index, 1);
  saveAndRender();
};

exportBtn.addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "calcolo ore lavorative.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
});

importBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      records = JSON.parse(event.target.result);
      saveAndRender();
      alert("Dati importati con successo!");
    } catch (err) {
      alert("Errore nel formato del file JSON.");
    }
  };
  reader.readAsText(file);
});

saveAndRender();