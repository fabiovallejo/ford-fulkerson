export default function GraphCanvas({ 
  nodes, 
  edges, 
  source, 
  sink, 
  flow = null, 
  currentPath = [], 
  pos, 
  onNodeClick, 
  onNodeRightClick, 
  isInteractive = true 
}) {
  const NODE_R = 28;
  const ARROW_LEN = 3;
  const START_GAP = 3;
  const END_GAP = NODE_R + ARROW_LEN + 2;
  const LABEL_DIST = 80;
  const LABEL_OFF = -12;

  const VB_W = 1800, VB_H = 700;

  const key = (u, v) => `${u}->${v}`;
  
  const isInPathForward = (u, v) =>
    currentPath.some(seg => seg.dir === "f" && seg.u === u && seg.v === v);

  const backSegments = currentPath.filter(seg => seg.dir === "b");

  return (
    <svg
      className="w-full h-full bg-[#F2F2F2] rounded-xl"
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <marker id="arrow" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="12" markerHeight="12" orient="auto">
          <path d="M 0 0 L 12 6 L 0 12 z" fill="#555" />
        </marker>
        <marker id="arrowBlue" viewBox="0 0 12 12" refX="12" refY="6" markerWidth="12" markerHeight="12" orient="auto">
          <path d="M 0 0 L 12 6 L 0 12 z" fill="#2563eb" />
        </marker>
      </defs>

      {/* Aristas */}
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

        const f = flow ? (flow.get(key(e.source, e.target)) || 0) : null;
        const inPath = flow ? isInPathForward(e.source, e.target) : false;

        const capStr = f !== null ? `${f}/${e.capacity}` : `${e.capacity}`;
        const chipW = Math.max(32, 16 + capStr.length * 8);
        const chipH = 22;

        return (
          <g key={e.id}>
            <line
              x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={inPath ? "#2563eb" : "#555"}
              strokeWidth={inPath ? 3.5 : 2}
              markerEnd={`url(#${inPath ? "arrowBlue" : "arrow"})`}
            />
            <rect
              x={lx - chipW / 2}
              y={ly - chipH / 2 - 1}
              width={chipW}
              height={chipH}
              rx="5" ry="5"
              fill={inPath ? "#DBEAFE" : "#F8FAFC"}
              stroke={inPath ? "#2563eb" : "#CBD5E1"}
              strokeWidth={inPath ? 1.5 : 1}
            />
            <text
              x={lx} y={ly + 4} textAnchor="middle"
              className={`select-none ${inPath ? "fill-blue-700" : "fill-gray-800"}`}
              style={{ fontSize: 15, fontWeight: 700 }}
            >
              {capStr}
            </text>
          </g>
        );
      })}

      {/* Segmentos hacia atrás */}
      {backSegments.map((seg, i) => {
        const a = pos[seg.u], b = pos[seg.v];
        if (!a || !b) return null;

        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;

        const sx = a.x + ux * (NODE_R + START_GAP);
        const sy = a.y + uy * (NODE_R + START_GAP);
        const ex = b.x - ux * END_GAP;
        const ey = b.y - uy * END_GAP;

        return (
          <line
            key={`back-${i}`}
            x1={sx} y1={sy} x2={ex} y2={ey}
            stroke="#2563eb" strokeWidth="3.5"
            strokeDasharray="8,4"
            markerEnd="url(#arrowBlue)"
          />
        );
      })}

      {/* Nodos */}
      {nodes.map((id) => {
        const p = pos[id];
        if (!p) return null;
        
        const isS = id === source;
        const isT = id === sink;
        const fill = isS ? "#D3CEF2" : isT ? "#295BF2" : "#91B2F2";
        const strokeColor = isS ? "#8B5CF6" : isT ? "#1E40AF" : "#3B82F6";

        return (
          <g 
            key={id} 
            className={isInteractive ? "cursor-pointer" : "cursor-default"}
            onClick={isInteractive ? () => onNodeClick?.(id) : undefined}
            onContextMenu={isInteractive ? (e) => onNodeRightClick?.(e, id) : undefined}
          >
            <circle 
              cx={p.x} 
              cy={p.y} 
              r={NODE_R} 
              fill={fill} 
              stroke={strokeColor}
              strokeWidth={isS || isT ? 3 : 2}
            />
            <text 
              x={p.x} 
              y={p.y + 6} 
              textAnchor="middle"
              className="fill-black select-none pointer-events-none"
              style={{ fontSize: 17, fontWeight: 700 }}
            >
              {id}
            </text>
            {isS && (
              <text 
                x={p.x} 
                y={p.y - NODE_R - 8} 
                textAnchor="middle"
                className="fill-purple-600 select-none pointer-events-none"
                style={{ fontSize: 14, fontWeight: 600 }}
              >
                Fuente
              </text>
            )}
            {isT && (
              <text 
                x={p.x} 
                y={p.y - NODE_R - 8} 
                textAnchor="middle"
                className="fill-blue-800 select-none pointer-events-none"
                style={{ fontSize: 14, fontWeight: 600 }}
              >
                Sumidero
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}