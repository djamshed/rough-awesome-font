const domSymbolsContainer = document.querySelector('.symbols-container');
const domInspectContainer = document.querySelector('.inspect-container');
const domSearchbox = document.querySelector('.search-box');
const domSymbolTitle = document.querySelector('.inspected-symbol-name');
const domSearchShortcut = document.querySelectorAll('.search-shortcut');
const domFaSymbol = document.querySelector('.inspect-fa-symbol');
const domRoughSymbol = document.querySelector('.inpect-rough-symbol svg');
const domRoughOutput = document.querySelector('.inspect-rough-output');
const rootStyle = document.documentElement.style;

const awesomplete = new Awesomplete(domSearchbox, { minChars: 1 });

const LIMIT = 20;
let symbolsDocument;
let allSymbols = [];
let numRendered = 0;
let currentPattern = 'hachure-pattern';
let currentSymbol = '';

function renderSymbols(container, symbols = []) {
  if (!container) return;

  const html = symbols
    .map((symbol) => {
      return `<div class="icon-container" data-symbol="${symbol}">
    <div class="icon" data-symbol="${symbol}">
      <svg  viewBox="0 0 100 100" data-symbol="${symbol}">
        <use data-symbol="${symbol}" xlink:href="rough/rough-brands.svg#rough_${symbol}" class="rough-icon"></use>
      </svg>
    </div>
    <span class="icon-name" data-symbol="${symbol}">${symbol}</a>
  </div>
  `;
    })
    .join('');

  container.insertAdjacentHTML('beforeend', html);
}

const getRandomSymbol = () => {
  const rand = Math.floor(Math.random() * allSymbols.length);
  return allSymbols[rand];
};

async function fetchRawSymbols() {
  const roughBrandSymbols = await fetch(new Request('rough/rough-brands.svg'));

  if (roughBrandSymbols.ok) {
    const parser = new DOMParser();
    symbolsDocument = parser.parseFromString(
      await roughBrandSymbols.text(),
      'image/svg+xml'
    );
  }
}

async function fetchSymbolNames() {
  const response = await fetch(new Request('rough/rough-brands.json'));

  if (response.ok) {
    allSymbols = await response.json();
    awesomplete.list = allSymbols;
  }
}

const updateSvgOutput = () => {
  const color = rootStyle.getPropertyValue('--primary-color');
  const symbolHTML = symbolsDocument.querySelector(`#rough_${currentSymbol}`)
    .outerHTML;

  let patternHTML = '';
  let fill = '';

  if (currentPattern === 'no-pattern') {
    fill = 'fill: none;';
  } else if (currentPattern === 'solid-pattern') {
    fill = `fill: ${color}; fill-opacity: 0.4;`;
  } else if (currentPattern.indexOf('-pattern') > -1) {
    patternHTML = document.querySelector(
      'pattern#' + currentPattern.replace('-pattern', '')
    ).outerHTML;
    fill = `fill: url(#${currentPattern.replace('-pattern', '')});`;
  }

  const svg = `<svg width="50" height="50">
    <style> path { stroke: ${color}; ${fill} } </style>

    ${patternHTML}

    ${symbolHTML}

    <use xlink:href="#rough_${currentSymbol}"></use>

  </svg>`;

  domRoughOutput.value = svg;
};

const updatePattern = (e) => {
  const pattern = e.target.dataset.pattern;
  if (pattern) {
    currentPattern = pattern;
    domSymbolsContainer.className = 'symbols-container ' + pattern;
    domInspectContainer.className = 'inspect-container ' + pattern;
    updateSvgOutput();
  }
};

const updateMainColor = (e) => {
  rootStyle.setProperty('--primary-color', e.target.value);
  updateSvgOutput();
};

const selectSymbol = (symbol) => {
  if (!symbol) symbol = getRandomSymbol();

  currentSymbol = symbol;

  domSymbolTitle.textContent = currentSymbol;
  domSymbolTitle.setAttribute(
    'href',
    `https://fontawesome.com/icons/${currentSymbol}`
  );

  const faSymbol = `<i class="fab fa-${currentSymbol}"></i>`;
  const roughSymbol = `<use xlink:href="rough/rough-brands.svg#rough_${currentSymbol}" class="rough-icon"></use>`;
  domFaSymbol.innerHTML = faSymbol;
  domRoughSymbol.innerHTML = roughSymbol;

  updateSvgOutput();
};

const renderNextBatch = () => {
  if (numRendered < allSymbols.length) {
    renderSymbols(
      domSymbolsContainer,
      allSymbols.slice(numRendered, numRendered + LIMIT)
    );
    numRendered += LIMIT;
  }
};

async function start() {
  // initialize color
  rootStyle.setProperty('--primary-color', '#0099cc');

  document
    .querySelector('.color-picker')
    .addEventListener('change', updateMainColor, false);

  document
    .querySelector('.background-patterns')
    .addEventListener('click', updatePattern, false);

  document
    .querySelector('.load-more')
    .addEventListener('click', renderNextBatch);

  domSearchShortcut.forEach((el) => {
    el.addEventListener('click', () => {
      const symbol = el.textContent === 'random' ? null : el.textContent;
      selectSymbol(symbol);
      domSearchbox.value = '';
    });
  });

  domSearchbox.addEventListener('awesomplete-selectcomplete', () => {
    selectSymbol(domSearchbox.value);
  });

  domSymbolsContainer.addEventListener('click', (e) => {
    selectSymbol(e.target.dataset.symbol);
    domSearchbox.value = '';
  });

  await fetchRawSymbols();
  await fetchSymbolNames();
  renderNextBatch();
  // show random symbol
  selectSymbol();
}

start();
