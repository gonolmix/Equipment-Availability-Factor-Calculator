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
const form = getElement<HTMLFormElement>('calculator-form');

const tnInput = getElement<HTMLInputElement>('tn');
const tvInput = getElement<HTMLInputElement>('tv');
const calculateBtn = getElement<HTMLButtonElement>('calculate');
const resultBlock = getElement<HTMLDivElement>('result');
const kgValue = getElement<HTMLDivElement>('kg-value');
const statusText = getElement<HTMLDivElement>('status');
const errorDiv = getElement<HTMLDivElement>('error');
const historyBody = getElement<HTMLTableSectionElement>('history-body');
const clearHistoryBtn = getElement<HTMLButtonElement>('clear-history');

const STORAGE_KEY = 'calculator-history';
const MAX_HISTORY_ENTRIES = 10;

const KG_HIGH_THRESHOLD = 0.95;
const KG_SATISFACTORY_THRESHOLD = 0.80;

// validation function
function validateInputs(): ValidationResult
{
  const errors: string[] = [];
  const tn = tnInput.valueAsNumber;
  const tv = tvInput.valueAsNumber;

  // tn validation
  if (tnInput.value.trim() === '' || isNaN(tn)) {
    errors.push(" Tn: please, input number");
  }
  else if (tn < 0){
    errors.push(" Tn must be ≥ 0");
  }
  
  // tv validation
  if (tvInput.value.trim() === '' || isNaN(tv)) {
    errors.push(" Tv: please, input number");
  } else if (tv < 0) {
    errors.push(" Tv must be ≥ 0");
  }

  if (tn === 0 && tv === 0)
  {
    errors.push(" Tn and Tv cannot both be 0");
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
    throw new Error(' Tn and Tv must be ≥ 0');
  }
  if (tn === 0 && tv === 0) {
    throw new Error(' Tn and Tv cannot both be 0');
  }

  const kg = tn / (tn + tv);
  return kg;
}

// change color function
function getStatus(kg: number): StatusInfo 
{
  if (kg >= KG_HIGH_THRESHOLD) {
    return { 
      colorClass: 'high-reliability', 
      statusText: 'High reliability' 
    };
  } else if (kg >= KG_SATISFACTORY_THRESHOLD) {
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

function isValidHistoryEntry(obj: unknown): obj is HistoryEntry 
{
  if (obj == null){
    return false;
  }

  if (typeof obj !== 'object' || Array.isArray(obj)) {
    return false;
  }
  return (
    'tn' in obj &&
    'tv' in obj &&
    'kg' in obj &&
    'status' in obj &&
    'timeStamp' in obj &&
    typeof (obj as any).tn === 'number' &&
    typeof (obj as any).tv === 'number' &&
    typeof (obj as any).kg === 'number' &&
    typeof (obj as any).status === 'string' &&
    typeof (obj as any).timeStamp === 'string'
  );
}

// get history function
// added try/catch
function getHistory(): HistoryEntry[] 
{
  try{
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) return [];

  const parsed = JSON.parse(saved);

  if (!Array.isArray(parsed)) {
      console.warn('History data is not an array, resetting');
      return [];
  }

  return parsed.filter(isValidHistoryEntry);

  }
  catch (error){
    console.error('Error parsing history from localStorage:', error);
    return [];
  }
}

// add new entry to history function
function saveToHistory(entry: HistoryEntry): void
{
  try{
  const history = getHistory();
  history.unshift(entry);

  if (history.length > MAX_HISTORY_ENTRIES){
    history.length = MAX_HISTORY_ENTRIES; // 10
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }
  catch (error) {
    console.warn('Failed to save history to localStorage:', error);

    // ui alert
    alert('History will not be saved due to browser limitations');
  }
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
    const allErrors = errors.toString();

    if (allErrors.includes("Tn")) {
      showError(tnInput, allErrors);
    }
    if (allErrors.includes("Tv")) {
      showError(tvInput, allErrors);
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
  //saveToHistory(entry);
  //renderHistory();
  saveHistoryWithRender(entry);
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
    kg: parseFloat(kg.toFixed(4)),
    status: statusText,
    timeStamp: new Date().toISOString()
  };
}

// format ISO date function
function formatTimestamp(isoString: string): string {
    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).replace(/\//g, '.')
  .replace(/(\d{2})\.(\d{2})\.(\d{2})/, '$1.$2.$3')
  .replace(/, /, ' ');
}

document.addEventListener('DOMContentLoaded', initialize);

function getElement<T extends HTMLElement>(id: string): T 
{
  const element = document.getElementById(id);
  if (!element){
    throw new Error(`Element with id "${id}" not found in DOM`)
  }
  return element as T;
}

function saveHistoryWithRender(entry: HistoryEntry): void {
  try {
    const history = getHistory();
    
    history.unshift(entry);
    
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.length = MAX_HISTORY_ENTRIES;
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    
    renderHistoryFromData(history);
    
  } catch (error) {
    console.warn('Failed to save history to localStorage:', error);
    alert('History will not be saved due to browser limitations');
    
    renderHistory();
  }
}

// render history from provided data (without reading from localStorage)
function renderHistoryFromData(history: HistoryEntry[]): void {
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
    
    row.append(tnCell, tvCell, kgCell, statusCell, dateCell);
    historyBody.appendChild(row);
  });
}