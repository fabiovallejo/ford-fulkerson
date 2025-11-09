import { useMemo, useState, useEffect } from "react";
import GraphCanvas from "./GraphCanvas.jsx";
import { calcularDisposicion, calcularPosiciones } from "./layoutUtils.js";

export default function RunScreen({ 
  nodos, 
  aristas, 
  fuente, 
  sumidero, 
  alVolverMenu,
  alResultados,
  establecerFlujoMaximo,
  establecerCorteMinimo
}) {
  const VB_W = 1800, VB_H = 700;
  
  const distribucion = useMemo(() => calcularDisposicion(nodos.length, VB_W, VB_H), [nodos.length]);
  const posiciones = useMemo(() => calcularPosiciones(nodos, distribucion), [nodos, distribucion]);

  const [historial, setHistorial] = useState([{ flujo: new Map(), camino: [], cuelloBotella: null, flujoMaximo: 0 }]);
  const [indicePasoActual, setIndicePasoActual] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const [datosCorteMinimo, setDatosCorteMinimo] = useState(null);

  const pasoActual = historial[indicePasoActual];
  const enUltimoPaso = indicePasoActual === historial.length - 1;

  const clave = (u, v) => `${u}->${v}`;

  // Construir grafo residual
  const construirResidual = (mapaFlujo) => {
    const adyacencia = new Map();
    aristas.forEach(a => {
      const f = mapaFlujo.get(clave(a.origen, a.destino)) || 0;
      
      if (a.capacidad - f > 0) {
        if (!adyacencia.has(a.origen)) adyacencia.set(a.origen, []);
        adyacencia.get(a.origen).push({ v: a.destino, cap: a.capacidad - f, dir: "f", base: a });
      }
      
      if (f > 0) {
        if (!adyacencia.has(a.destino)) adyacencia.set(a.destino, []);
        adyacencia.get(a.destino).push({ v: a.origen, cap: f, dir: "b", base: a });
      }
    });
    return adyacencia;
  };

  // Buscar camino aumentante (DFS)
  const buscarCaminoAumentante = (s, t, mapaFlujo) => {
    const residual = construirResidual(mapaFlujo);
    const pila = [[s, [], Infinity]];
    const visitados = new Set();

    while (pila.length) {
      const [u, camino, minCap] = pila.pop();
      if (u === t) return { camino, cuelloBotella: minCap };
      if (visitados.has(u)) continue;
      visitados.add(u);

      (residual.get(u) || []).forEach(({ v, cap, dir, base }) => {
        if (cap > 0 && !visitados.has(v)) {
          pila.push([v, [...camino, { u, v, cap, dir, base }], Math.min(minCap, cap)]);
        }
      });
    }
    return null;
  };

  // Calcular corte mínimo
  const calcularCorteMinimo = (mapaFlujo) => {
    const residual = construirResidual(mapaFlujo);
    const alcanzables = new Set([fuente]);
    const cola = [fuente];

    while (cola.length) {
      const u = cola.shift();
      (residual.get(u) || []).forEach(({ v, cap }) => {
        if (cap > 0 && !alcanzables.has(v)) {
          alcanzables.add(v);
          cola.push(v);
        }
      });
    }

    const aristasCorte = aristas
      .filter(a => alcanzables.has(a.origen) && !alcanzables.has(a.destino))
      .map(a => ({ ...a, flujo: mapaFlujo.get(clave(a.origen, a.destino)) || 0 }));

    return {
      conjuntoFuente: Array.from(alcanzables).sort((a, b) => parseInt(a) - parseInt(b)),
      conjuntoSumidero: nodos.filter(n => !alcanzables.has(n)).sort((a, b) => parseInt(a) - parseInt(b)),
      aristasCorte,
      capacidadCorte: aristasCorte.reduce((suma, a) => suma + a.capacidad, 0),
      flujoCorte: aristasCorte.reduce((suma, a) => suma + a.flujo, 0)
    };
  };

  // Siguiente paso
  const siguientePaso = () => {
    if (finalizado) return;

    if (indicePasoActual < historial.length - 1) {
      setIndicePasoActual(indicePasoActual + 1);
      return;
    }

    const ultimoPaso = historial[historial.length - 1];
    const res = buscarCaminoAumentante(fuente, sumidero, ultimoPaso.flujo);
    
    if (!res) {
      setFinalizado(true);
      const corte = calcularCorteMinimo(ultimoPaso.flujo);
      setDatosCorteMinimo(corte);
      establecerCorteMinimo?.(corte);
      return;
    }

    const nuevoFlujo = new Map(ultimoPaso.flujo);
    res.camino.forEach(({ dir, base }) => {
      const k = clave(base.origen, base.destino);
      nuevoFlujo.set(k, (nuevoFlujo.get(k) || 0) + (dir === "f" ? res.cuelloBotella : -res.cuelloBotella));
    });

    setHistorial([...historial, {
      flujo: nuevoFlujo,
      camino: res.camino,
      cuelloBotella: res.cuelloBotella,
      flujoMaximo: ultimoPaso.flujoMaximo + res.cuelloBotella
    }]);
    setIndicePasoActual(historial.length);
  };

  const pasoAnterior = () => {
    if (indicePasoActual > 0) {
      setIndicePasoActual(indicePasoActual - 1);
      setFinalizado(false);
    }
  };

  useEffect(() => {
    establecerFlujoMaximo?.(pasoActual.flujoMaximo);
  }, [pasoActual.flujoMaximo, establecerFlujoMaximo]);

  const volverAlMenu = () => {
    setHistorial([{ flujo: new Map(), camino: [], cuelloBotella: null, flujoMaximo: 0 }]);
    setIndicePasoActual(0);
    setFinalizado(false);
    setDatosCorteMinimo(null);
    alVolverMenu();
  };

  const verResultados = () => {
    establecerFlujoMaximo?.(pasoActual.flujoMaximo);
    establecerCorteMinimo?.(datosCorteMinimo);
    alResultados();
  };

  return (
    <div className="w-screen min-h-screen bg-[#F2F2F2] flex flex-col">
      <div className="flex-1 p-4 relative">
        <div className="relative w-full h-full">
          <GraphCanvas
            nodos={nodos}
            aristas={aristas}
            fuente={fuente}
            sumidero={sumidero}
            posiciones={posiciones}
            flujo={pasoActual.flujo}
            caminoActual={pasoActual.camino}
            esInteractivo={false}
          />
          
          {finalizado && enUltimoPaso && datosCorteMinimo && (
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="xMidYMid meet">
              {(() => {
                if (datosCorteMinimo.aristasCorte.length === 0) return null;
                
                let sumaX = 0, sumaY = 0;
                let minX = Infinity, maxX = -Infinity;
                let minY = Infinity, maxY = -Infinity;
                
                datosCorteMinimo.aristasCorte.forEach(a => {
                  const p1 = posiciones[a.origen], p2 = posiciones[a.destino];
                  if (p1 && p2) {
                    const midX = (p1.x + p2.x) / 2;
                    const midY = (p1.y + p2.y) / 2;
                    sumaX += midX;
                    sumaY += midY;
                    
                    minX = Math.min(minX, p1.x, p2.x);
                    maxX = Math.max(maxX, p1.x, p2.x);
                    minY = Math.min(minY, p1.y, p2.y);
                    maxY = Math.max(maxY, p1.y, p2.y);
                  }
                });
                
                const centroX = sumaX / datosCorteMinimo.aristasCorte.length;
                const centroY = sumaY / datosCorteMinimo.aristasCorte.length;
                
                const rangoX = maxX - minX;
                const rangoY = maxY - minY;
                
                const esCorteHorizontal = rangoY > rangoX;
                
                let lineaX1, lineaY1, lineaX2, lineaY2;
                let etiquetaX, etiquetaY;
                
                if (esCorteHorizontal) {
                  // Línea HORIZONTAL
                  lineaX1 = 50;
                  lineaY1 = centroY;
                  lineaX2 = VB_W - 50;
                  lineaY2 = centroY;
                  etiquetaX = VB_W / 2;
                  etiquetaY = centroY - 15;
                } else {
                  // Línea VERTICAL
                  lineaX1 = centroX;
                  lineaY1 = 50;
                  lineaX2 = centroX;
                  lineaY2 = VB_H - 50;
                  etiquetaX = centroX;
                  etiquetaY = 30;
                }
                
                return (
                  <g>
                    <line 
                      x1={lineaX1} 
                      y1={lineaY1} 
                      x2={lineaX2} 
                      y2={lineaY2} 
                      stroke="#DC2626" 
                      strokeWidth="4" 
                      strokeDasharray="10,5"
                      opacity="0.7"
                    />
                    
                    <text
                      x={etiquetaX}
                      y={etiquetaY}
                      textAnchor="middle"
                      className="fill-red-600 font-bold"
                      style={{ fontSize: 20 }}
                    >
                      CORTE MÍNIMO
                    </text>
                  </g>
                );
              })()}
            </svg>
          )}
        </div>
      </div>

      <div className="border-[#295BF2] px-8 pb-15">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <span className="bg-[#295BF2] px-4 py-2 rounded-full text-[#F2F2F2] font-semibold">
              Paso {indicePasoActual} de {historial.length - 1} {finalizado && enUltimoPaso && "(Finalizado)"}
            </span>
          </div>

          {finalizado && enUltimoPaso && datosCorteMinimo ? (
            <div className="bg-blue-50 border-l-4 border-[#0511F2] p-4 rounded-[3px]">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-[#295BF2] text-base">
                    <span className="font-[500]">Conjunto S:</span> {`{${datosCorteMinimo.conjuntoFuente.join(', ')}}`}
                  </p>
                  <p className="text-[#295BF2] text-base mt-1">
                    <span className="font-[500]">Conjunto T:</span> {`{${datosCorteMinimo.conjuntoSumidero.join(', ')}}`}
                  </p>
                  <p className="text-[#295BF2] text-base mt-1">
                    <span className="font-[500]">Aristas del corte:</span> {datosCorteMinimo.aristasCorte.map(a => `${a.origen}→${a.destino}`).join(', ')}
                  </p>
                </div>
                <div className="bg-[#295BF2] text-white px-6 py-3 rounded-[10px] ml-4 text-center">
                  <p className="text-sm font-medium ">Flujo Máximo</p>
                  <p className="text-3xl font-bold">{pasoActual.flujoMaximo}</p>
                </div>
              </div>
            </div>
          ) : pasoActual.camino.length ? (
            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <p className="text-[#295BF2] font-semibold text-lg mb-2">Camino aumentante encontrado:</p>
                  <p className="text-blue-700 text-xl font-mono bg-white px-3 py-2 rounded border border-blue-200">
                    {pasoActual.camino.map(s => `${s.u}→${s.v}`).join(" → ")}
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg text-center">
                    <p className="text-xs font-medium mb-1">Cuello de botella</p>
                    <p className="text-2xl font-bold">{pasoActual.cuelloBotella}</p>
                  </div>
                  <div className="flex-1 bg-blue-700 text-white px-4 py-3 rounded-lg text-center">
                    <p className="text-xs font-medium mb-1">Flujo acumulado</p>
                    <p className="text-2xl font-bold">{pasoActual.flujoMaximo}</p>
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
        <button className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300" onClick={volverAlMenu}>
          ← Volver al menú
        </button>
        <div className="flex gap-4 items-center">
          <button className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#0511F2] disabled:cursor-not-allowed" onClick={pasoAnterior} disabled={indicePasoActual === 0}>
            ← Paso anterior
          </button>
          {finalizado && enUltimoPaso && (
            <button className="rounded-lg bg-[#0511F2] px-6 py-3 text-white text-lg font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300" onClick={verResultados}>
              Ver Resultados →
            </button>
          )}
          <button className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] hover:cursor-pointer transition-all duration-300 disabled:opacity-50 disabled:hover:bg-[#0511F2] disabled:cursor-not-allowed" onClick={siguientePaso} disabled={finalizado && enUltimoPaso}>
            {finalizado && enUltimoPaso ? "Finalizado" : "Siguiente paso →"}
          </button>
        </div>
      </div>
    </div>
  );
}
