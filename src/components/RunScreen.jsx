import { useEffect, useMemo } from "react";

export default function RunScreen({
  nodes, edges, source, sink,
  snapshots, stepIndex, setSnapshots, setStepIndex, setMaxFlow,
  onBackToMenu, onResults
}) {
  // ---------- Algoritmo Ford–Fulkerson (DFS) ----------
  function fordFulkerson(nodes, edges, s, t) {
    const cap={}, flow={}, adj={};
    const ensure=(u,v)=>{ cap[u]??={}; cap[u][v]??=0; flow[u]??={}; flow[u][v]??=0; (adj[u]??=new Set()).add(v); (adj[v]??=new Set()).add(u); };
    edges.forEach(e=>{ ensure(e.source,e.target); cap[e.source][e.target]+=e.capacity; });
    const residual=(u,v)=>(cap[u]?.[v]??0)-(flow[u]?.[v]??0);
    const key=(u,v)=>`${u}->${v}`;
    const total=()=>Object.values(flow[s]||{}).reduce((a,b)=>a+b,0);
    const snap=(path=[])=>{
      const flows={}, caps={};
      for (const u in cap) for (const v in cap[u]) { flows[key(u,v)]=flow[u]?.[v]??0; caps[key(u,v)]=cap[u][v]; }
      return { value: total(), flows, caps, path: path.map(([u,v])=>key(u,v)) };
    };
    const dfsPath=()=>{
      const parent={[s]:null}, st=[s];
      while(st.length){
        const u=st.pop();
        for (const v of adj[u]||[]){
          if(parent[v]==null && residual(u,v)>0){ parent[v]=u; if(v===t) return rebuild(parent,s,t); st.push(v); }
        }
      }
      return null;
    };
    const rebuild=(par,s,t)=>{ const p=[]; let v=t; while(par[v]!=null){ const u=par[v]; p.push([u,v]); v=u; } return p.reverse(); };

    const snaps=[snap([])];
    while(true){
      const path=dfsPath(); if(!path) break;
      let b=Infinity; for (const [u,v] of path) b=Math.min(b, residual(u,v));
      for (const [u,v] of path){ flow[u][v]=(flow[u]?.[v]??0)+b; flow[v][u]=(flow[v]?.[u]??0)-b; }
      snaps.push(snap(path));
    }
    return { maxFlow: total(), snapshots: snaps };
  }
  // -----------------------------------------------------

  // Corre una sola vez al entrar
  const run = useMemo(() => fordFulkerson(nodes, edges, String(source), String(sink)), [nodes, edges, source, sink]);

  useEffect(()=>{ setSnapshots(run.snapshots); setStepIndex(0); setMaxFlow(run.maxFlow); }, [run]);

  const snap = snapshots[stepIndex] || { value:0, flows:{}, caps:{}, path:[] };
  const isLast = stepIndex === (snapshots.length-1);

  // Render rápido del grafo (SVG) con labels f/c y resaltado del camino
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const pos = {}; nodes.forEach((id,i)=> pos[id] = { x: 120 + (i%cols)*180, y: 100 + Math.floor(i/cols)*140 });
  const inPath = new Set(snap.path || []);

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="text-lg font-semibold">Paso {Math.min(stepIndex+1, snapshots.length)}/{snapshots.length}</div>
        <div className="space-x-2">
          <button className="rounded bg-gray-200 px-3 py-1" onClick={onBackToMenu}>Volver al menú</button>
          <button className="rounded bg-gray-200 px-3 py-1" onClick={()=>setStepIndex(i=>Math.max(0,i-1))}>Anterior</button>
          {!isLast && <button className="rounded bg-indigo-600 px-3 py-1 text-white" onClick={()=>setStepIndex(i=>Math.min(snapshots.length-1,i+1))}>Siguiente</button>}
          {isLast && <button className="rounded bg-emerald-600 px-3 py-1 text-white" onClick={onResults}>Ver resultados</button>}
        </div>
      </div>

      <svg className="w-full h-[520px] bg-gray-50 rounded-xl">
        {edges.map(e=>{
          const a=pos[e.source], b=pos[e.target];
          const k=`${e.source}->${e.target}`;
          const highlight = inPath.has(k);
          const label = `${snap.flows?.[k]??0}/${snap.caps?.[k]??e.capacity}`;
          return (
            <g key={e.id}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={highlight ? '#ef4444' : '#555'} strokeWidth={highlight?3:1.5}/>
              <text x={(a.x+b.x)/2} y={(a.y+b.y)/2 - 6}
                    className={`text-xs ${highlight?'fill-red-500 font-bold':'fill-gray-800'}`}>{label}</text>
            </g>
          );
        })}
        {nodes.map(id=>{
          const p=pos[id]; const isS=id===String(source); const isT=id===String(sink);
          return (
            <g key={id}>
              <circle cx={p.x} cy={p.y} r="18" fill={isS?'#ef4444':isT?'#1d4ed8':'#e5e7eb'} />
              <text x={p.x} y={p.y+4} textAnchor="middle" className="text-sm fill-black">{id}</text>
            </g>
          );
        })}
      </svg>

      <div className="mt-3 text-sm text-gray-700">
        Flujo total actual: <b>{snap.value}</b>
      </div>
    </div>
  );
}
