import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {BrowserRouter } from "react-router-dom"
import {AssetProvider} from "./game/AssetManager.tsx";


// strict mode is actually introducing some subtle bugs due to the way we are relying on component mount
// to push us through the order queues
createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
      <AssetProvider>
        <App />
      </AssetProvider>
  </BrowserRouter>,
)
