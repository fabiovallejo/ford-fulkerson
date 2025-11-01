import { useMemo } from "react";
import GraphCanvas from "./GraphCanvas.jsx";
import { calculateLayout, calculatePositions } from "./layoutUtils.js";

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
  const VB_W = 1800, VB_H = 700;
  
  const layout = useMemo(() => calculateLayout(nodes.length, VB_W, VB_H), [nodes.length]);
  
  const pos = useMemo(() => calculatePositions(nodes, layout), [nodes, layout]);

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

  function limitOutDegree(edges, maxOut = 3) {
    const bySrc = new Map();
    for (const e of edges) {
      if (!bySrc.has(e.source)) bySrc.set(e.source, []);
      bySrc.get(e.source).push(e);
    }
    const trimmed = [];
    for (const [, list] of bySrc.entries()) {
      const sorted = list.slice().sort((e1, e2) => {
        const t1 = parseInt(e1.target, 10), t2 = parseInt(e2.target, 10);
        return t1 - t2;
      });
      trimmed.push(...sorted.slice(0, maxOut));
    }
    return trimmed;
  }

  // ====== Capacidades deseadas ======
  const CAP_MIN = 1, CAP_MAX = 50;

  function generateEdges1to3(nodes) {
    const { cols } = layout;
    const col = (i) => i % cols;
    const edges = [];
    const used = new Set();

    for (let i = 0; i < nodes.length; i++) {
      const u = nodes[i];
      const cu = col(i);

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
          capacity: randInt(CAP_MIN, CAP_MAX),
        });
      }
    }
    return edges;
  }

  const edges = useMemo(() => {
    if (initialEdges && initialEdges.length) {
      return limitOutDegree(initialEdges, 3).map((e) => ({
        ...e,
        capacity:
          e.capacity != null
            ? Math.max(CAP_MIN, Math.min(CAP_MAX, Math.round(e.capacity)))
            : randInt(CAP_MIN, CAP_MAX),
      }));
    }
    return generateEdges1to3(nodes);
  }, [initialEdges, nodes]);

  const handleLeftClick = (id) => { if (id !== sink) onPickS(id); };
  const handleRightClick = (e, id) => { 
    e.preventDefault(); 
    if (id !== source) onPickT(id); 
  };

  return (
    <div className="w-screen min-h-screen bg-[#F2F2F2] flex flex-col">
      <div className="flex items-center justify-center bg-[#295BF2] w-full py-4">
        <div className="text-[#F2F2F2] text-2xl font-semibold text-center px-4">
          SELECCIONA EL NODO FUENTE (click izquierdo) y el nodo SUMIDERO (click derecho)
        </div>
      </div>

      <div className="flex-1 p-4">
        <GraphCanvas
          nodes={nodes}
          edges={edges}
          source={source}
          sink={sink}
          pos={pos}
          onNodeClick={handleLeftClick}
          onNodeRightClick={handleRightClick}
          isInteractive={true}
        />
      </div>

      <div className="flex justify-between items-center bg-[#295BF2] px-10 py-4">
        <button 
          className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] transition-all duration-300" 
          onClick={onBack}
        >
          ← Volver al menú
        </button>
        <button 
          className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#0511F2] disabled:cursor-not-allowed" 
          disabled={!source || !sink} 
          onClick={onRun}
        >
          Ejecutar Ford–Fulkerson →
        </button>
      </div>
    </div>
  );
}