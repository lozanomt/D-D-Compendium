const { Plugin } = require('obsidian');

function number(value) {
  const text = value.trim().replace(/,/g, '');
  if (/^\d+\/\d+$/.test(text)) { const [a,b] = text.split('/').map(Number); return a/b; }
  return text !== '' && Number.isFinite(Number(text)) ? Number(text) : null;
}
function matches(value, query) {
  const comparison = query.trim().match(/^(<=|>=|<|>|=)\s*(\d+(?:[./]\d+)?)$/);
  if (comparison) {
    const actual = number(value), expected = number(comparison[2]);
    if (actual === null || expected === null) return false;
    return {'<':actual<expected,'>':actual>expected,'<=':actual<=expected,'>=':actual>=expected,'=':actual===expected}[comparison[1]];
  }
  return value.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}
function enhance(table) {
  if (table.dataset.dndFilters) return;
  const headers = [...(table.tHead?.rows[0]?.cells || [])];
  if (!headers.some(h => h.textContent.trim() === 'Creature') || !headers.some(h => h.textContent.trim() === 'CR')) return;
  table.dataset.dndFilters = 'true';
  table.classList.add('dnd-filter-table');
  const doc = table.ownerDocument;
  const rows = [...table.tBodies].flatMap(body => [...body.rows]);
  const values = new Map(rows.map(row => [row,[...row.cells].map(c => c.textContent.trim())]));
  const toolbar = doc.createElement('div'); toolbar.className = 'dnd-table-controls';
  const count = doc.createElement('span'); count.setAttribute('role','status'); count.setAttribute('aria-live','polite');
  const reset = doc.createElement('button'); reset.textContent = 'Reset filters and sorting'; reset.type = 'button';
  toolbar.append(count,reset); table.before(toolbar);
  const filters = [];
  const apply = () => {
    let visible = 0;
    for (const row of rows) { row.hidden = !filters.every((input,i) => matches(values.get(row)[i] || '',input.value)); if (!row.hidden) visible++; }
    count.textContent = `${visible} of ${rows.length} creatures`;
  };
  headers.forEach((header,index) => {
    const label = header.textContent.trim(); header.textContent = ''; header.scope = 'col';
    const button = doc.createElement('button'); button.type = 'button'; button.textContent = label+' ↕'; button.title = 'Sort by '+label;
    const input = doc.createElement('input'); input.type = 'search'; input.placeholder = label === 'CR' ? 'e.g. <=5 or =1/2' : 'Filter '+label.toLowerCase();
    input.setAttribute('aria-label','Filter '+label); input.addEventListener('input',apply); filters.push(input);
    button.addEventListener('click',() => {
      const descending = header.getAttribute('aria-sort') === 'ascending';
      headers.forEach(h => h.removeAttribute('aria-sort')); header.setAttribute('aria-sort',descending?'descending':'ascending');
      const sorted = [...rows].sort((a,b) => {
        const av = values.get(a)[index] || '', bv = values.get(b)[index] || '';
        const an = number(av), bn = number(bv);
        const order = an !== null && bn !== null ? an-bn : av.localeCompare(bv,undefined,{numeric:true});
        return (descending?-1:1)*order;
      });
      table.tBodies[0].append(...sorted);
    });
    header.append(button,input);
  });
  reset.addEventListener('click',() => { filters.forEach(i => {i.value='';}); headers.forEach(h => h.removeAttribute('aria-sort')); table.tBodies[0].append(...rows); apply(); });
  apply();
}
module.exports = class SourceTables extends Plugin {
  onload() {
    this.registerMarkdownPostProcessor(el => {
      if (el.matches?.('table')) enhance(el);
      el.querySelectorAll('table').forEach(enhance);
    });
  }
};
module.exports.enhance = enhance;
module.exports.matches = matches;
