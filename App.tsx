
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  Wand2, 
  ChevronRight, 
  Loader2, 
  MessageSquare, 
  ArrowLeft,
  Download,
  ShieldCheck,
  Zap,
  Package,
  Copy,
  Check,
  Image as ImageIcon,
  FolderTree,
  Code2,
  FileCode
} from 'lucide-react';
import { ProjectLanguage, AppType, ProjectSpec, ChatMessage, CodeSnippet } from './types';
import { LANGUAGES, APP_TYPES } from './constants';
import { GeminiService } from './services/geminiService';

// Redundant global declarations removed to resolve duplicate identifier errors.
// The environment provides AIStudio and window.aistudio natively.

const LibraryTag: React.FC<{ name: string }> = ({ name }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg group/tag hover:border-indigo-500/40 transition-all">
      <span className="text-indigo-300 text-xs font-mono font-medium">
        {name}
      </span>
      <button
        onClick={handleCopy}
        title={`Copy ${name} to clipboard`}
        className="text-indigo-500/40 hover:text-indigo-400 transition-colors"
      >
        {copied ? (
          <Check className="w-3 h-3 text-green-400" />
        ) : (
          <Copy className="w-3 h-3 opacity-0 group-hover/tag:opacity-100 transition-opacity" />
        )}
      </button>
    </div>
  );
};

