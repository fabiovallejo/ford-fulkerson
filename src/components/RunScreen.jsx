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
  setMaxFlow,
  setMinCut
}) {
  const VB_W = 1800, VB_H = 700;
  
  const layout = useMemo(() => calculateLayout(nodes.length, VB_W, VB_H), [nodes.length]);
  const pos = useMemo(() => calculatePositions(nodes, layout), [nodes, layout]);

  const [history, setHistory] = useState([{ flow: new Map(), path: [], bottleneck: null, maxFlow: 0 }]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [minCutData, setMinCutData] = useState(null);

  const currentStep = history[currentStepIndex];
  const isAtLatestStep = currentStepIndex === history.length - 1;

  const key = (u, v) => `${u}->${v}`;

  // Construir grafo residual
  const buildResidual = (flowMap) => {
    const adj = new Map();
    edges.forEach(e => {
      const f = flowMap.get(key(e.source, e.target)) || 0;
      
      if (e.capacity - f > 0) {
        if (!adj.has(e.source)) adj.set(e.source, []);
        adj.get(e.source).push({ v: e.target, cap: e.capacity - f, dir: "f", base: e });
      }
      
      if (f > 0) {
        if (!adj.has(e.target)) adj.set(e.target, []);
        adj.get(e.target).push({ v: e.source, cap: f, dir: "b", base: e });
      }
    });
    return adj;
  };

  // Buscar camino aumentante con DFS
  const findAugmentingPath = (s, t, flowMap) => {
    const residual = buildResidual(flowMap);
    const stack = [[s, [], Infinity]];
    const visited = new Set();

    while (stack.length) {
      const [u, path, minCap] = stack.pop();
      if (u === t) return { path, bottleneck: minCap };
      if (visited.has(u)) continue;
      visited.add(u);

      (residual.get(u) || []).forEach(({ v, cap, dir, base }) => {
        if (cap > 0 && !visited.has(v)) {
          stack.push([v, [...path, { u, v, cap, dir, base }], Math.min(minCap, cap)]);
        }
      });
    }
    return null;
  };

  // Calcular corte mínimo
  const calculateMinCut = (flowMap) => {
    const residual = buildResidual(flowMap);
    const reachable = new Set([source]);
    const queue = [source];

    while (queue.length) {
      const u = queue.shift();
      (residual.get(u) || []).forEach(({ v, cap }) => {
        if (cap > 0 && !reachable.has(v)) {
          reachable.add(v);
          queue.push(v);
        }
      });
    }

    const cutEdges = edges
      .filter(e => reachable.has(e.source) && !reachable.has(e.target))
      .map(e => ({ ...e, flow: flowMap.get(key(e.source, e.target)) || 0 }));

    return {
      sourceSet: Array.from(reachable).sort((a, b) => parseInt(a) - parseInt(b)),
      sinkSet: nodes.filter(n => !reachable.has(n)).sort((a, b) => parseInt(a) - parseInt(b)),
      cutEdges,
      cutCapacity: cutEdges.reduce((sum, e) => sum + e.capacity, 0),
      cutFlow: cutEdges.reduce((sum, e) => sum + e.flow, 0)
    };
  };

  // Siguiente paso
  const doNextStep = () => {
    if (finished) return;

    if (currentStepIndex < history.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      return;
    }

    const lastStep = history[history.length - 1];
    const res = findAugmentingPath(source, sink, lastStep.flow);
    
    if (!res) {
      setFinished(true);
      const cut = calculateMinCut(lastStep.flow);
      setMinCutData(cut);
      setMinCut?.(cut);
      return;
    }

    const newFlow = new Map(lastStep.flow);
    res.path.forEach(({ dir, base }) => {
      const k = key(base.source, base.target);
      newFlow.set(k, (newFlow.get(k) || 0) + (dir === "f" ? res.bottleneck : -res.bottleneck));
    });

    setHistory([...history, {
      flow: newFlow,
      path: res.path,
      bottleneck: res.bottleneck,
      maxFlow: lastStep.maxFlow + res.bottleneck
    }]);
    setCurrentStepIndex(history.length);
  };

  const doPrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setFinished(false);
    }
  };

  useEffect(() => {
    setMaxFlow?.(currentStep.maxFlow);
  }, [currentStep.maxFlow, setMaxFlow]);

  const handleBackToMenu = () => {
    setHistory([{ flow: new Map(), path: [], bottleneck: null, maxFlow: 0 }]);
    setCurrentStepIndex(0);
    setFinished(false);
    setMinCutData(null);
    onBackToMenu();
  };

  const handleViewResults = () => {
    setMaxFlow?.(currentStep.maxFlow);
    setMinCut?.(minCutData);
    onResults();
  };

  return (
    <div className="w-screen min-h-screen bg-[#F2F2F2] flex flex-col">
      <div className="flex-1 p-4 relative">
        <div className="relative w-full h-full">
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            source={source}
            sink={sink}
            pos={pos}
            flow={currentStep.flow}
            currentPath={currentStep.path}
            isInteractive={false}
          />
          
          {finished && isAtLatestStep && minCutData && (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
              {minCutData.cutEdges.map((e, idx) => {
                const a = pos[e.source], b = pos[e.target];
                if (!a || !b) return null;
                
                const midX = (a.x + b.x) / 2, midY = (a.y + b.y) / 2;
                const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
                const nx = -dy / len, ny = dx / len, cutLen = 40;
                
                return (
                  <g key={`cut-${idx}`}>
                    <line x1={midX - nx * cutLen} y1={midY - ny * cutLen} x2={midX + nx * cutLen} y2={midY + ny * cutLen} stroke="#DC2626" strokeWidth="5" strokeLinecap="round" />
                    <circle cx={midX - nx * cutLen} cy={midY - ny * cutLen} r="4" fill="#DC2626" />
                    <circle cx={midX + nx * cutLen} cy={midY + ny * cutLen} r="4" fill="#DC2626" />
                  </g>
                );
              })}
            </svg>
          )}
        </div>
      </div>

      <div className="border-[#295BF2] px-8 pb-15">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <span className="bg-[#295BF2] px-4 py-2 rounded-full text-[#F2F2F2] font-semibold">
              Paso {currentStepIndex} de {history.length - 1} {finished && isAtLatestStep && "(Finalizado)"}
            </span>
          </div>

          {finished && isAtLatestStep && minCutData ? (
            <div className="bg-blue-50 border-l-4 border-[#0511F2] p-4 rounded-[3px]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[#295BF2] text-base">
                    <span className="font-[500]">Conjunto S:</span> {`{${minCutData.sourceSet.join(', ')}}`}
                  </p>
                  <p className="text-[#295BF2] text-base mt-1">
                    <span className="font-[500]">Conjunto T:</span> {`{${minCutData.sinkSet.join(', ')}}`}
                  </p>
                  <p className="text-[#295BF2] text-base mt-1">
                    <span className="font-[500]">Aristas del corte:</span> {minCutData.cutEdges.map(e => `${e.source}→${e.target}`).join(', ')}
                  </p>
                </div>
                <div className="bg-[#295BF2] text-white px-6 py-3 rounded-[10px] ml-4 text-center">
                  <p className="text-sm font-medium ">Flujo Máximo</p>
                  <p className="text-3xl font-bold">{currentStep.maxFlow}</p>
                </div>
              </div>
            </div>
          ) : currentStep.path.length ? (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <p className="text-[#295BF2] font-semibold text-lg mb-2">Camino aumentante encontrado:</p>
                  <p className="text-blue-700 text-xl font-mono bg-white px-3 py-2 rounded border border-blue-200">
                    {currentStep.path.map(s => `${s.u}→${s.v}`).join(" → ")}
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-center">
                    <p className="text-xs font-medium mb-1">Cuello de botella</p>
                    <p className="text-2xl font-bold">{currentStep.bottleneck}</p>
                  </div>
                  <div className="flex-1 bg-blue-700 text-white px-4 py-3 rounded-lg text-center">
                    <p className="text-xs font-medium mb-1">Flujo acumulado</p>
                    <p className="text-2xl font-bold">{currentStep.maxFlow}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 border-l-4 border-[#0511F2] p-4 rounded">
              <p className="text-gray-800 text-lg">ℹ️ Presiona <span className="font-bold">"Siguiente paso"</span> para buscar un camino aumentante</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center bg-[#295BF2] px-10 py-4">
        <button className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300" onClick={handleBackToMenu}>
          ← Volver al menú
        </button>
        <div className="flex gap-4 items-center">
          <button className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#0511F2] disabled:cursor-not-allowed" onClick={doPrevStep} disabled={currentStepIndex === 0}>
            ← Paso anterior
          </button>
          {finished && isAtLatestStep && (
            <button className="rounded-lg bg-[#0511F2] px-6 py-3 text-white text-lg font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300" onClick={handleViewResults}>
              Ver Resultados →
            </button>
          )}
          <button className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#0511F2] disabled:cursor-not-allowed" onClick={doNextStep} disabled={finished && isAtLatestStep}>
            {finished && isAtLatestStep ? "Finalizado" : "Siguiente paso →"}
          </button>
        </div>
      </div>
    </div>
  );
}