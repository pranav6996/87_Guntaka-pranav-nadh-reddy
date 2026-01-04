import React, { useState } from 'react';
import axios from 'axios';
import { Upload, FileText, Activity, AlertTriangle, CheckCircle, ShieldAlert, Loader2, Pill } from 'lucide-react';

// --- API CONFIG ---
const API_URL = "http://127.0.0.1:8000/api/analyze/";

export default function App() {
  const [file, setFile] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Handle File Selection
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !textInput) {
      setError("Please provide an image or medicine name.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    if (file) formData.append("image", file);
    if (textInput) formData.append("text_input", textInput);
    formData.append("conditions", "None");

    try {
      const response = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(response.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze. Ensure the backend is running at http://127.0.0.1:8000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 bg-slate-50 font-sans text-slate-900">
      
      {/* Header */}
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="p-3 bg-brand-100 rounded-full">
            <Activity className="w-8 h-8 text-brand-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-brand-900 tracking-tight">MedGuard AI</h1>
        </div>
        <p className="text-slate-500 max-w-md mx-auto text-lg">
          Your AI Safety Assistant for verifying medicine authenticity and risks.
        </p>
      </header>

      {/* Main Card */}
      <main className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Input Section */}
        <div className="p-8 border-b border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Upload Area */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Option 1: Upload Image
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-brand-50 hover:border-brand-300 transition-all cursor-pointer relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="bg-slate-100 p-3 rounded-full mb-3 group-hover:bg-brand-100 transition-colors">
                    <Upload className="w-6 h-6 text-slate-500 group-hover:text-brand-500" />
                </div>
                {file ? (
                  <span className="text-brand-700 font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> {file.name}
                  </span>
                ) : (
                  <div className="text-slate-500">
                    <span className="font-medium text-brand-600">Click to upload</span> or drag and drop
                    <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG</p>
                  </div>
                )}
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">OR</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
                    Option 2: Medicine Name
                </label>
                <div className="relative">
                    <Pill className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
                    <input 
                    type="text" 
                    placeholder="e.g. Dolo 650, Metformin"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full pl-10 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:outline-none transition shadow-sm"
                    />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Analyzing Safety...
                </>
              ) : (
                <>
                  Analyze Medicine
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && <ResultsDisplay data={result} />}

      </main>
      
      <footer className="mt-12 text-slate-400 text-sm flex flex-col items-center gap-1">
        <p>MedGuard AI Project &copy; 2026</p>
        <p className="text-xs bg-slate-200 text-slate-500 px-2 py-1 rounded">⚠️ Educational Prototype Only. Not for medical use.</p>
      </footer>
    </div>
  );
}

// --- RESULTS COMPONENT ---

function ResultsDisplay({ data }) {
  const { detected_info, risk_analysis, medical_insights } = data;
  
  // Determine status color logic
  const isSafe = risk_analysis.level === "Low";
  const isRisky = risk_analysis.level === "High";

  // Dynamic Styles
  const statusColor = isSafe ? "bg-green-50 border-green-200 text-green-800" 
    : isRisky ? "bg-red-50 border-red-200 text-red-800" 
    : "bg-yellow-50 border-yellow-200 text-yellow-800";

  const Icon = isSafe ? CheckCircle : isRisky ? ShieldAlert : AlertTriangle;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Header Info */}
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Detected Medicine</h2>
            <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <span className="text-xl font-bold text-slate-900">{detected_info.medicine_name || "Unknown"}</span>
            </div>
        </div>
        <div className="text-right">
             <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Manufacturer</h2>
             <span className="text-sm font-medium text-slate-700 bg-white px-2 py-1 rounded border border-slate-200">
                {detected_info.manufacturer || "Not Detected"}
             </span>
        </div>
      </div>

      {/* 2. Risk Meter */}
      <div className={`p-6 border-b ${statusColor} border-t border-b`}>
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-full bg-white bg-opacity-60`}>
            <Icon className="w-8 h-8" />
          </div>
          
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              Risk Level: {risk_analysis.level}
            </h3>
            <p className="text-sm mt-1 opacity-90 font-medium">
              {risk_analysis.reason}
            </p>
          </div>
        </div>
      </div>

      {/* 3. AI Insights */}
      <div className="p-8 bg-white">
        <h3 className="flex items-center gap-2 text-sm font-bold text-brand-600 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
            <Activity className="w-4 h-4" /> AI Medical Insights
        </h3>
        <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
          {medical_insights}
        </div>
      </div>
    </div>
  );
}