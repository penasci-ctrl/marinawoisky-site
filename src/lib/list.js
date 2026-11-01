// Comportamento comum de Publicações e Textos: filtro + abrir/fechar a linha com transição suave
export function wireList() {
  const items = [...document.querySelectorAll('[data-item]')];
  const btns = document.querySelectorAll('[data-filters] button');
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    items.forEach((el) => { el.hidden = b.dataset.f !== 'all' && el.dataset.kind !== b.dataset.f; });
  }));
  items.forEach((el) => {
    const toggle = el.querySelector('[data-toggle]');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const open = el.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  });
}
