import { useState } from 'react'
import MenuScreen from "./components/MenuScreen"
import ManualBuildScreen from "./components/ManualBuildScreen"
import BuildScreen from "./components/BuildScreen"
import RunScreen from "./components/RunScreen"
import ResultsScreen from "./components/ResultsScreen"
import './global.css'

function App() {
  const [pantalla, setPantalla] = useState("MENU");
  const [nodos, setNodos] = useState([]);
  const [aristas, setAristas] = useState([]);
  const [fuente, setFuente] = useState(null);
  const [sumidero, setSumidero] = useState(null);
  const [flujoMaximo, setFlujoMaximo] = useState(0);
  const [corteMinimo, setCorteMinimo] = useState(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className='min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#D3CEF2] via-[#F2F2F2] to-[#91B2F2]'>
        {pantalla === "MENU" && (
          <MenuScreen
            alGenerar={(ns, es) => {
              setNodos(ns); 
              setAristas(es);
              setFuente(null); 
              setSumidero(null);
              setFlujoMaximo(0);
              setCorteMinimo(null);
              setPantalla("BUILD");
            }}
            alManual={(ns) => {
              setNodos(ns);
              setAristas([]);
              setFuente(null); 
              setSumidero(null);
              setFlujoMaximo(0);
              setCorteMinimo(null);
              setPantalla("MANUAL_BUILD");
            }}
          />
        )}

        {pantalla === "MANUAL_BUILD" && (
          <ManualBuildScreen
            nodos={nodos}
            alVolver={() => setPantalla("MENU")}
            alContinuar={(es) => {
              setAristas(es);
              setPantalla("BUILD");
            }}
          />
        )}

        {pantalla === "BUILD" && (
          <BuildScreen
            nodos={nodos} 
            aristas={aristas} 
            fuente={fuente} 
            sumidero={sumidero}
            alSeleccionarFuente={(s) => setFuente(String(s))}
            alSeleccionarSumidero={(t) => setSumidero(String(t))}
            alVolver={() => setPantalla("MENU")}
            alEjecutar={() => setPantalla("RUN")}
          />
        )}

        {pantalla === "RUN" && (
          <RunScreen
            nodos={nodos} 
            aristas={aristas} 
            fuente={fuente} 
            sumidero={sumidero}
            alVolverMenu={() => setPantalla("MENU")}
            alResultados={() => setPantalla("RESULTS")}
            establecerFlujoMaximo={setFlujoMaximo}
            establecerCorteMinimo={setCorteMinimo}
          />
        )}

        {pantalla === "RESULTS" && (
          <ResultsScreen
            flujoMaximo={flujoMaximo}
            nodos={nodos}
            aristas={aristas}
            fuente={fuente}
            sumidero={sumidero}
            corteMinimo={corteMinimo}
            alVolver={() => setPantalla("MENU")}
          />
        )}
      </div>
    </div>
  )
}

export default App
