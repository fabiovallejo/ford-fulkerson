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
  const CAP_MIN = 1, CAP_MAX = 50;
  
  const layout = useMemo(() => calculateLayout(nodes.length, VB_W, VB_H), [nodes.length]);
  const pos = useMemo(() => calculatePositions(nodes, layout), [nodes, layout]);

  // Generar aristas si no existen
  const edges = useMemo(() => {
    if (initialEdges?.length) {
      // Limitar y normalizar capacidades de aristas existentes
      return initialEdges.slice(0, nodes.length * 3).map(e => ({
        ...e,
        capacity: Math.max(CAP_MIN, Math.min(CAP_MAX, Math.round(e.capacity ?? Math.random() * 49 + 1)))
      }));
    }
    
    // Generar aristas aleatorias
    const { cols } = layout;
    const edges = [];
    const used = new Set();
    
    nodes.forEach((u, i) => {
      const sourceCol = i % cols;
      const targetCandidates = nodes.filter((_, j) => j % cols > sourceCol);
      
      if (targetCandidates.length) {
        const numEdges = Math.min(3, 1 + Math.floor(Math.random() * 3), targetCandidates.length);
        const selected = targetCandidates.sort(() => 0.5 - Math.random()).slice(0, numEdges);
        
        selected.forEach(v => {
          const key = `${u}->${v}`;
          if (!used.has(key)) {
            used.add(key);
            edges.push({
              id: `e${u}_${v}`,
              source: u,
              target: v,
              capacity: Math.floor(Math.random() * 50) + 1
            });
          }
        });
      }
    });
    
    return edges;
  }, [initialEdges, nodes, layout]);

  return (
    <div className="w-screen min-h-screen bg-[#F2F2F2] flex flex-col">
      <div className="flex items-center justify-center bg-[#295BF2] w-full py-6">
        <div className="text-[#F2F2F2] text-[30px] font-semibold text-center px-4">
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
          onNodeClick={(id) => id !== sink && onPickS(id)}
          onNodeRightClick={(e, id) => {
            e.preventDefault();
            id !== source && onPickT(id);
          }}
          isInteractive={true}
        />
      </div>

      <div className="flex justify-between items-center bg-[#295BF2] px-10 py-5">
        <button 
          className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300" 
          onClick={onBack}
        >
          ← Volver al menú
        </button>
        <button 
          className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#0511F2] disabled:cursor-not-allowed" 
          disabled={!source || !sink} 
          onClick={onRun}
        >
          Ejecutar Ford–Fulkerson →
        </button>
      </div>
    </div>
  );
}