const CodeBlock: React.FC<{ snippet: CodeSnippet }> = ({ snippet }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden mt-4">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-mono text-gray-300">{snippet.title}</span>
          <span className="text-[10px] text-gray-500 px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700">{snippet.language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="text-gray-500 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-sm font-mono text-gray-300 leading-relaxed">
          <code>{snippet.code}</code>
        </pre>
      </div>
      <div className="px-4 py-2 bg-gray-900/50 border-t border-gray-800 text-xs text-gray-500">
        {snippet.description}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [language, setLanguage] = useState<ProjectLanguage | null>(null);
  const [appType, setAppType] = useState<AppType | null>(null);
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [spec, setSpec] = useState<ProjectSpec | null>(null);
  const [projectImage, setProjectImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'code'>('overview');

  const gemini = useMemo(() => new GeminiService(), []);

  const handleStartGeneration = async () => {
    if (!language || !appType || !description) return;

    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
      await aistudio.openSelectKey();
    }

    setIsGenerating(true);
    try {
      const generatedSpec = await gemini.generateInitialSpec(language, appType, description);
      setSpec(generatedSpec);
      setStep(3);
      
      setIsGeneratingImage(true);
      try {
        const imageUrl = await gemini.generateProjectVisual(generatedSpec);
        setProjectImage(imageUrl);
      } catch (err) {
        console.error("Failed to generate image", err);
      } finally {
        setIsGeneratingImage(false);
      }

    } catch (error: any) {
      if (error?.message?.includes("Requested entity was not found")) {
        const aistudio = (window as any).aistudio;
        if (aistudio) await aistudio.openSelectKey();
      }
      alert("Something went wrong while generating your spec. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !spec) return;

    const aistudio = (window as any).aistudio;
    if (aistudio && !(await aistudio.hasSelectedApiKey())) {
      await aistudio.openSelectKey();
    }

    const userMessage = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsRefining(true);

    try {
      const refinedSpec = await gemini.refineSpec(spec, userMessage, chatHistory);
      setSpec(refinedSpec);
      setChatHistory(prev => [...prev, { role: 'model', content: `Updated your architecture based on: "${userMessage}"` }]);
    } catch (error: any) {
      if (error?.message?.includes("Requested entity was not found")) {
        const aistudio = (window as any).aistudio;
        if (aistudio) await aistudio.openSelectKey();
      }
      setChatHistory(prev => [...prev, { role: 'model', content: "Sorry, I couldn't process that refinement. Please try again." }]);
    } finally {
      setIsRefining(false);
    }
  };

  const exportSpec = () => {
    if (!spec) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(spec, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${spec.name.replace(/\s+/g, '_').toLowerCase()}_spec.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const downloadImage = () => {
    if (!projectImage || !spec) return;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", projectImage);
    downloadAnchorNode.setAttribute("download", `${spec.name.replace(/\s+/g, '_').toLowerCase()}_avatar.png`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-gray-800/60 bg-gray-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Polyglot Architect
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Gemini 3 Pro Powered</span>
            {step === 3 && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={exportSpec}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors border border-gray-700"
                >
                  <Download className="w-4 h-4" />
                  JSON
                </button>
                {projectImage && (
                  <button 
                    onClick={downloadImage}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 rounded-lg text-sm transition-colors border border-indigo-500/50"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Image
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        {step === 1 && (
          <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Choose Your Foundation</h1>
              <p className="text-lg text-gray-400">Select the technology stack and architecture for your next masterpiece.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`p-4 rounded-xl border transition-all duration-300 flex flex-col items-center gap-2 group ${
                    language === lang 
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_rgba(99,102,241,0.2)]' 
                      : 'border-gray-800 bg-gray-900/40 hover:border-gray-600'
                  }`}
                >
                  <span className={`text-sm font-mono font-bold ${language === lang ? 'text-indigo-400' : 'text-gray-400'} ${lang === 'Polyglot' ? 'text-amber-400' : ''}`}>
                    {lang}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {APP_TYPES.map((item) => (
                <button
                  key={item.type}
                  onClick={() => setAppType(item.type)}
                  className={`p-6 rounded-2xl border text-left transition-all duration-300 group ${
                    appType === item.type
                      ? 'border-indigo-500 bg-indigo-500/10 shadow-lg'
                      : 'border-gray-800 bg-gray-900/40 hover:border-gray-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                    appType === item.type ? 'bg-indigo-600' : 'bg-gray-800 group-hover:bg-gray-700'
                  }`}>
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-1">{item.type}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
                </button>
              ))}
            </div>

            <div className="flex justify-center pt-8">
              <button
                disabled={!language || !appType}
                onClick={() => setStep(2)}
                className="group relative px-8 py-4 bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 rounded-2xl font-bold text-lg flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-indigo-900/20"
              >
                Continue to Specs
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button 
              onClick={() => setStep(1)}
              className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Change Language/Type
            </button>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-400 mb-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-xs font-mono">
                  {language}
                </span>
                <span className="text-gray-600">/</span>
                <span className="px-2 py-0.5 rounded bg-gray-800/40 border border-gray-700 text-xs">
                  {appType}
                </span>
              </div>
              <h2 className="text-4xl font-extrabold tracking-tight">Tell me about your project</h2>
              <p className="text-gray-400">What problem does it solve? What are the key features you imagine?</p>
            </div>

            <div className="space-y-6">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. A high-performance JSON parser, a decentralized exchange, or a diamond proxy contract with zK-verification..."
                className="w-full h-48 bg-gray-900 border border-gray-800 rounded-2xl p-6 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg leading-relaxed placeholder:text-gray-600"
              />

              <button
                onClick={handleStartGeneration}
                disabled={isGenerating || description.length < 10}
                className="w-full h-16 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-indigo-900/40 group"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Architecting Infrastructure...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    Generate Architecture Spec
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 3 && spec && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-1000">
            {/* Left Column: Documentation View */}
            <div className="lg:col-span-8 space-y-8 pb-20">
              <div className="bg-gray-900/50 border border-gray-800 rounded-3xl p-8 lg:p-12 space-y-12">
                {/* Hero Section */}
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 space-y-4 order-2 md:order-1">
                    <div className="flex items-center gap-3 text-sm font-mono text-indigo-400">
                      <span className="bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 uppercase tracking-widest">{spec.language}</span>
                      <span className="bg-gray-800 px-3 py-1 rounded-full text-gray-300 uppercase tracking-widest">{spec.type}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">{spec.name}</h1>
                    <p className="text-xl text-gray-400 leading-relaxed max-w-2xl">{spec.description}</p>
                  </div>
                  
                  {/* Project Visual Vessel */}
                  <div className="w-full md:w-48 lg:w-56 aspect-square order-1 md:order-2 rounded-2xl border border-gray-800 bg-gray-950 overflow-hidden shadow-2xl relative group">
                    {isGeneratingImage ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gray-900/80 animate-pulse">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <span className="text-[10px] uppercase tracking-widest text-gray-500">Rendering...</span>
                      </div>
                    ) : projectImage ? (
                      <>
                        <img 
                          src={projectImage} 
                          alt="Project Visual" 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        />
                        <button 
                          onClick={downloadImage}
                          className="absolute bottom-2 right-2 p-2 bg-black/60 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-white/10"
                          title="Download Image"
                        >
                          <Download className="w-4 h-4 text-white" />
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700">
                        <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                        <span className="text-[10px] uppercase tracking-widest">No visual</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-800 pb-1">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`pb-2 px-2 text-sm font-bold transition-colors ${activeTab === 'overview' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Overview & Architecture
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`pb-2 px-2 text-sm font-bold transition-colors ${activeTab === 'code' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    Code & Structure
                  </button>
                </div>

                {/* Tab Content: Overview */}
                {activeTab === 'overview' && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-300">
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                        <Zap className="w-5 h-5 text-amber-400" />
                        <h2 className="text-2xl font-bold">Key Capabilities</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {spec.keyFeatures.map((feat, i) => (
                          <div key={i} className="bg-gray-800/40 border border-gray-700/50 p-4 rounded-xl flex gap-3 group hover:border-gray-500 transition-colors">
                            <span className="text-indigo-500 font-mono font-bold">{(i + 1).toString().padStart(2, '0')}</span>
                            <p className="text-gray-300 text-sm leading-relaxed">{feat}</p>
                          </div>
                        ))}
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white/90">Architecture Overview</h2>
                        <p className="text-gray-400 leading-relaxed text-sm whitespace-pre-line">{spec.architectureOverview}</p>
                      </section>
                      <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white/90">Performance Strategy</h2>
                        <p className="text-gray-400 leading-relaxed text-sm whitespace-pre-line">{spec.performanceRequirements}</p>
                      </section>
                    </div>

                    <section className="space-y-6">
                      <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-2xl p-6">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                          <Package className="w-5 h-5 text-indigo-400" />
                          Recommended Stack
                        </h2>
                        <div className="flex flex-wrap gap-2">
                          {spec.recommendedLibraries.map((lib, i) => (
                            <LibraryTag key={i} name={lib} />
                          ))}
                        </div>
                      </div>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-gray-800">
                      <section className="space-y-4">
                        <h2 className="text-xl font-bold">Testing Strategy</h2>
                        <p className="text-gray-400 leading-relaxed text-sm">{spec.testingStrategy}</p>
                      </section>
                      <section className="space-y-4">
                        <h2 className="text-xl font-bold">Deployment Plan</h2>
                        <p className="text-gray-400 leading-relaxed text-sm">{spec.deploymentPlan}</p>
                      </section>
                    </div>
                  </div>
                )}

                {/* Tab Content: Code */}
                {activeTab === 'code' && (
                  <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
                    <section className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                        <FolderTree className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-2xl font-bold">Project Structure</h2>
                      </div>
                      <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 overflow-x-auto">
                        <pre className="text-sm font-mono text-gray-300 leading-relaxed">
                          {spec.folderStructure}
                        </pre>
                      </div>
                    </section>

                    <section className="space-y-6">
                      <div className="flex items-center gap-2 border-b border-gray-800 pb-2">
                        <Code2 className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-2xl font-bold">Core Implementation Snippets</h2>
                      </div>
                      <div className="space-y-8">
                        {spec.codeSnippets?.map((snippet, i) => (
                          <CodeBlock key={i} snippet={snippet} />
                        ))}
                      </div>
                    </section>
                  </div>
                )}

              </div>
            </div>

            {/* Right Column: Interaction & Refinement */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 h-[calc(100vh-8rem)] flex flex-col">
              <div className="bg-gray-900 border border-gray-800 rounded-3xl flex-1 flex flex-col overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-sm">Refine Specification</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-gray-500 uppercase tracking-tighter">AI Active</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatHistory.length === 0 && (
                    <div className="text-center py-8 px-4">
                      <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Wand2 className="w-6 h-6 text-indigo-400" />
                      </div>
                      <p className="text-sm text-gray-400">Not quite right? Ask me to focus on security, change the concurrency model, or suggest different libraries.</p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                        msg.role === 'user' 
                          ? 'bg-indigo-600 text-white shadow-lg' 
                          : 'bg-gray-800 text-gray-300'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isRefining && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 text-gray-300 rounded-2xl px-4 py-2 text-sm flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing...
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleRefine} className="p-4 bg-gray-900 border-t border-gray-800">
                  <div className="relative">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Request refinement..."
                      className="w-full bg-gray-800 border border-gray-700 rounded-xl py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    />
                    <button
                      type="submit"
                      disabled={isRefining || !chatInput.trim()}
                      className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
              
              <div className="mt-4 text-center">
                <button 
                  onClick={() => {
                    setStep(1);
                    setSpec(null);
                    setProjectImage(null);
                    setChatHistory([]);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-400 underline underline-offset-4 transition-colors"
                >
                  Start over with a new project
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-900 bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-xs">
            © 2024 Polyglot Architect. Powered by Gemini 3 Pro and Gemini 2.5 Flash Image.
          </p>
          <div className="flex items-center gap-6">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-xs text-gray-600 hover:text-indigo-400 transition-colors">Billing Docs</a>
            <a href="#" className="text-xs text-gray-600 hover:text-indigo-400 transition-colors">Privacy</a>
            <a href="#" className="text-xs text-gray-600 hover:text-indigo-400 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
