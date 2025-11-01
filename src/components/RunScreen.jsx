import { useMemo, useState } from "react";
import GraphCanvas from "./GraphCanvas.jsx";
import { calculateLayout, calculatePositions } from "./layoutUtils.js";

export default function RunScreen({ 
  nodes, 
  edges, 
  source, 
  sink, 
  onBackToMenu 
}) {
  const VB_W = 1800, VB_H = 700;
  
  const layout = useMemo(() => calculateLayout(nodes.length, VB_W, VB_H), [nodes.length]);
  
  const pos = useMemo(() => calculatePositions(nodes, layout), [nodes, layout]);

  const [flow, setFlow] = useState(() => new Map());
  const [currentPath, setCurrentPath] = useState([]);
  const [bottleneck, setBottleneck] = useState(null);
  const [maxFlow, setMaxFlow] = useState(0);
  const [finished, setFinished] = useState(false);

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

  const doOneStep = () => {
    if (finished) return;

    const res = findAugmentingPathDFS(source, sink);
    if (!res) {
      setFinished(true);
      setCurrentPath([]);
      setBottleneck(null);
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
    setMaxFlow(mf => mf + bottleneck);
  };

  const handleBackToMenu = () => {
    // Resetear todo el estado antes de volver
    setFlow(new Map());
    setCurrentPath([]);
    setBottleneck(null);
    setMaxFlow(0);
    setFinished(false);
    onBackToMenu();
  };

  return (
    <div className="w-screen min-h-screen bg-[#F2F2F2] flex flex-col">

      <div className="flex-1 p-4">
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
      </div>

      <div className="px-8 pb-10">
        <div className="max-w-6xl mx-auto">
          {finished ? (
            <div className="bg-green-100 border-l-4 border-green-600 p-4 rounded">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-green-900 text-xl font-bold">
                    ✓ Algoritmo completado
                  </p>
                  <p className="text-green-800 text-lg mt-1">
                    No hay más caminos aumentantes disponibles
                  </p>
                </div>
                <div className="bg-green-600 text-white px-6 py-3 rounded-lg">
                  <p className="text-sm font-medium">Flujo Máximo</p>
                  <p className="text-3xl font-bold">{maxFlow}</p>
                </div>
              </div>
            </div>
          ) : currentPath.length ? (
            <div className="bg-[#295BF2] border-l-4 border-[#0511F2] p-4 rounded-[10px]">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <p className="text-[#F2F2F2] font-semibold text-lg mb-2">Camino aumentante encontrado:</p>
                  <p className="text-blue-700 text-xl font-mono bg-[#F2F2F2] px-3 py-2 rounded border border-blue-200">
                    {currentPath.map(s => `${s.u}→${s.v}`).join(" → ")}
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-[#0511F2] text-white px-4 py-3 rounded-lg text-center">
                    <p className="text-xs font-medium mb-1">Cuello de botella</p>
                    <p className="text-2xl font-bold">{bottleneck}</p>
                  </div>
                  <div className="flex-1 bg-[#0511F2] text-white px-4 py-3 rounded-lg text-center">
                    <p className="text-xs font-medium mb-1">Flujo actual</p>
                    <p className="text-2xl font-bold">{maxFlow}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#D3CEF2] border-l-4 border-[#0511F2] p-4 rounded">
              <p className="text-gray-800 text-lg">
                Presiona <span className="text-[#0511F2] font-bold">"Siguiente paso"</span> para buscar un camino aumentante
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
        <button
          className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#0511F2] disabled:cursor-not-allowed"
          onClick={doOneStep}
          disabled={finished}
        >
          {finished ? "Finalizado" : "Siguiente paso →"}
        </button>
      </div>
    </div>
  );
}