import React, {useEffect, useState} from 'react'
import {createRoot} from 'react-dom/client'

function App(){
  const [telemetry,setTelemetry]=useState([])
  const [nodes,setNodes]=useState({nodes:{}})
  const base=import.meta.env.VITE_API_BASE||'http://localhost:8080'
  useEffect(()=>{
    const tick=()=>{
      fetch(`${base}/api/v1/telemetry?limit=20`).then(r=>r.json()).then(setTelemetry).catch(()=>{})
      fetch(`${base}/api/v1/nodes/status`).then(r=>r.json()).then(setNodes).catch(()=>{})
    }
    tick(); const id=setInterval(tick,2000); return ()=>clearInterval(id)
  },[])
  return <div style={{fontFamily:'sans-serif',padding:16}}>
    <h2>Red-SensUrb MVP</h2>
    <h3>Nodos</h3>
    <pre>{JSON.stringify(nodes,null,2)}</pre>
    <h3>Telemetry</h3>
    <pre>{JSON.stringify(telemetry.slice(0,10),null,2)}</pre>
  </div>
}

createRoot(document.getElementById('root')).render(<App/>)
