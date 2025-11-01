import { useState } from "react";

export default function MenuScreen({ onGenerate }) {
  const [count, setCount] = useState(16);

  const generate = () => {
    const n = count;
    const nodes = Array.from({length:n}, (_,i)=>String(i+1));
    const cols = 4;
    const perCol = Math.ceil(n/cols);
    const colOf = (i)=> Math.min(Math.floor(i/perCol), cols-1);

    const edges = [];
    for (let i=0;i<n;i++){
      for (let j=i+1;j<n;j++){
        if (colOf(i) < colOf(j) && Math.random() < 0.35){
          edges.push({
            id:`e${i+1}_${j+1}`,
            source:String(i+1),
            target:String(j+1),
            capacity: 1 + Math.floor(Math.random()*10)
          });
        }
      }
    }
    if (edges.length===0) {
      for (let c=0;c<cols-1;c++){
        const u = String(c*perCol+1);
        const v = String((c+1)*perCol+1);
        edges.push({id:`e${u}_${v}`, source:u, target:v, capacity:5});
      }
      edges.push({id:`e${(cols-1)*perCol+1}_${n}`, source:String((cols-1)*perCol+1), target:String(n), capacity:5});
    }
    onGenerate(nodes, edges);
  };

  return (
    <div className="rounded-xl text-center bg-[#F2F2F2]">
      <h1 className="text-[40px] font-bold">Problema del Flujo Máximo</h1>
      <p className="text-gray-600 text-[32px] mb-12">Algoritmo de Ford–Fulkerson</p>

      <div className="mb-6">
        <div className="mb-10 text-[24px]">Selecciona el número de nodos</div>
        <div className="flex items-center justify-center">
          <button className="rounded bg-[#295BF2] hover:bg-[#0511F2] transition-all duration-500 text-[#F2F2F2] text-[20px] w-[65px] h-[55px] hover:cursor-pointer" onClick={()=>setCount(c=>Math.max(4,c-1))}><i className="fa-solid fa-minus"></i></button>
          <div className="flex flex-col items-center justify-center w-[200px] h-[55px] bg-[#D3CEF2]">
            <div className="text-[20px]">{count}</div>
          </div>
          <button className="rounded bg-[#295BF2] hover:bg-[#0511F2] transition-all duration-500 text-[#F2F2F2] text-[20px] w-[65px] h-[55px] hover:cursor-pointer" onClick={()=>setCount(c=>c+1)}><i className="fa-solid fa-plus"></i></button>
        </div>
      </div>

    <div className="mb-10 text-[24px]">Selecciona el modo de generación</div>
    <div className="gap-15 flex justify-center">
        <button className="w-[200px] h-[55px] rounded-md bg-[#0511F2] hover:bg-[#295BF2] transition-all duration-500 text-[#F2F2F2] text-[24px]  hover:cursor-pointer" onClick={generate}>Aleatoria</button>
        <button className="w-[200px] h-[55px] rounded-md bg-[#0511F2] hover:bg-[#295BF2] transition-all duration-500 text-[#F2F2F2] text-[24px] hover:cursor-pointer" onClick={generate}>Manual</button>
    </div>
    </div>
  );
}
