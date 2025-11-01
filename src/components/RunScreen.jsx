import { useMemo, useState, useEffect } from "react";
import GraphCanvas from "./GraphCanvas";
import { calculateLayout, calculatePositions } from "./layoutUtils";

export default function RunScreen({ 
  nodes, 
  edges, 
  source, 
  sink, 
  onBackToMenu,
  onResults,
  setMaxFlow
}) {
  const VB_W = 1800, VB_H = 700;
  
  const layout = useMemo(() => calculateLayout(nodes.length, VB_W, VB_H), [nodes.length]);
  
  const pos = useMemo(() => calculatePositions(nodes, layout), [nodes, layout]);

  const [flow, setFlow] = useState(() => new Map());
  const [currentPath, setCurrentPath] = useState([]);
  const [bottleneck, setBottleneck] = useState(null);
  const [maxFlowValue, setMaxFlowValue] = useState(0);
  const [finished, setFinished] = useState(false);
  const [minCut, setMinCut] = useState(null);

  const key = (u, v) => `${u}->${v}`;

  const buildResidual = () => {
    const adj = new Map();
    const add = (u, item) => {
      if (!adj.has(u)) adj.set(u, []);
      adj.get(u).push(item);
    };
    for (const e of edges) {
      const f = flow.get(key(e.source, e.target)) || 0;
      const capFwd = e.capacity - f;
      if (capFwd > 0) {
        add(e.source, { v: e.target, cap: capFwd, dir: "f", base: e });
      }
      if (f > 0) {
        add(e.target, { v: e.source, cap: f, dir: "b", base: e });
      }
    }
    return adj;
  };

  function findAugmentingPathDFS(s, t) {
    const residual = buildResidual();
    const stack = [[s, [], Infinity]];
    const visited = new Set();

    while (stack.length) {
      const [u, path, minCap] = stack.pop();
      if (u === t) return { path, bottleneck: minCap };

      if (visited.has(u)) continue;
      visited.add(u);

      const neigh = residual.get(u) || [];
      for (const { v, cap, dir, base } of neigh) {
        if (cap <= 0) continue;
        if (visited.has(v)) continue;
        const nextPath = path.concat([{ u, v, cap, dir, base }]);
        stack.push([v, nextPath, Math.min(minCap, cap)]);
      }
    }
    return null;
  }

  // Calcular corte mínimo usando BFS desde source en grafo residual
  const calculateMinCut = () => {
    const residual = buildResidual();
    const reachable = new Set();
    const queue = [source];
    reachable.add(source);

    while (queue.length) {
      const u = queue.shift();
      const neigh = residual.get(u) || [];
      for (const { v, cap } of neigh) {
        if (cap > 0 && !reachable.has(v)) {
          reachable.add(v);
          queue.push(v);
        }
      }
    }

    // Encontrar aristas del corte (de reachable a no-reachable)
    const cutEdges = [];
    let cutCapacity = 0;

    for (const e of edges) {
      if (reachable.has(e.source) && !reachable.has(e.target)) {
        const f = flow.get(key(e.source, e.target)) || 0;
        cutEdges.push({
          ...e,
          flow: f
        });
        cutCapacity += e.capacity;
      }
    }

    return {
      sourceSet: Array.from(reachable),
      sinkSet: nodes.filter(n => !reachable.has(n)),
      cutEdges,
      cutCapacity
    };
  };

  const doOneStep = () => {
    if (finished) return;

    const res = findAugmentingPathDFS(source, sink);
    if (!res) {
      setFinished(true);
      setCurrentPath([]);
      setBottleneck(null);
      // Calcular corte mínimo al terminar
      const cut = calculateMinCut();
      setMinCut(cut);
      return;
    }

    const { path, bottleneck } = res;

    const newFlow = new Map(flow);
    for (const seg of path) {
      const { dir, base } = seg;
      if (dir === "f") {
        const k = key(base.source, base.target);
        newFlow.set(k, (newFlow.get(k) || 0) + bottleneck);
      } else {
        const k = key(base.source, base.target);
        newFlow.set(k, (newFlow.get(k) || 0) - bottleneck);
      }
    }

    setFlow(newFlow);
    setCurrentPath(path);
    setBottleneck(bottleneck);
    setMaxFlowValue(mf => mf + bottleneck);
  };

  // Actualizar maxFlow en App cuando cambie
  useEffect(() => {
    if (setMaxFlow) {
      setMaxFlow(maxFlowValue);
    }
  }, [maxFlowValue, setMaxFlow]);

  const handleBackToMenu = () => {
    setFlow(new Map());
    setCurrentPath([]);
    setBottleneck(null);
    setMaxFlowValue(0);
    setFinished(false);
    setMinCut(null);
    onBackToMenu();
  };

  const handleViewResults = () => {
    if (setMaxFlow) {
      setMaxFlow(maxFlowValue);
    }
    onResults();
  };

  return (
    <div className="w-screen min-h-screen bg-[#F2F2F2] flex flex-col">

      <div className="flex-1 p-4 relative">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          source={source}
          sink={sink}
          pos={pos}
          flow={flow}
          currentPath={currentPath}
          isInteractive={false}
        />
        
        {/* Visualización del corte mínimo */}
        {finished && minCut && (
          <svg
            className="absolute top-4 left-4 w-full h-full pointer-events-none"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Línea de corte */}
            {minCut.cutEdges.map((e, idx) => {
              const a = pos[e.source], b = pos[e.target];
              if (!a || !b) return null;
              
              const midX = (a.x + b.x) / 2;
              const midY = (a.y + b.y) / 2;
              const dx = b.x - a.x;
              const dy = b.y - a.y;
              const len = Math.hypot(dx, dy);
              const nx = -dy / len;
              const ny = dx / len;
              
              // Línea perpendicular atravesando la arista
              const cutLen = 30;
              
              return (
                <g key={`cut-${idx}`}>
                  <line
                    x1={midX - nx * cutLen}
                    y1={midY - ny * cutLen}
                    x2={midX + nx * cutLen}
                    y2={midY + ny * cutLen}
                    stroke="#EF4444"
                    strokeWidth="4"
                    strokeDasharray="10,5"
                  />
                  <text
                    x={midX + nx * (cutLen + 15)}
                    y={midY + ny * (cutLen + 15)}
                    className="fill-red-600 font-bold text-sm"
                    style={{ fontSize: 14 }}
                  >
                    Corte
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      <div className="bg-white border-t-4 border-[#295BF2] px-8 py-5">
        <div className="max-w-6xl mx-auto">
          {finished && minCut ? (
            <div className="bg-green-100 border-l-4 border-green-600 p-4 rounded">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-green-900 text-xl font-bold mb-2">
                    ✓ Algoritmo completado
                  </p>
                  <p className="text-green-800 text-base">
                    <span className="font-semibold">Conjunto S (alcanzable desde fuente):</span> {minCut.sourceSet.join(', ')}
                  </p>
                  <p className="text-green-800 text-base mt-1">
                    <span className="font-semibold">Conjunto T (no alcanzable):</span> {minCut.sinkSet.join(', ')}
                  </p>
                  <p className="text-green-800 text-base mt-1">
                    <span className="font-semibold">Aristas en el corte:</span> {minCut.cutEdges.map(e => `(${e.source}→${e.target})`).join(', ')}
                  </p>
                </div>
                <div className="bg-green-600 text-white px-6 py-3 rounded-lg ml-4">
                  <p className="text-sm font-medium">Flujo Máximo</p>
                  <p className="text-3xl font-bold">{maxFlowValue}</p>
                </div>
              </div>
            </div>
          ) : currentPath.length ? (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <p className="text-blue-900 font-semibold text-lg mb-2">Camino aumentante encontrado:</p>
                  <p className="text-blue-700 text-xl font-mono bg-white px-3 py-2 rounded border border-blue-200">
                    {currentPath.map(s => `${s.u}→${s.v}`).join(" → ")}
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-center">
                    <p className="text-xs font-medium mb-1">Cuello de botella</p>
                    <p className="text-2xl font-bold">{bottleneck}</p>
                  </div>
                  <div className="flex-1 bg-blue-700 text-white px-4 py-3 rounded-lg text-center">
                    <p className="text-xs font-medium mb-1">Flujo actual</p>
                    <p className="text-2xl font-bold">{maxFlowValue}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 border-l-4 border-gray-400 p-4 rounded">
              <p className="text-gray-800 text-lg">
                ℹ️ Presiona <span className="font-bold">"Siguiente paso"</span> para buscar un camino aumentante
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center bg-[#295BF2] px-10 py-4">
        <button 
          className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] transition-all duration-300" 
          onClick={handleBackToMenu}
        >
          ← Volver al menú
        </button>
        <div className="flex gap-4">
          {finished && (
            <button 
              className="rounded-lg bg-green-600 px-6 py-3 text-white text-lg font-medium hover:bg-green-700 transition-all duration-300" 
              onClick={handleViewResults}
            >
              Ver Resultados Detallados →
            </button>
          )}
          <button
            className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#0511F2] disabled:cursor-not-allowed"
            onClick={doOneStep}
            disabled={finished}
          >
            {finished ? "Finalizado" : "Siguiente paso →"}
          </button>
        </div>
      </div>
    </div>
  );
}