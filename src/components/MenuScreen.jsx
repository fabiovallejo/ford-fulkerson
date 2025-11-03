import { useState } from "react";

export default function MenuScreen({ alGenerar, alManual }) {
  const [cantidad, setCantidad] = useState(16);
  const MIN_NODOS = 8;
  const MAX_NODOS = 16;

  const generarAleatorio = () => {
    const n = cantidad;
    const nodos = Array.from({ length: n }, (_, i) => String(i + 1));
    const columnas = 4;
    const porColumna = Math.ceil(n / columnas);
    const columnaDe = (i) => Math.min(Math.floor(i / porColumna), columnas - 1);

    const aristas = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (columnaDe(i) < columnaDe(j) && Math.random() < 0.35) {
          aristas.push({
            id: `e${i + 1}_${j + 1}`,
            origen: String(i + 1),
            destino: String(j + 1),
            capacidad: 1 + Math.floor(Math.random() * 10),
          });
        }
      }
    }
    if (aristas.length === 0) {
      for (let c = 0; c < columnas - 1; c++) {
        const u = String(c * porColumna + 1);
        const v = String((c + 1) * porColumna + 1);
        aristas.push({ id: `e${u}_${v}`, origen: u, destino: v, capacidad: 5 });
      }
      aristas.push({
        id: `e${(columnas - 1) * porColumna + 1}_${n}`,
        origen: String((columnas - 1) * porColumna + 1),
        destino: String(n),
        capacidad: 5,
      });
    }
    alGenerar(nodos, aristas);
  };

  const generarManual = () => {
    const n = cantidad;
    const nodos = Array.from({ length: n }, (_, i) => String(i + 1));
    alManual(nodos);
  };

  return (
    <div className="rounded-xl text-center">
      <h1 className="text-[40px] font-[600]">Problema del Flujo Máximo</h1>
      <p className="font-[300] text-[32px] mb-12">Algoritmo de Ford–Fulkerson</p>

      <div className="mb-6">
        <div className="mb-10 text-[24px]">Selecciona el número de nodos:</div>
        <div className="flex items-center justify-center">
          <button
            className="rounded bg-[#295BF2] hover:bg-[#0511F2] transition-all duration-500 text-[#F2F2F2] text-[20px] w-[65px] h-[55px] hover:cursor-pointer disabled:cursor-not-allowed"
            onClick={() => setCantidad((c) => Math.max(MIN_NODOS, c - 1))}
            disabled={cantidad <= MIN_NODOS}
          >
            <i className="fa-solid fa-minus"></i>
          </button>
          <div className="flex flex-col items-center justify-center w-[200px] h-[55px] bg-[#D3CEF2]">
            <div className="text-[22px] font-[600]">{cantidad}</div>
          </div>
          <button
            className="rounded bg-[#295BF2] hover:bg-[#0511F2] transition-all duration-500 text-[#F2F2F2] text-[20px] w-[65px] h-[55px] hover:cursor-pointer disabled:cursor-not-allowed"
            onClick={() => setCantidad((c) => Math.min(MAX_NODOS, c + 1))}
            disabled={cantidad >= MAX_NODOS}
          >
            <i className="fa-solid fa-plus"></i>
          </button>
        </div>
      </div>

      <div className="mb-10 text-[24px]">Selecciona el modo de generación:</div>
      <div className="gap-4 flex justify-center">
        <button
          className="w-[200px] h-[55px] rounded-md bg-[#0511F2] hover:bg-[#295BF2] transition-all duration-500 text-[#F2F2F2] text-[24px] hover:cursor-pointer"
          onClick={generarAleatorio}
        >
          Aleatoria
        </button>
        <button
          className="w-[200px] h-[55px] rounded-md bg-[#0511F2] hover:bg-[#295BF2] transition-all duration-500 text-[#F2F2F2] text-[24px] hover:cursor-pointer"
          onClick={generarManual}
        >
          Manual
        </button>
      </div>
    </div>
  );
}
