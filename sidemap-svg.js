export function renderMindmap(root, container) {
  container.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  container.appendChild(svg);

  const width = container.clientWidth;
  const height = container.clientHeight;

  // Very small tree layout (depth-first)
  const nodes = [];
  const links = [];
  let id = 0;

  function walk(node, parentId, depth, angle, radius) {
    const nid = id++;
    nodes.push({id: nid, label: node.title || node, depth, angle, radius});
    if (parentId !== null) links.push({source: parentId, target: nid});
    if (node.children) {
      const step = (Math.PI * 1.6) / node.children.length;
      node.children.forEach((c, i) => {
        walk(c, nid, depth + 1, angle - Math.PI/2 + step * (i - node.children.length/2), radius + 80);
      });
    }
  }

  walk(root, null, 0, 0, width/2 - 100);

  // Draw links
  links.forEach(l => {
    const s = nodes[l.source], t = nodes[l.target];
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const sx = width/2 + s.radius * Math.cos(s.angle);
    const sy = height/2 + s.radius * Math.sin(s.angle);
    const tx = width/2 + t.radius * Math.cos(t.angle);
    const ty = height/2 + t.radius * Math.sin(t.angle);
    line.setAttribute('x1', sx); line.setAttribute('y1', sy);
    line.setAttribute('x2', tx); line.setAttribute('y2', ty);
    line.setAttribute('stroke', '#666');
    svg.appendChild(line);
  });

  // Draw nodes
  nodes.forEach(n => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const x = width/2 + n.radius * Math.cos(n.angle);
    const y = height/2 + n.radius * Math.sin(n.angle);

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x); circle.setAttribute('cy', y);
    circle.setAttribute('r', 8 + n.depth*3);
    circle.setAttribute('fill', n.depth===0 ? '#0066ff' : '#fff');
    circle.setAttribute('stroke', '#0066ff');
    g.appendChild(circle);

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', x); txt.setAttribute('y', y + 4);
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('font-size', 12 - n.depth);
    txt.textContent = n.label.length > 20 ? n.label.slice(0,17)+'…' : n.label;
    g.appendChild(txt);

    svg.appendChild(g);
  });
}