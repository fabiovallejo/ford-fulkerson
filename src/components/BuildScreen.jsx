import { useMemo } from "react";
import GraphCanvas from "./GraphCanvas.jsx";
import { calcularDisposicion, calcularPosiciones } from "./layoutUtils.js";

export default function BuildScreen({
  nodos,
  aristas: aristasIniciales,
  fuente,
  sumidero,
  alSeleccionarFuente,
  alSeleccionarSumidero,
  alVolver,
  alEjecutar,
}) {
  const ANCHO_VISTA = 1800, ALTO_VISTA = 700;
  const CAPACIDAD_MIN = 1, CAPACIDAD_MAX = 50;
  
  const disposicion = useMemo(() => calcularDisposicion(nodos.length, ANCHO_VISTA, ALTO_VISTA), [nodos.length]);
  const posiciones = useMemo(() => calcularPosiciones(nodos, disposicion), [nodos, disposicion]);

  // Generar aristas si no existen
  const aristas = useMemo(() => {
    if (aristasIniciales?.length) {
      // Limitar y normalizar capacidades de aristas existentes
      return aristasIniciales.slice(0, nodos.length * 3).map(arista => ({
        ...arista,
        capacidad: Math.max(CAPACIDAD_MIN, Math.min(CAPACIDAD_MAX, Math.round(arista.capacidad ?? Math.random() * 49 + 1)))
      }));
    }
    
    // Generar aristas aleatorias
    const { columnas } = disposicion;
    const aristas = [];
    const usadas = new Set();
    
    nodos.forEach((nodoOrigen, indice) => {
      const columnaOrigen = indice % columnas;
      const candidatosDestino = nodos.filter((_, j) => j % columnas > columnaOrigen);
      
      if (candidatosDestino.length) {
        const numeroAristas = Math.min(3, 1 + Math.floor(Math.random() * 3), candidatosDestino.length);
        const seleccionados = candidatosDestino.sort(() => 0.5 - Math.random()).slice(0, numeroAristas);
        
        seleccionados.forEach(nodoDestino => {
          const clave = `${nodoOrigen}->${nodoDestino}`;
          if (!usadas.has(clave)) {
            usadas.add(clave);
            aristas.push({
              id: `e${nodoOrigen}_${nodoDestino}`,
              origen: nodoOrigen,
              destino: nodoDestino,
              capacidad: Math.floor(Math.random() * 50) + 1
            });
          }
        });
      }
    });
    
    return aristas;
  }, [aristasIniciales, nodos, disposicion]);

  return (
    <div className="w-screen min-h-screen bg-[#F2F2F2] flex flex-col">
      <div className="flex items-center justify-center bg-[#295BF2] w-full py-6">
        <div className="text-[#F2F2F2] text-[30px] font-semibold text-center px-4">
          SELECCIONA EL NODO FUENTE (click izquierdo) y el nodo SUMIDERO (click derecho)
        </div>
      </div>

      <div className="flex-1 p-4">
        <GraphCanvas
          nodos={nodos}
          aristas={aristas}
          fuente={fuente}
          sumidero={sumidero}
          posiciones={posiciones}
          alClickNodo={(id) => id !== sumidero && alSeleccionarFuente(id)}
          alClickDerechoNodo={(evento, id) => {
            evento.preventDefault();
            id !== fuente && alSeleccionarSumidero(id);
          }}
          esInteractivo={true}
        />
      </div>

      <div className="flex justify-between items-center bg-[#295BF2] px-10 py-5">
        <button 
          className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300" 
          onClick={alVolver}
        >
          ← Volver al menú
        </button>
        <button 
          className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#0511F2] disabled:cursor-not-allowed" 
          disabled={!fuente || !sumidero} 
          onClick={alEjecutar}
        >
          Ejecutar Ford–Fulkerson →
        </button>
      </div>
    </div>
  );
}