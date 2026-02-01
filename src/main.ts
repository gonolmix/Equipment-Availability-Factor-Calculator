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

type StatusType = 'high' | 'satisfactory' | 'low';

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

const tnInput = document.getElementById('tn') as HTMLInputElement;
const tvInput = document.getElementById('tv') as HTMLInputElement;
const calculateBtn = document.getElementById('calculate') as HTMLButtonElement;
const resultBlock = document.getElementById('resoult') as HTMLDivElement;
const kgValue = document.getElementById('kg-value') as HTMLDivElement;
const statusText = document.getElementById('status') as HTMLDivElement;
const errorDiv = document.getElementById('error') as HTMLDivElement;
const historyBody = document.getElementById('history-body') as HTMLTableSectionElement;
const clearHistoryBtn = document.getElementById('clear-history') as HTMLButtonElement;

// validation function
function ValidateInputs(): ValidationResult
{
  const errors: string[] = [];
  const tn = parseFloat(tnInput.value);
  const tv = parseFloat(tvInput.value);

  // tn validation
  if (tnInput.value.trim() === '' || isNaN(tn)) {
    errors.push("Tн: please, input number");
  }
  else if (tn <= 0){
    errors.push("Tн must be > 0");
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
function ShowError(field: HTMLInputElement, message: string): void 
{
  field.classList.add('error');

  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// hide error function
function ClearError(field: HTMLInputElement): void
{
  field.classList.remove('error');

  if (!tnInput.classList.contains('error') && !tvInput.classList.contains('error')){
    errorDiv.style.display = 'none';
  }
}

// calculation Kg function
function CalculateKg (tn: number, tv: number): number
{
  const kg = tn / (tn + tv);
  return parseFloat(kg.toFixed(4));
}

// change color function
function GetStatus(kg: number): StatusInfo 
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
function GetHistory(): HistoryEntry[] 
{
  const saved = localStorage.getItem('calculator-history');
  return saved ? JSON.parse(saved) : [];
}

// add new entry to history function
function SaveToHistory(entry: HistoryEntry): void
{
  const history = GetHistory();
  history.unshift(entry);

  if (history.length > 10){
    history.length = 10;
  }

  localStorage.setItem('calculator-history', JSON.stringify(history));
}

// remove history from local storage function
function ClearHistory(): void
{
  localStorage.removeItem('calculator-history');
}

// render cells in history table
function RenderHistory(): void {
  const history = GetHistory();
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
    dateCell.textContent = entry.timeStamp;
    
    row.appendChild(tnCell);
    row.appendChild(tvCell);
    row.appendChild(kgCell);
    row.appendChild(statusCell);
    row.appendChild(dateCell);
    
    historyBody.appendChild(row);
  });
}

// reset ui function
function UpdateUI(): void 
{
  const {valid, errors} = ValidateInputs();

  ClearError(tnInput);
  ClearError(tvInput);

  if (!valid)
  {
    const firstError = errors[0];
    errorDiv.textContent = firstError;
    errorDiv.style.display = 'block';

    if (firstError.includes("Tн")) {
      ShowError(tnInput, firstError);
    }
    else {
      ShowError(tvInput, firstError);
    }

    calculateBtn.disabled = true;
    return;
  }
  calculateBtn.disabled = false;
  errorDiv.style.display = 'none';
}

// display result function
function DisplayResult(kg: number, status: StatusInfo): void 
{
  kgValue.textContent = kg.toFixed(4);
  statusText.textContent = status.statusText;

  resultBlock.classList.remove('high-reliability', 'satisfactory', 'low-reliability');

  resultBlock.classList.add(status.colorClass);
}

// calculate button function
function HandleCalculate(): void 
{
  const {valid} = ValidateInputs();
  if (!valid) return;

  const tn = parseFloat(tnInput.value);
  const tv = parseFloat(tvInput.value);

  const kg = CalculateKg(tn, tv);
  const status = GetStatus(kg);

  DisplayResult(kg, status);

  const entry: HistoryEntry = {
    tn,
    tv,
    kg,
    status: status.statusText,
    timeStamp: new Date().toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', '')
  };

  SaveToHistory(entry);
  RenderHistory();
}

// clear history handler
function HandleClearHistory(): void 
{
  if (confirm("Clear all history?"))
  {
    ClearHistory();
    RenderHistory();
  }
}

function Initialize(): void 
{
    RenderHistory();

    tnInput.addEventListener('input', UpdateUI);
    tvInput.addEventListener('input', UpdateUI);

    calculateBtn.addEventListener('click', HandleCalculate);

    tnInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter'){
        e.preventDefault();
        if (ValidateInputs().valid){
          HandleCalculate();
        }
      }
    });

    tvInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter'){
        e.preventDefault();
        if (ValidateInputs().valid){
          HandleCalculate();
        }
      }
    });

    clearHistoryBtn.addEventListener('click', HandleClearHistory);

    UpdateUI();

}

document.addEventListener('DOMContentLoaded', Initialize);