const rough = require('roughjs');
const generator = rough.generator();
const { parse, scale, stringify } = require('svg-path-tools');
const Utils = require('./util');

const SCALE = 0.1; // SVG symbols are typically high-res, scale symbols down (no need to be precise)
const SOURCE = 'raw/fontawesome-free-5.13.0-web/sprites/brands.svg';
const DESTINATION = 'dist/rough';

const scalePath = (d, { scaleBy = 1, decimals = 1 }) => {
  return stringify(scale(parse(d), { scale: scaleBy, round: decimals }));
};

const wrapIntoSvg = (symbols, className) => {
  const cls = className ? `class="${className}"` : '';
  return `<svg ${cls} xmlns="http://www.w3.org/2000/svg">
  ${symbols}
</svg>`;
};

const createPattern = ({ name, options = { fill: 'red' } }) => {
  const r = generator.rectangle(0, 0, 60, 60, options);
  const [fill] = generator.toPaths(r);

  const d = scalePath(fill.d, { decimals: 1 });
  return `<pattern id="${name}" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
  <path fill="none" d="${d}" />
</pattern>`;
};

function roughenSymbol(d, viewBox, id) {
  const scaledPath = scalePath(d, { scaleBy: SCALE });
  const roughPaths =
    generator.toPaths(generator.path(scaledPath, { roughness: 0.8 })) || [];
  const rOutlines = roughPaths.map(
    (rp) =>
      `<path class="rough-outline" fill="none" d="${scalePath(rp.d, {
        decimals: 1,
      })}"/>`
  );
  const vb = `viewBox="${viewBox.x} ${viewBox.y} ${Math.ceil(
    viewBox.width * SCALE
  )} ${Math.ceil(viewBox.height * SCALE)}"`;
  return `<symbol id="${id}" ${vb}>
  <title>${id}</title>
  ${rOutlines.join('')}
  <path class="rough-mask" stroke="none" d="${scaledPath}"/>
</symbol>`;
}

const processSymbol = ({ names = [], roughSymbols = '' }, symbol) => {
  const id = Utils.extractSymbolId(symbol);
  const viewBox = Utils.extractViewbox(symbol);
  const svgPath = Utils.extractPath(symbol);

  return {
    names: names.concat(id),
    roughSymbols: `${roughSymbols}\n${roughenSymbol(svgPath, viewBox, id)}`,
  };
};

async function startSprites() {
  const sprite = await Utils.getFileContent(SOURCE);
  const symbols = sprite.match(/<symbol[^>]*>((.|\n)*?)<\/symbol>/g);

  const { names, roughSymbols } = symbols.reduce(processSymbol, {
    names: [],
    roughSymbols: '',
  });

  const roughSvgSprite = wrapIntoSvg(roughSymbols);

  // save to file
  await Utils.saveFile(`${DESTINATION}/rough-brands.svg`, roughSvgSprite);
  await Utils.saveFile(
    `${DESTINATION}/rough-brands.json`,
    JSON.stringify(names)
  );

  const patterns = [
    {
      name: 'hachure',
      options: {
        fillStyle: 'hachure',
        stroke: 'none',
        fill: 'red',
        hachureAngle: 150,
        fillWidth: 1,
        hachureGap: 5,
      },
    },
    {
      name: 'zigzag',
      options: {
        stroke: 'none',
        fillStyle: 'zigzag',
        fill: 'red',
        fillWidth: 1,
        hachureGap: 8,
      },
    },
    {
      name: 'cross-hatch',
      options: {
        stroke: 'none',
        fillStyle: 'cross-hatch',
        fill: 'red',
        fillWidth: 1,
        hachureGap: 8,
      },
    },
    {
      name: 'dashed',
      options: {
        stroke: 'none',
        fillStyle: 'dashed',
        fill: 'red',
        hachureGap: 6,
      },
    },
  ];
  const patternSVG = patterns.map(createPattern);
  await Utils.saveFile(
    `${DESTINATION}/rough-patterns.svg`,
    wrapIntoSvg(patternSVG.join('\n'), 'patterns-container')
  );
}

startSprites();
