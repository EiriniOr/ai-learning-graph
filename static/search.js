/* search.js — fuzzy search over concepts */

export function initSearch(concepts, onSelect) {
  const input   = document.getElementById("search");
  const results = document.getElementById("search-results");

  function score(c, q) {
    let s = 0;
    const t = q.toLowerCase();
    if (c.id.includes(t))            s += 4;
    if (c.title.toLowerCase().includes(t)) s += 4;
    if (c.tags.some(tag => tag.includes(t))) s += 2;
    if (c.path.toLowerCase().includes(t)) s += 2;
    if (c.short.toLowerCase().includes(t)) s += 1;
    return s;
  }

  function render(q) {
    if (!q.trim()) { results.classList.remove("open"); return; }
    const matches = concepts
      .map(c => ({ c, s: score(c, q) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 12);

    if (!matches.length) { results.classList.remove("open"); return; }

    results.innerHTML = matches.map(({ c }) =>
      `<div class="search-item" data-id="${c.id}">
         <div class="search-item-title">${highlight(c.title, q)}</div>
         <div class="search-item-path">${c.path}</div>
       </div>`
    ).join("");
    results.classList.add("open");
  }

  function highlight(text, q) {
    const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.replace(re, "<mark style='background:#6366f1;color:#fff;border-radius:2px;padding:0 1px'>$1</mark>");
  }

  input.addEventListener("input",  e => render(e.target.value));
  input.addEventListener("keydown", e => {
    if (e.key === "Escape") { results.classList.remove("open"); input.blur(); }
  });

  results.addEventListener("click", e => {
    const item = e.target.closest(".search-item");
    if (!item) return;
    const id = item.dataset.id;
    results.classList.remove("open");
    input.value = "";
    onSelect(id);
  });

  document.addEventListener("click", e => {
    if (!e.target.closest("#search-wrap")) results.classList.remove("open");
  });
}
