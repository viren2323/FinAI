import React, { useState } from 'react';
import { ParsedStatement, AppState } from './types';
import { extractFinancialData, initializeChat } from './services/gemini';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import { FileText, ChevronLeft, LayoutDashboard, MessageSquare } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [data, setData] = useState<ParsedStatement | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chat'>('dashboard');

  const handleFileProcess = async (base64: string, mimeType: string) => {
    setAppState(AppState.ANALYZING);
    try {
      const result = await extractFinancialData(base64, mimeType);
      setData(result);
      initializeChat(result);
      setAppState(AppState.DASHBOARD);
    } catch (error) {
      console.error(error);
      setAppState(AppState.ERROR);
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setData(null);
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
              <FileText size={20} />
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">FinSight AI</span>
          </div>
          
          {appState === AppState.DASHBOARD && (
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'chat' 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MessageSquare size={18} />
                Assistant
              </button>
            </div>
          )}

          {appState !== AppState.IDLE && (
            <button 
              onClick={resetApp}
              className="text-sm text-slate-500 hover:text-slate-800 font-medium"
            >
              New Upload
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 bg-[#f8fafc] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {appState === AppState.IDLE && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-fade-in">
              <div className="max-w-2xl">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">
                  Turn Bank Statements into Insights
                </h1>
                <p className="text-lg text-slate-600 mb-8">
                  Upload a PDF or Image of your bank statement. Our AI parses transactions, 
                  visualizes spending habits, and lets you chat with your financial data instantly.
                </p>
                <FileUpload onFileSelect={handleFileProcess} isProcessing={false} />
              </div>
            </div>
          )}

          {appState === AppState.ANALYZING && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 animate-pulse">
               <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
               <div className="text-center">
                 <h3 className="text-xl font-semibold text-slate-800">Analyzing Document</h3>
                 <p className="text-slate-500 mt-2">Extracting transactions, calculating totals, and generating insights...</p>
                 <p className="text-xs text-slate-400 mt-4 max-w-md mx-auto">This usually takes 10-20 seconds. We are using Gemini 2.5 Flash for high-speed OCR & reasoning.</p>
               </div>
            </div>
          )}

          {appState === AppState.ERROR && (
             <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
               <div className="bg-red-50 p-6 rounded-2xl text-center max-w-md border border-red-100">
                  <h3 className="text-lg font-bold text-red-700 mb-2">Analysis Failed</h3>
                  <p className="text-red-600 mb-6">We couldn't parse that document. Please ensure it is a clear image or PDF of a standard bank statement.</p>
                  <button 
                    onClick={resetApp}
                    className="px-6 py-2 bg-white text-red-600 border border-red-200 font-semibold rounded-lg hover:bg-red-50 transition-colors shadow-sm"
                  >
                    Try Again
                  </button>
               </div>
             </div>
          )}

          {appState === AppState.DASHBOARD && data && (
            <div className="animate-fade-in">
              {activeTab === 'dashboard' ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">
                      Statement Overview
                    </h2>
                    <p className="text-slate-500 text-sm">
                      {data.summary.accountHolder} • {data.summary.accountNumber} • {data.summary.statementPeriod}
                    </p>
                  </div>
                  <Dashboard data={data} />
                </>
              ) : (
                <div className="max-w-3xl mx-auto">
                   <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold text-slate-900">
                      Ask your Finance Assistant
                    </h2>
                    <p className="text-slate-500">
                      Powered by RAG on your extracted data
                    </p>
                  </div>
                  <ChatInterface />
                </div>
              )}
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
};

export default App;