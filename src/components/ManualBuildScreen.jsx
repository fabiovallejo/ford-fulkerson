import { useMemo, useState } from "react";
import GraphCanvas from "./GraphCanvas.jsx";
import { calcularDisposicion, calcularPosiciones } from "./layoutUtils.js";

export default function ManualBuildScreen({ nodos, alVolver, alContinuar }) {
  const ANCHO_VISTA = 1800, ALTO_VISTA = 700;
  
  const disposicion = useMemo(() => calcularDisposicion(nodos.length, ANCHO_VISTA, ALTO_VISTA), [nodos.length]);
  const posiciones = useMemo(() => calcularPosiciones(nodos, disposicion), [nodos, disposicion]);

  const [aristas, setAristas] = useState([]);
  const [nodoSeleccionado, setNodoSeleccionado] = useState(null);
  const [mostrarModalCapacidad, setMostrarModalCapacidad] = useState(false);
  const [aristaPendiente, setAristaPendiente] = useState(null);
  const [capacidad, setCapacidad] = useState("");

  const manejarClickNodo = (idNodo) => {
    if (!nodoSeleccionado) {
      setNodoSeleccionado(idNodo);
    } else if (nodoSeleccionado === idNodo) {
      setNodoSeleccionado(null);
    } else {
      if (aristas.some(arista => arista.origen === nodoSeleccionado && arista.destino === idNodo)) {
        alert("Ya existe una arista entre estos nodos");
        setNodoSeleccionado(null);
        return;
      }
      setAristaPendiente({ origen: nodoSeleccionado, destino: idNodo });
      setMostrarModalCapacidad(true);
    }
  };

  const manejarAgregarArista = () => {
    const capacidadNumerica = parseInt(capacidad);
    if (isNaN(capacidadNumerica) || capacidadNumerica < 1 || capacidadNumerica > 50) {
      alert("La capacidad debe ser un número entre 1 y 50");
      return;
    }

    setAristas([...aristas, {
      id: `e${aristaPendiente.origen}_${aristaPendiente.destino}`,
      origen: aristaPendiente.origen,
      destino: aristaPendiente.destino,
      capacidad: capacidadNumerica
    }]);
    
    setMostrarModalCapacidad(false);
    setAristaPendiente(null);
    setNodoSeleccionado(null);
    setCapacidad("");
  };

  const cerrarModal = () => {
    setMostrarModalCapacidad(false);
    setAristaPendiente(null);
    setNodoSeleccionado(null);
    setCapacidad("");
  };

  return (
    <div className="w-screen min-h-screen bg-[#F2F2F2] flex flex-col">
      <div className="flex items-center justify-center bg-[#295BF2] w-full py-4">
        <div className="text-[#F2F2F2] text-2xl font-semibold text-center px-4">
          CREACIÓN MANUAL DE ARISTAS - Haz click en dos nodos para crear una arista
        </div>
      </div>

      <div className="flex-1 p-4 relative">
        <GraphCanvas
          nodos={nodos}
          aristas={aristas}
          fuente={nodoSeleccionado}
          sumidero={null}
          posiciones={posiciones}
          alClickNodo={manejarClickNodo}
          esInteractivo={true}
        />

        {nodoSeleccionado && (
          <div className="absolute top-8 left-8 bg-blue-100 border-2 border-blue-600 rounded-lg p-4 shadow-lg">
            <p className="text-blue-900 font-semibold text-lg">
              Nodo seleccionado: <span className="text-2xl">{nodoSeleccionado}</span>
            </p>
            <p className="text-blue-700 text-sm mt-1">Haz click en otro nodo para crear una arista</p>
            <button 
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
              onClick={() => setNodoSeleccionado(null)}
            >
              Cancelar selección
            </button>
          </div>
        )}
      </div>

      <div className="bg-white border-t-4 border-[#295BF2] px-8 py-5">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-xl font-bold text-gray-800 mb-3">
            Aristas creadas ({aristas.length})
          </h3>
          {aristas.length === 0 ? (
            <p className="text-gray-600">No hay aristas aún. Haz click en dos nodos para crear una.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-40 overflow-y-auto">
              {aristas.map(arista => (
                <div key={arista.id} className="bg-blue-50 border border-blue-300 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-semibold text-blue-900">
                      {arista.origen} → {arista.destino}
                    </span>
                    <p className="text-sm text-blue-700">Cap: {arista.capacidad}</p>
                  </div>
                  <button
                    className="text-red-600 hover:text-red-800 ml-2"
                    onClick={() => setAristas(aristas.filter(a => a.id !== arista.id))}
                    title="Eliminar arista"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center bg-[#295BF2] px-10 py-4">
        <button 
          className="rounded-lg bg-[#0511F2] px-6 py-3 text-[#F2F2F2] text-lg font-medium hover:bg-[#234bc4] transition-all duration-300" 
          onClick={alVolver}
        >
          ← Volver al menú
        </button>
        <button 
          className="rounded-lg bg-green-600 px-6 py-3 text-white text-lg font-medium hover:bg-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed" 
          onClick={() => aristas.length > 0 ? alContinuar(aristas) : alert("Debes crear al menos una arista")}
          disabled={aristas.length === 0}
        >
          Continuar a selección de nodos →
        </button>
      </div>

      {mostrarModalCapacidad && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Nueva Arista</h3>
            <p className="text-gray-700 mb-4">
              De <span className="font-bold text-blue-600">{aristaPendiente?.origen}</span> hacia{" "}
              <span className="font-bold text-blue-600">{aristaPendiente?.destino}</span>
            </p>
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-2">Capacidad (1-50):</label>
              <input
                type="number"
                min="1"
                max="50"
                value={capacidad}
                onChange={(evento) => setCapacidad(evento.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
                placeholder="Ej: 10"
                autoFocus
                onKeyPress={(evento) => evento.key === 'Enter' && manejarAgregarArista()}
              />
            </div>
            <div className="flex gap-3">
              <button
                className="flex-1 bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-500 transition-all"
                onClick={cerrarModal}
              >
                Cancelar
              </button>
              <button
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
                onClick={manejarAgregarArista}
              >
                Crear Arista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}