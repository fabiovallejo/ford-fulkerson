export default function BuildScreen({
  nodes,
  edges: initialEdges,
  source,
  sink,
  onPickS,
  onPickT,
  onBack,
  onRun,
}) {
  // ====== Layout 4x4 ======
  const GRID_COLS = 4;
  const VB_W = 1800, VB_H = 850;
  const PAD_X = 20, PAD_Y = 80;
  const innerW = VB_W - PAD_X * 2;
  const innerH = VB_H - PAD_Y * 2;
  const stepX = innerW / (GRID_COLS - 1);
  const stepY = innerH / (GRID_COLS - 1);

  // Posiciones de nodos
  const pos = {};
  nodes.slice(0, 16).forEach((id, i) => {
    const col = i % GRID_COLS;
    const row = Math.floor(i / GRID_COLS);
    pos[id] = { x: PAD_X + col * stepX, y: PAD_Y + row * stepY };
  });

  // ====== Utils ======
  const randInt = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const sampleNoRep = (arr, k) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, k);
  };

  // Limita a máx. 3 salientes por nodo fuente
  function limitOutDegree(edges, maxOut = 3) {
    const bySrc = new Map();
    for (const e of edges) {
      if (!bySrc.has(e.source)) bySrc.set(e.source, []);
      bySrc.get(e.source).push(e);
    }
    const trimmed = [];
    for (const [src, list] of bySrc.entries()) {
      // criterio simple: mantener targets "más cercanos"
      const sorted = list.slice().sort((e1, e2) => {
        const t1 = parseInt(e1.target, 10), t2 = parseInt(e2.target, 10);
        return t1 - t2;
      });
      trimmed.push(...sorted.slice(0, maxOut));
    }
    return trimmed;
  }

  // === Capacidades deseadas ===
  const CAP_MIN = 1;
  const CAP_MAX = 50;

  // Genera entre 1 y 3 salientes por nodo, capacidades 1..50
  function generateEdges1to3(nodes) {
    const COLS = 4;
    const col = (i) => i % COLS;
    const edges = [];
    const used = new Set();

    for (let i = 0; i < nodes.length; i++) {
      const u = nodes[i];
      const cu = col(i);

      // candidatos: solo a la derecha
      const candidates = [];
      for (let j = 0; j < nodes.length; j++) {
        if (col(j) > cu) candidates.push(nodes[j]);
      }
      if (candidates.length === 0) continue;

      const k = Math.min(3, randInt(1, 3), candidates.length);

      for (const v of sampleNoRep(candidates, k)) {
        const key = `${u}->${v}`;
        if (used.has(key)) continue;
        used.add(key);
        edges.push({
          id: `e${u}_${v}`,
          source: u,
          target: v,
          capacity: randInt(CAP_MIN, CAP_MAX), // 1..50
        });
      }
    }
    return edges;
  }

  // --- AQUÍ ESTABA EL PROBLEMA ---
  // Si vienen initialEdges (con capacidades 1..3), ahora:
  // 1) limitamos out-degree a 3
  // 2) RE-SORTEAMOS capacidad en 1..50 para cada arista
  const edges = initialEdges.length
    ? limitOutDegree(initialEdges, 3).map((e) => ({
        ...e,
        capacity: randInt(CAP_MIN, CAP_MAX),
      }))
    : generateEdges1to3(nodes);

  // ====== Selección S/T ======
  const handleLeftClick = (id) => { if (id !== sink) onPickS(id); };
  const handleRightClick = (e, id) => { e.preventDefault(); if (id !== source) onPickT(id); };

  // ====== Parámetros visuales ======
  const NODE_R = 25;
  const ARROW_LEN = 3;
  const START_GAP = 3;
  const END_GAP = NODE_R + ARROW_LEN + 2;
  const LABEL_DIST = 80;
  const LABEL_OFF = -12;

  return (
    <div className="w-screen min-h-screen bg-[#F2F2F2] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center bg-[#295BF2] w-full min-h-26 py-2">
        <div className="text-[#F2F2F2] text-xl md:text-2xl lg:text-3xl font-medium text-center px-4">
          SELECCIONA EL NODO FUENTE (click izquierdo) y el nodo SUMIDERO (click derecho)
        </div>
      </div>

      {/* Main */}
      <div className="flex-1">
        <svg
          className="w-full h-[80vh] bg-[#F2F2F2] rounded-xl"
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Flecha reusable */}
          <defs>
            <marker id="arrow" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="12" markerHeight="12" orient="auto">
              <path d="M 0 0 L 12 6 L 0 12 z" fill="#555" />
            </marker>
          </defs>

          {/* Aristas dirigidas con etiqueta + chip adaptativo */}
          {edges.map((e) => {
            const a = pos[e.source], b = pos[e.target];
            if (!a || !b) return null;

            const dx = b.x - a.x, dy = b.y - a.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len, uy = dy / len;
            const nx = -uy, ny = ux;

            const sx = a.x + ux * (NODE_R + START_GAP);
            const sy = a.y + uy * (NODE_R + START_GAP);
            const ex = b.x - ux * END_GAP;
            const ey = b.y - uy * END_GAP;

            const lx = a.x + ux * LABEL_DIST + nx * LABEL_OFF;
            const ly = a.y + uy * LABEL_DIST + ny * LABEL_OFF;

            const capStr = String(e.capacity ?? "");
            const chipW = Math.max(22, 12 + capStr.length * 9);
            const chipH = 18;

            return (
              <g key={e.id}>
                <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#555" strokeWidth="1.8" markerEnd="url(#arrow)" />
                <rect x={lx - chipW / 2} y={ly - chipH / 2 - 1} width={chipW} height={chipH} rx="4" ry="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.8" />
                <text x={lx} y={ly + 3} textAnchor="middle" className="fill-gray-800 select-none" style={{ fontSize: 14, fontWeight: 700 }}>
                  {e.capacity}
                </text>
              </g>
            );
          })}

          {/* Nodos */}
          {nodes.slice(0, 16).map((id) => {
            const p = pos[id];
            const isS = id === source;
            const isT = id === sink;
            const fill = isS ? "#D3CEF2" : isT ? "#295BF2" : "#91B2F2";

            return (
              <g key={id} onClick={() => handleLeftClick(id)} onContextMenu={(e) => handleRightClick(e, id)} className="cursor-pointer">
                <circle cx={p.x} cy={p.y} r={NODE_R} fill={fill} strokeWidth={isS || isT ? 3 : 2} />
                <text x={p.x} y={p.y + 6} textAnchor="middle" className="fill-black select-none" style={{ fontSize: 16, fontWeight: 600 }}>
                  {id}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer */}
      <div className="flex justify-between bg-[#295BF2] px-6 md:px-10 h-[9vh]">
        <button className="rounded bg-[#0511F2] px-5 my-4 text-[#F2F2F2]" onClick={onBack}>Volver al menú</button>
        <button className="rounded bg-[#0511F2] px-5 my-4 text-[#F2F2F2] disabled:opacity-50" disabled={!source || !sink} onClick={onRun}>
          Ejecutar Ford–Fulkerson
        </button>
      </div>
    </div>
  );
}
