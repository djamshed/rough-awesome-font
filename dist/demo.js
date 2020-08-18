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

const DISPLAY_BATCH_SIZE = 20;

const symbolsDocument = new Document();
let allSymbols = [];
let symbolType = {};
let numRendered = 0;
let currentPattern = 'hachure-pattern';
let currentSymbol = '';

function renderSymbols(container, symbols = []) {
  if (!container) return;

  const html = symbols
    .map((symbol) => {
      const { id } = getSymbolDetails(symbol);
      return `<div class="icon-container" data-symbol="${symbol}">
    <div class="icon" data-symbol="${symbol}">
      <svg  viewBox="0 0 100 100" data-symbol="${symbol}">
        <use data-symbol="${symbol}" xlink:href="${id}" class="rough-icon"></use>
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
  const promises = [
    'rough/rough-brands.svg',
    'rough/rough-regular.svg',
    'rough/rough-solid.svg',
  ].map((url) => fetch(url));

  // fetch all files
  const responses = await Promise.all(promises);
  // read responses
  const svgs = await Promise.all(responses.map((r) => r.text()));

  const body = document.createElement('body');
  svgs.forEach((rawSvg) => {
    let svg = new DOMParser().parseFromString(rawSvg, 'image/svg+xml');
    body.appendChild(svg.querySelector('svg'));
  });

  symbolsDocument.appendChild(body);
}

async function fetchSymbolNames() {
  const promises = [
    'rough/rough-brands.json',
    'rough/rough-regular.json',
    'rough/rough-solid.json',
  ].map((url) => fetch(url));

  // fetch all files
  const responses = await Promise.all(promises);
  // read responses
  const [brands, regular, solid] = await Promise.all(
    responses.map((r) => r.json())
  );
  // update global vars
  symbolType.brands = new Set(brands);
  symbolType.regular = new Set(regular);
  symbolType.solid = new Set(solid);
  allSymbols = [].concat(solid).concat(brands).concat(regular);

  awesomplete.list = allSymbols;
}

const updateSvgOutput = () => {
  const symbolHTML = symbolsDocument?.querySelector(`#rough_${currentSymbol}`)
    ?.outerHTML;

  if (!symbolHTML) return;
  const color = rootStyle.getPropertyValue('--primary-color');
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

  const svg = `<svg width="150" height="150">
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

const getSymbolDetails = (symbolName) => {
  if (symbolType.brands.has(symbolName))
    return {
      className: `fab fa-${symbolName}`,
      id: `rough/rough-brands.svg#rough_${symbolName}`,
    };
  if (symbolType.solid.has(symbolName))
    return {
      className: `fas fa-${symbolName}`,
      id: `rough/rough-solid.svg#rough_${symbolName}`,
    };
  if (symbolType.regular.has(symbolName))
    return {
      className: `far fa-${symbolName}`,
      id: `rough/rough-regular.svg#rough_${symbolName}`,
    };
  return { className: '', id: '' };
};

const selectSymbol = (symbol) => {
  if (!symbol) symbol = getRandomSymbol();

  currentSymbol = symbol;

  domSymbolTitle.textContent = currentSymbol;
  domSymbolTitle.setAttribute(
    'href',
    `https://fontawesome.com/icons/${currentSymbol}`
  );

  const { className, id } = getSymbolDetails(currentSymbol);

  const faSymbol = `<i class="${className}"></i>`;
  const roughSymbol = `<use xlink:href="${id}" class="rough-icon"></use>`;
  domFaSymbol.innerHTML = faSymbol;
  domRoughSymbol.innerHTML = roughSymbol;

  updateSvgOutput();
};

const renderNextBatch = () => {
  if (numRendered < allSymbols.length) {
    renderSymbols(
      domSymbolsContainer,
      allSymbols.slice(numRendered, numRendered + DISPLAY_BATCH_SIZE)
    );
    numRendered += DISPLAY_BATCH_SIZE;
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
