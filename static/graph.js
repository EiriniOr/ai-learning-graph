/* graph.js — D3 force-directed graph */

const PATH_COLORS = [
  "#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6",
  "#06b6d4","#f97316","#ec4899","#14b8a6","#84cc16",
];

let simulation, svg, g, zoom;
let allConcepts = [], pathsData = {};
let selectedId = null;
let activePath = null;

export function initGraph(data, onSelect) {
  allConcepts = data.concepts;
  pathsData   = data.paths;

  const pathNames = Object.keys(pathsData);
  const colorMap  = Object.fromEntries(pathNames.map((p, i) => [p, PATH_COLORS[i % PATH_COLORS.length]]));
  window._colorMap = colorMap;

  // Build legend
  const legend = document.getElementById("legend");
  legend.innerHTML = pathNames.map(p =>
    `<div class="legend-item">
       <div class="legend-dot" style="background:${colorMap[p]}"></div>
       <span style="color:#94a3b8;font-size:10px">${p}</span>
     </div>`
  ).join("");
  legend.classList.add("show");

  // Build edges: prerequisites + related (deduplicated)
  const idSet = new Set(allConcepts.map(c => c.id));
  const edgeSet = new Set();
  const links = [];
  for (const c of allConcepts) {
    for (const pid of (c.prerequisites || [])) {
      if (!idSet.has(pid)) continue;
      const key = [pid, c.id].sort().join("--");
      if (!edgeSet.has(key)) { edgeSet.add(key); links.push({ source: pid, target: c.id, type: "prereq" }); }
    }
    for (const rid of (c.related || [])) {
      if (!idSet.has(rid)) continue;
      const key = [rid, c.id].sort().join("--");
      if (!edgeSet.has(key)) { edgeSet.add(key); links.push({ source: rid, target: c.id, type: "related" }); }
    }
  }

  const nodes = allConcepts.map(c => ({ ...c }));

  const container = document.getElementById("graph-wrap");
  const W = container.clientWidth, H = container.clientHeight;

  svg = d3.select("#graph-wrap").append("svg")
    .attr("width", W).attr("height", H);

  zoom = d3.zoom().scaleExtent([0.15, 4]).on("zoom", e => g.attr("transform", e.transform));
  svg.call(zoom);

  g = svg.append("g");

  // Links
  const link = g.append("g").selectAll("line")
    .data(links).join("line")
    .attr("class", "link");

  // Nodes
  const node = g.append("g").selectAll(".node")
    .data(nodes).join("g")
    .attr("class", "node")
    .attr("id", d => `node-${d.id}`)
    .call(d3.drag()
      .on("start", (e, d) => { if (!e.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag",  (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on("end",   (e, d) => { if (!e.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }))
    .on("click", (e, d) => { e.stopPropagation(); selectNode(d.id, onSelect); });

  node.append("circle")
    .attr("r", d => d.prerequisites?.length === 0 ? 9 : 7)
    .attr("fill", d => colorMap[d.path] || "#6366f1")
    .attr("stroke", d => colorMap[d.path] || "#6366f1")
    .attr("stroke-opacity", 0.6);

  node.append("text")
    .attr("dy", 16)
    .text(d => d.title.length > 18 ? d.title.slice(0, 16) + "…" : d.title);

  // Tooltip
  node.append("title").text(d => d.short);

  simulation = d3.forceSimulation(nodes)
    .force("link",    d3.forceLink(links).id(d => d.id).distance(80).strength(0.4))
    .force("charge",  d3.forceManyBody().strength(-220))
    .force("center",  d3.forceCenter(W / 2, H / 2))
    .force("collide", d3.forceCollide(28))
    .on("tick", () => {
      link
        .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

  svg.on("click", () => clearSelection(onSelect));

  // Zoom controls
  document.getElementById("btn-zoom-in" ).addEventListener("click", () => svg.transition().call(zoom.scaleBy, 1.4));
  document.getElementById("btn-zoom-out").addEventListener("click", () => svg.transition().call(zoom.scaleBy, 0.7));
  document.getElementById("btn-zoom-fit").addEventListener("click", fitGraph);

  window.addEventListener("resize", () => {
    const W2 = container.clientWidth, H2 = container.clientHeight;
    svg.attr("width", W2).attr("height", H2);
    simulation.force("center", d3.forceCenter(W2 / 2, H2 / 2)).alpha(0.1).restart();
  });
}

export function selectNode(id, onSelect) {
  selectedId = id;
  d3.selectAll(".node").classed("selected", d => d.id === id);
  // Highlight connected edges
  d3.selectAll(".link").classed("highlighted", d =>
    d.source.id === id || d.target.id === id
  );
  onSelect(id);
}

export function clearSelection(onSelect) {
  selectedId = null;
  d3.selectAll(".node").classed("selected", false);
  d3.selectAll(".link").classed("highlighted", false);
  onSelect(null);
}

export function highlightPath(pathName, onSelect) {
  activePath = pathName;
  const pathIds = new Set(window._pathsData?.[pathName] || []);

  d3.selectAll(".node circle").style("opacity", d =>
    !pathName || pathIds.has(d.id) ? 1 : 0.15
  );
  d3.selectAll(".node text").style("opacity", d =>
    !pathName || pathIds.has(d.id) ? 1 : 0.1
  );
  d3.selectAll(".link").style("opacity", d =>
    !pathName || (pathIds.has(d.source.id) && pathIds.has(d.target.id)) ? 0.6 : 0.05
  );
}

export function focusNode(id) {
  const node = d3.select(`#node-${id}`).datum();
  if (!node || node.x == null) return;
  const W = svg.node().clientWidth, H = svg.node().clientHeight;
  svg.transition().duration(500)
    .call(zoom.transform, d3.zoomIdentity.translate(W/2, H/2).scale(1.8).translate(-node.x, -node.y));
}

function fitGraph() {
  const W = svg.node().clientWidth, H = svg.node().clientHeight;
  svg.transition().duration(500)
    .call(zoom.transform, d3.zoomIdentity.translate(W/2, H/2).scale(0.7).translate(-W/2, -H/2));
}
