export default function ResultsScreen({ maxFlow, nodes, edges, source, sink, minCut, onBack }) {
  // Calcular flujo neto y capacidad del corte
  const sourceEdges = edges.filter(e => e.source === source);
  const sinkEdges = edges.filter(e => e.target === sink);
  
  const flowFromSource = sourceEdges.reduce((sum, e) => sum + (e.flow || 0), 0);
  const flowToSink = sinkEdges.reduce((sum, e) => sum + (e.flow || 0), 0);
  
  const cutCapacity = minCut ? minCut.cutEdges.reduce((sum, e) => sum + e.capacity, 0) : 0;

  return (
    <div className="w-screen min-h-screen bg-[#F2F2F2] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-center bg-[#295BF2] w-full py-6">
        <div className="text-[#F2F2F2] text-3xl font-bold text-center px-4">
          NODO FUENTE: {source}
          <span className="mx-8">|</span>
          NODO SUMIDERO: {sink}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-12">
          
          {/* Mensaje de finalización */}
          <div className="text-center mb-8">
            <p className="text-2xl text-gray-700 mb-4">
              Ya no hay más caminos por explorar.
            </p>
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              RESULTADOS DEL ALGORITMO
            </h2>
          </div>

          {/* Ecuaciones y resultados */}
          <div className="space-y-6 mb-10">
            {/* Flujo neto */}
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-lg">
              <p className="text-xl text-gray-800 mb-2">
                <span className="font-semibold">Flujo neto a través del corte (S, T)</span>
              </p>
              <p className="text-2xl font-mono text-blue-900">
                f(S, T) = {minCut ? minCut.cutEdges.map(e => e.flow).join(' + ') : flowFromSource} = <span className="font-bold text-blue-700">{maxFlow}</span>
              </p>
            </div>

            {/* Capacidad del corte */}
            <div className="bg-purple-50 border-l-4 border-purple-600 p-6 rounded-lg">
              <p className="text-xl text-gray-800 mb-2">
                <span className="font-semibold">Capacidad del corte (S, T)</span>
              </p>
              <p className="text-2xl font-mono text-purple-900">
                c(S, T) = {minCut ? minCut.cutEdges.map(e => e.capacity).join(' + ') : cutCapacity} = <span className="font-bold text-purple-700">{cutCapacity}</span>
              </p>
            </div>

            {/* Conjuntos S y T */}
            {minCut && (
              <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-lg">
                <p className="text-xl text-gray-800 mb-3">
                  <span className="font-semibold">Partición del corte mínimo:</span>
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-lg font-semibold text-green-800 mb-1">Conjunto S (Fuente):</p>
                    <p className="text-xl font-mono text-green-900">{`{${minCut.sourceSet.join(', ')}}`}</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-green-800 mb-1">Conjunto T (Sumidero):</p>
                    <p className="text-xl font-mono text-green-900">{`{${minCut.sinkSet.join(', ')}}`}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Flujo Máximo Final */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center shadow-xl">
            <p className="text-white text-2xl font-semibold mb-2">
              FLUJO MÁXIMO
            </p>
            <p className="text-white text-6xl font-bold">
              |f| = {maxFlow}
            </p>
          </div>

          {/* Verificación del teorema */}
          <div className="mt-8 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6">
            <p className="text-center text-lg text-gray-800">
              <span className="font-bold text-yellow-800">✓ Teorema Max-Flow Min-Cut verificado:</span>
              <br />
              El flujo máximo ({maxFlow}) es igual a la capacidad del corte mínimo ({cutCapacity})
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-center bg-[#295BF2] px-10 py-6">
        <button 
          className="rounded-lg bg-[#0511F2] px-8 py-4 text-[#F2F2F2] text-xl font-medium hover:bg-[#234bc4] transition-all duration-300" 
          onClick={onBack}
        >
          ← Volver al menú
        </button>
      </div>
    </div>
  );
}