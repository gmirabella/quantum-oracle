
import React from 'react';
import { TimeMode } from '../types';
import { Sparkles, History, Send, Zap } from 'lucide-react';

interface UIProps {
  mode: TimeMode;
  setMode: (m: TimeMode) => void;
  inputText: string;
  setInputText: (s: string) => void;
  onSubmit: () => void;
  loading: boolean;
  oracleMessage: string | null;
  cameraStatus?: 'loading' | 'active' | 'error' | null;
}

export const UI: React.FC<UIProps> = ({
  mode,
  setMode,
  inputText,
  setInputText,
  onSubmit,
  loading,
  oracleMessage,
  cameraStatus
}) => {
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading && inputText.trim()) {
      onSubmit();
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between z-10 p-6 md:p-12 font-serif text-gray-200 select-none">
      
      {/* Header */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div>
          <h1 className="text-3xl md:text-5xl font-light tracking-widest uppercase opacity-80" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
            Quantum Oracle
          </h1>
          {mode === TimeMode.FUTURE || mode === TimeMode.PAST ? (
            <p className="text-xs md:text-sm tracking-widest opacity-50 mt-2 font-sans">
              Chiedi all'universo. Guarda le particelle rispondere.
            </p>
          ) : null}
           {mode === TimeMode.EVOCA && (
            <p className="text-xs md:text-sm tracking-widest opacity-50 mt-2 font-sans text-purple-400">
              Manipolazione Energetica
            </p>
          )}
        </div>

        {/* Mode Switcher */}
        <div className="flex flex-col gap-2 items-end">
           <button
            onClick={() => setMode(TimeMode.FUTURE)}
            className={`flex items-center gap-2 px-4 py-2 border transition-all duration-500 ${mode === TimeMode.FUTURE ? 'border-white bg-white/10' : 'border-transparent opacity-40 hover:opacity-100'}`}
          >
            <Sparkles size={16} />
            <span className="text-sm tracking-widest hidden md:inline">2026 • FUTURO</span>
          </button>
          <button
            onClick={() => setMode(TimeMode.PAST)}
            className={`flex items-center gap-2 px-4 py-2 border transition-all duration-500 ${mode === TimeMode.PAST ? 'border-white bg-white/10' : 'border-transparent opacity-40 hover:opacity-100'}`}
          >
            <History size={16} />
            <span className="text-sm tracking-widest hidden md:inline">2025 • PASSATO</span>
          </button>
          <button
            onClick={() => setMode(TimeMode.EVOCA)}
            className={`flex items-center gap-2 px-4 py-2 border transition-all duration-500 ${mode === TimeMode.EVOCA ? 'border-purple-500 bg-purple-900/20 text-purple-200' : 'border-transparent opacity-40 hover:opacity-100'}`}
          >
            <Zap size={16} />
            <span className="text-sm tracking-widest hidden md:inline">EVOCA</span>
          </button>
        </div>
      </div>

      {/* Oracle Message Display */}
      {(mode === TimeMode.FUTURE || mode === TimeMode.PAST) && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-2xl px-4 pointer-events-none">
          {loading ? (
            <div className="animate-pulse tracking-[0.5em] text-sm opacity-60">CONNESSIONE ALLA FONTE...</div>
          ) : (
            oracleMessage && (
              <div className="animate-fade-in-up">
                <div className="mb-4 text-xs tracking-widest opacity-40 uppercase border-b border-white/20 pb-2 inline-block">
                  Il Sutra Quantico
                </div>
                <p className="text-xl md:text-3xl font-light italic opacity-90 leading-relaxed text-shadow-glow" style={{ fontFamily: '"Cormorant Garamond", serif' }}>
                  "{oracleMessage}"
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* EVOCA Instructions Overlay */}
      {mode === TimeMode.EVOCA && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-lg pointer-events-none">
           {cameraStatus === 'loading' && <div className="text-sm animate-pulse text-purple-500">Apertura del Terzo Occhio (Camera)...</div>}
           {cameraStatus === 'error' && <div className="text-sm text-red-500">Errore Visione. Verifica i permessi.</div>}
           
           {cameraStatus === 'active' && (
             <div className="flex flex-col gap-8 opacity-80 text-purple-200">
                <div className="flex items-center justify-center gap-4">
                  <div className="p-2 border border-purple-500 rounded-full">
                    <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold uppercase tracking-widest">CHIUDI IL PUGNO</div>
                    <div className="text-xs">Accumula Prana</div>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-4">
                   <div className="p-2 border border-white rounded-full">
                    <div className="w-4 h-4 border border-white rounded-full"></div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold uppercase tracking-widest">APRI LA MANO</div>
                    <div className="text-xs">Libera l'Energia</div>
                  </div>
                </div>
             </div>
           )}
        </div>
      )}

      {/* Footer / Input */}
      {(mode === TimeMode.FUTURE || mode === TimeMode.PAST) ? (
        <div className="w-full max-w-xl mx-auto pointer-events-auto">
          <label className="block text-center text-sm opacity-60 mb-4 tracking-widest font-sans uppercase">
            {mode === TimeMode.FUTURE 
              ? "Cosa chiedi al flusso del divenire?" 
              : "Cosa lasci andare nel fiume del passato?"}
          </label>
          
          <div className="relative group">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === TimeMode.FUTURE ? "La mia intenzione è..." : "Ho chiesto ma..."}
              className="w-full bg-black/20 backdrop-blur-sm border-b border-white/30 focus:border-white/90 outline-none text-center py-4 text-lg md:text-xl transition-all placeholder:text-white/20"
              disabled={loading}
            />
            <button 
              onClick={onSubmit}
              disabled={!inputText.trim() || loading}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 opacity-50 hover:opacity-100 disabled:opacity-0 transition-all"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full text-center pb-8 opacity-30 tracking-widest text-xs">
           Rilevamento mudra attivo. Usa le mani per plasmare.
        </div>
      )}
      
      <style>{`
        .text-shadow-glow {
          text-shadow: 0 0 10px rgba(255,255,255,0.3), 0 0 20px rgba(255,255,255,0.1);
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 1.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
