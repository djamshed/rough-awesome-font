const domSymbolsContainer = document.querySelector('.symbols-container');
const domInspectContainer = document.querySelector('.inspect-container');
const domSearchbox = document.querySelector('.search-box');
const domSymbolTitle = document.querySelector('.inspected-symbol-name');
const domSearchShortcut = document.querySelectorAll('.search-shortcut');
const domFaSymbol = document.querySelector('.inspect-fa-symbol');
const domRoughSymbol = document.querySelector('.inpect-rough-symbol svg');

const awesomplete = new Awesomplete(domSearchbox, { minChars: 1 });
const LIMIT = 20;
let allSymbols = [];
let numRendered = 0;

function renderSymbols(container, symbols = []) {
  if (!container) return;

  const html = symbols
    .map((symbol) => {
      return `<div class="icon-container" data-symbol="${symbol}">
    <div class="icon" data-symbol="${symbol}">
      <svg  viewBox="0 0 100 100" data-symbol="${symbol}">
        <use data-symbol="${symbol}" xlink:href="rough/rough-brands.svg#${symbol}" class="rough-icon"></use>
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

async function fetchAndRender(limit = 100) {
  const response = await fetch(new Request('rough/rough-brands.json'));
  if (response.ok) {
    allSymbols = await response.json();
    awesomplete.list = allSymbols;
    renderNextBatch();

    // show random symbol
    selectSymbol();
  }
}

const updatePattern = (e) => {
  const pattern = e.target.dataset.pattern;
  if (pattern) {
    domSymbolsContainer.className = 'symbols-container ' + pattern;
    domInspectContainer.className = 'inspect-container ' + pattern;
  }
};

const updateMainColor = (e) => {
  document.documentElement.style.setProperty('--primary-color', e.target.value);
};

const selectSymbol = (symbol) => {
  if (!symbol) symbol = getRandomSymbol();

  domSymbolTitle.textContent = symbol;
  domSymbolTitle.setAttribute(
    'href',
    `https://fontawesome.com/icons/${symbol}`
  );

  const faSymbol = `<i class="fab fa-${symbol}"></i>`;
  const roughSymbol = `<use xlink:href="rough/rough-brands.svg#${symbol}" class="rough-icon"></use>`;
  domFaSymbol.innerHTML = faSymbol;
  domRoughSymbol.innerHTML = roughSymbol;
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

function start() {
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

  fetchAndRender(LIMIT);
}

start();
