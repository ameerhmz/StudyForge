import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'sonner'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster 
      position="bottom-right" 
      toastOptions={{
        style: {
          background: '#0f172a',
          border: '1px solid #1e293b',
          color: '#fff',
        }
      }}
    />
  </React.StrictMode>
)
