// src/utils/layoutUtils.js
export function calculateLayout(nodeCount, VB_W = 1800, VB_H = 700) {
  const PAD_X = 120, PAD_Y = 80;
  
  // Determinar columnas según cantidad de nodos
  let cols;
  if (nodeCount <= 9) cols = 3;
  else if (nodeCount <= 12) cols = 3;
  else cols = 4;
  
  const rows = Math.ceil(nodeCount / cols);
  
  const innerW = VB_W - PAD_X * 2;
  const innerH = VB_H - PAD_Y * 2;
  
  const stepX = cols > 1 ? innerW / (cols - 1) : 0;
  const stepY = rows > 1 ? innerH / (rows - 1) : 0;
  
  return { cols, rows, PAD_X, PAD_Y, stepX, stepY };
}

export function calculatePositions(nodes, layout) {
  const p = {};
  const { cols, PAD_X, PAD_Y, stepX, stepY } = layout;
  
  nodes.forEach((id, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    p[id] = { 
      x: PAD_X + col * stepX, 
      y: PAD_Y + row * stepY 
    };
  });
  return p;
}