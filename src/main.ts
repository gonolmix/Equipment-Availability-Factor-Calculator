import './style.css'

// classes, interfaces, types
interface HistoryEntry 
{
  tn: number;
  tv: number;
  kg: number;
  status: string;
  timeStamp: string;
}

interface ValidationResult 
{
  valid: boolean;
  errors: string[];
}

interface StatusInfo
{
  colorClass: string;
  statusText: string;
}

// added form
const form = document.getElementById('calculator-form') as HTMLFormElement;

const tnInput = document.getElementById('tn') as HTMLInputElement;
const tvInput = document.getElementById('tv') as HTMLInputElement;
const calculateBtn = document.getElementById('calculate') as HTMLButtonElement;
const resultBlock = document.getElementById('result') as HTMLDivElement;
const kgValue = document.getElementById('kg-value') as HTMLDivElement;
const statusText = document.getElementById('status') as HTMLDivElement;
const errorDiv = document.getElementById('error') as HTMLDivElement;
const historyBody = document.getElementById('history-body') as HTMLTableSectionElement;
const clearHistoryBtn = document.getElementById('clear-history') as HTMLButtonElement;

const STORAGE_KEY = 'calculator-history';
const MAX_HISTORY_ENTRIES = 10;

// validation function
function validateInputs(): ValidationResult
{
  const errors: string[] = [];
  const tn = tnInput.valueAsNumber;
  const tv = tvInput.valueAsNumber;

  // tn validation
  if (tnInput.value.trim() === '' || isNaN(tn)) {
    errors.push("Tн: please, input number");
  }
  else if (tn < 0){
    errors.push("Tн must be ≥ 0");
  }
  
  // tv validation
  if (tvInput.value.trim() === '' || isNaN(tv)) {
    errors.push("Tв: please, input number");
  } else if (tv < 0) {
    errors.push("Tв must be ≥ 0");
  }

  return {
    valid: errors.length === 0, 
    errors
  };
}

// show error function
function showError(field: HTMLInputElement, message: string): void 
{
  field.classList.add('error');

  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// hide error function
function clearError(field: HTMLInputElement): void
{
  field.classList.remove('error');

  if (!tnInput.classList.contains('error') && !tvInput.classList.contains('error')){
    errorDiv.style.display = 'none';
  }
}

// calculation Kg function
function calculateKg(tn: number, tv: number): number
{
  if (tv < 0 || tn < 0) {
    throw new Error('Tн and Tв must be ≥ 0');
  }
  if (tn === 0 && tv === 0) {
    throw new Error('Tн and Tв cannot both be 0');
  }

  const kg = tn / (tn + tv);
  return parseFloat(kg.toFixed(4));
}

// change color function
function getStatus(kg: number): StatusInfo 
{
  if (kg >= 0.95) {
    return { 
      colorClass: 'high-reliability', 
      statusText: 'High reliability' 
    };
  } else if (kg >= 0.80) {
    return { 
      colorClass: 'satisfactory', 
      statusText: 'Satisfactory' 
    };
  } else {
    return { 
      colorClass: 'low-reliability', 
      statusText: 'Low - failure analysis required' 
    };
  }
}

// get history function
// added try/catch
function getHistory(): HistoryEntry[] 
{
  try{
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : [];
  }
  catch (error){
    console.error('Error parsing history from localStorage:', error);
    return [];
  }
}

// add new entry to history function
function saveToHistory(entry: HistoryEntry): void
{
  const history = getHistory();
  history.unshift(entry);

  if (history.length > MAX_HISTORY_ENTRIES){
    history.length = MAX_HISTORY_ENTRIES; // 10
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

// remove history from local storage function
function clearHistory(): void
{
  localStorage.removeItem(STORAGE_KEY);
}

// render cells in history table
function renderHistory(): void {
  const history = getHistory();
  historyBody.innerHTML = '';
  
  history.forEach(entry => {
    const row = document.createElement('tr');
    
    const tnCell = document.createElement('td');
    tnCell.textContent = entry.tn.toString();
    
    const tvCell = document.createElement('td');
    tvCell.textContent = entry.tv.toString();
    
    const kgCell = document.createElement('td');
    kgCell.textContent = entry.kg.toFixed(4);
    
    const statusCell = document.createElement('td');
    statusCell.textContent = entry.status;
    
    const dateCell = document.createElement('td');
    dateCell.textContent = formatTimestamp(entry.timeStamp);
    
    row.appendChild(tnCell);
    row.appendChild(tvCell);
    row.appendChild(kgCell);
    row.appendChild(statusCell);
    row.appendChild(dateCell);
    
    historyBody.appendChild(row);
  });
}

// reset ui function
function updateUI(): void 
{
  const {valid, errors} = validateInputs();

  clearError(tnInput);
  clearError(tvInput);

  if (!valid)
  {
    const firstError = errors[0];

    if (firstError.includes("Tн")) {
      showError(tnInput, firstError);
    }
    else {
      showError(tvInput, firstError);
    }

    calculateBtn.disabled = true;
    return;
  }
  calculateBtn.disabled = false;
  errorDiv.style.display = 'none';
}

// display result function
function displayResult(kg: number, status: StatusInfo): void 
{
  kgValue.textContent = kg.toFixed(4);
  statusText.textContent = status.statusText;

  resultBlock.classList.remove('high-reliability', 'satisfactory', 'low-reliability');

  resultBlock.classList.add(status.colorClass);
}

// calculate button function
function handleCalculate(): void 
{
  const tn = tnInput.valueAsNumber;
  const tv = tvInput.valueAsNumber;

  const kg = calculateKg(tn, tv);
  const status = getStatus(kg);
  const entry = createHistoryEntry(tn, tv, kg, status.statusText);

  displayResult(kg, status);
  saveToHistory(entry);
  renderHistory();
}

// clear history handler
function handleClearHistory(): void 
{
  if (confirm("Clear all history?"))
  {
    clearHistory();
    renderHistory();
  }
}

// rewrited for using form
function initialize(): void 
{
    renderHistory();

    tnInput.addEventListener('input', updateUI);
    tvInput.addEventListener('input', updateUI);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateInputs().valid) {
        handleCalculate();
      }
    });

    clearHistoryBtn.addEventListener('click', handleClearHistory);

    updateUI();

}

// separate create history entry function
function createHistoryEntry(  tn: number, tv: number, kg: number, statusText: string): HistoryEntry {
  return { 
    tn,
    tv,
    kg,
    status: statusText,
    timeStamp: new Date().toISOString()
  };
}

// format ISO date function
function formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', '');
}

document.addEventListener('DOMContentLoaded', initialize);