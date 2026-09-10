"use client";

import React, { useState, useEffect } from "react";
import {
  Camera,
  Layers,
  Sparkles,
  BookOpen,
  HelpCircle,
  History,
  Calculator,
  Sun,
  Moon,
  Upload,
  CheckCircle2,
  Zap,
  FileText,
  Users,
  Code,
  Globe,
  Award,
  Terminal,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Eye,
  CheckCircle,
  X,
  ZoomIn
} from "lucide-react";

export default function CamNotesApp() {
  const [activeTab, setActiveTab] = useState<string>("camera");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [showMathSolver, setShowMathSolver] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedText, setExtractedText] = useState<string>("");
  const [notesSummary, setNotesSummary] = useState<string>("");
  const [mathSolution, setMathSolution] = useState<string>("");
  const [quizScore, setQuizScore] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  
  // Lightbox Modal State
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);
  
  // Flashcard Interactive State
  const [activeTopic, setActiveTopic] = useState<string>("Physics");
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [flashcardTopics, setFlashcardTopics] = useState<Record<string, Array<{ id: number; question: string; answer: string; topic: string }>>>({
    Physics: [
      { id: 1, topic: "Physics", question: "What is Newton's Second Law of Motion?", answer: "Force equals mass times acceleration (F = m * a)." },
      { id: 2, topic: "Physics", question: "What is the speed of light in a vacuum?", answer: "Approximately 3.00 × 10^8 meters per second (c = 300,000 km/s)." },
      { id: 3, topic: "Physics", question: "What is Kinetic Energy?", answer: "Energy possessed by an object due to its motion: KE = 1/2 * m * v^2." }
    ],
    Mathematics: [
      { id: 1, topic: "Mathematics", question: "What is the formula for Integration by Parts?", answer: "Integral of (u dv) = u*v - Integral of (v du)." },
      { id: 2, topic: "Mathematics", question: "What is the derivative of sin(x)?", answer: "The derivative of sin(x) is cos(x)." },
      { id: 3, topic: "Mathematics", question: "What is the Pythagorean Theorem?", answer: "In a right triangle: a^2 + b^2 = c^2." }
    ],
    "Computer Vision": [
      { id: 1, topic: "Computer Vision", question: "What does OCR stand for?", answer: "Optical Character Recognition - converting images of text into machine-readable text." },
      { id: 2, topic: "Computer Vision", question: "What is Bounding Box IoU?", answer: "Intersection over Union: measures overlap between predicted and ground truth bounding boxes." },
      { id: 3, topic: "Computer Vision", question: "What is Spatial AR Overlay?", answer: "Projecting digital annotations and 3D telemetry directly onto real-world camera coordinates." }
    ]
  });

  const [scanHistory, setScanHistory] = useState<Array<{ id: string; name: string; time: string; text: string }>>([
    { id: "1", name: "Physics_Lecture_Notes.jpg", time: "10 mins ago", text: "Newton's Second Law states F = m * a." },
    { id: "2", name: "Math_Equations.png", time: "1 hour ago", text: "Integration by parts: integral of u dv = uv - integral of v du" }
  ]);

  // Sync theme changes with the HTML root element
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      performGeminiScan(file);
    }
  };

  const performGeminiScan = async (file: File) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("task", "full");

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setIsProcessing(false);

      if (result.success && result.data) {
        const data = result.data;
        const text = data.extractedText || "No readable text detected in document.";
        setExtractedText(text);
        
        if (data.notesSummary) {
          setNotesSummary(data.notesSummary);
        }
        if (data.mathSolution) {
          setMathSolution(data.mathSolution);
        }

        // Dynamically populate flashcards from scanned note OCR
        if (data.flashcards && Array.isArray(data.flashcards) && data.flashcards.length > 0) {
          const scannedCards = data.flashcards.map((fc: any, idx: number) => ({
            id: Date.now() + idx,
            topic: "Scanned Note",
            question: fc.question || `Key Concept #${idx + 1} from ${file.name}`,
            answer: fc.answer || "Extracted from scanned vision analysis."
          }));

          setFlashcardTopics((prev) => ({
            "Scanned Note": scannedCards,
            ...prev
          }));
          setActiveTopic("Scanned Note");
          setCurrentCardIndex(0);
          setIsFlipped(false);
        } else if (text) {
          // Fallback flashcards created directly from OCR text
          const lines = text.split("\n").filter((l: string) => l.trim().length > 10);
          const fallbackCards = [
            {
              id: Date.now(),
              topic: "Scanned Note",
              question: `What is the core subject of ${file.name}?`,
              answer: lines[0] || text.substring(0, 150)
            },
            {
              id: Date.now() + 1,
              topic: "Scanned Note",
              question: `Key takeaway from scanned document:`,
              answer: lines[1] || text.substring(150, 300) || "Scanned note concept extracted."
            }
          ];

          setFlashcardTopics((prev) => ({
            "Scanned Note": fallbackCards,
            ...prev
          }));
          setActiveTopic("Scanned Note");
          setCurrentCardIndex(0);
          setIsFlipped(false);
        }

        setScanHistory((prev) => [
          { id: Date.now().toString(), name: file.name, time: "Just now", text },
          ...prev
        ]);
      } else {
        alert(result.error || "Failed to analyze document with Gemini AI.");
      }
    } catch (err: any) {
      setIsProcessing(false);
      console.error("Gemini API connection error:", err);
      alert("Error connecting to Gemini API server.");
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">
      {/* SIDEBAR - DYNAMIC LIGHT / DARK THEME */}
      <aside className="w-64 bg-white dark:bg-slate-900 text-black dark:text-white flex flex-col border-r border-slate-200 dark:border-slate-800 shadow-xl shrink-0 transition-colors duration-200">
        {/* SAAS BRAND LOGO HEADER */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between transition-colors duration-200">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpg"
              alt="CamNotes AR Silicon Squad Logo"
              className="w-10 h-10 rounded-xl object-cover border border-blue-500/30 shadow-md"
            />
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-black dark:text-white">CamNotes AR</h1>
              <p className="text-[10px] text-blue-600 dark:text-yellow-400 font-extrabold uppercase tracking-wider">Silicon Squad</p>
            </div>
          </div>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveTab("camera")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "camera"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold"
                : "text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white"
            }`}
          >
            <Camera className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            Live AR Camera
          </button>

          <button
            onClick={() => setActiveTab("hud")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "hud"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold"
                : "text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white"
            }`}
          >
            <Layers className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            AR HUD Overlay
          </button>

          <button
            onClick={() => setActiveTab("notes")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "notes"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold"
                : "text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            AI Notes & Summary
          </button>

          <button
            onClick={() => setActiveTab("flashcards")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "flashcards"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold"
                : "text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white"
            }`}
          >
            <BookOpen className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            Interactive Flashcards
          </button>

          <button
            onClick={() => setActiveTab("quiz")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "quiz"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold"
                : "text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white"
            }`}
          >
            <HelpCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            AI Quiz Mode
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "history"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold"
                : "text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white"
            }`}
          >
            <History className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            Scan History
          </button>

          <button
            onClick={() => setActiveTab("about")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === "about"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold"
                : "text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white"
            }`}
          >
            <Users className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
            About Us
          </button>

          {/* CONDITIONAL TAB: MATH SOLVER */}
          {showMathSolver && (
            <button
              onClick={() => setActiveTab("math")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border border-yellow-500/40 ${
                activeTab === "math"
                  ? "bg-yellow-500 text-slate-900 shadow-md font-bold"
                  : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/20"
              }`}
            >
              <Calculator className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              Step-by-Step Math
            </button>
          )}
        </nav>

        {/* SIDEBAR CONTROLS */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4 bg-slate-50 dark:bg-slate-950/50 transition-colors duration-200">
          {/* MATH SOLVER TOGGLE */}
          <div className="flex items-center justify-between text-xs text-slate-800 dark:text-slate-300 font-semibold">
            <span className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              Math Solver Tab
            </span>
            <input
              type="checkbox"
              checked={showMathSolver}
              onChange={(e) => setShowMathSolver(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
            />
          </div>

          {/* DARK / LIGHT THEME TOGGLE BUTTON */}
          <button
            onClick={toggleTheme}
            type="button"
            className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-xs font-bold text-white transition-all shadow-md cursor-pointer border border-yellow-400/50"
          >
            <span className="flex items-center gap-2.5">
              {themeMode === "light" ? (
                <Sun className="w-4 h-4 text-yellow-300 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-yellow-400" />
              )}
              {themeMode === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
            </span>
            <span className="bg-yellow-400 text-slate-900 font-extrabold uppercase text-[10px] px-2 py-0.5 rounded shadow">
              {themeMode === "light" ? "LIGHT" : "DARK"}
            </span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-900 text-black dark:text-slate-100 transition-colors duration-200">
        {/* HEADER BAR */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between bg-white dark:bg-slate-900 shadow-sm shrink-0 transition-colors duration-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-black dark:text-white capitalize">
              {activeTab === "hud" ? "AR HUD Overlay" : activeTab === "math" ? "Step-by-Step Math Solver" : activeTab === "about" ? "About Us - Silicon Squad" : `${activeTab} Workspace`}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors shadow-sm">
              <Upload className="w-4 h-4 text-yellow-400" />
              Upload Image (.png, .jpg, .jfif)
              <input
                type="file"
                accept="image/*,.jfif,.jiff"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </header>

        {/* WORKSPACE BODY */}
        <div className="flex-1 p-8 overflow-y-auto space-y-6">
          {/* TAB: ABOUT US */}
          {activeTab === "about" && (
            <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
              {/* HERO BANNER */}
              <div className="relative bg-gradient-to-r from-blue-600 to-slate-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-yellow-400 overflow-hidden flex flex-col md:flex-row items-center gap-8">
                <img
                  src="/logo.jpg"
                  alt="Silicon Squad Brand Logo"
                  className="w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-yellow-400 shadow-2xl object-cover"
                />
                <div className="space-y-4 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider">
                    <Award className="w-4 h-4 text-slate-900" />
                    Silicon Squad Innovation
                  </div>
                  <h3 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                    About Silicon Squad & CamNotes AR
                  </h3>
                  <p className="text-sm md:text-base text-slate-200 leading-relaxed max-w-2xl">
                    CamNotes AR is a next-generation AI & Computer Vision SaaS platform crafted by <strong className="text-yellow-300">Silicon Squad</strong>. We build intelligent multimodal camera software that transforms raw study notes and equations into interactive AR overlays, instant flashcards, and automated quizzes.
                  </p>
                </div>
              </div>

              {/* TEAM MEMBERS GRID */}
              <div>
                <h4 className="text-2xl font-bold text-black dark:text-white mb-6 flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600 dark:text-yellow-400" />
                  Meet the Innovators
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* MEMBER 1: ABDUL WAHAB */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-blue-600/40 shadow-xl space-y-4 relative overflow-hidden transition-all hover:scale-[1.01]">
                    <div className="relative group inline-block cursor-pointer" onClick={() => setLightboxImage({ src: "/abdul_wahab.jpg", title: "Abdul Wahab - Founder & CEO" })}>
                      <img
                        src="/abdul_wahab.jpg"
                        alt="Abdul Wahab"
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-yellow-400 shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:brightness-90"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                        <ZoomIn className="w-6 h-6 text-yellow-400" />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 bg-yellow-400/20 px-3 py-1 rounded-full uppercase tracking-wider">
                        Founder & CEO
                      </span>
                      <h5 className="text-2xl font-extrabold text-black dark:text-white mt-2">
                        Abdul Wahab
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                        Silicon Squad Core Team
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      Founder & CEO of Silicon Squad and Vision Architect for CamNotes AR. Focused on real-time neural OCR engine design, multimodal SaaS architecture, and product leadership.
                    </p>
                    <div className="flex items-center gap-3 pt-2 font-mono text-xs text-blue-600 dark:text-yellow-400">
                      <Code className="w-4 h-4" /> Founder & CEO | Vision Engine | AI SaaS
                    </div>
                  </div>

                  {/* MEMBER 2: ABDUL REHMAN */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border-2 border-yellow-400/50 shadow-xl space-y-4 relative overflow-hidden transition-all hover:scale-[1.01]">
                    <div className="relative group inline-block cursor-pointer" onClick={() => setLightboxImage({ src: "/abdul_rehman.png", title: "Abdul Rehman - Co-Founder" })}>
                      <img
                        src="/abdul_rehman.png"
                        alt="Abdul Rehman"
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500 shadow-xl transition-all duration-300 group-hover:scale-105 group-hover:brightness-90"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                        <ZoomIn className="w-6 h-6 text-blue-400" />
                      </div>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-600/20 px-3 py-1 rounded-full uppercase tracking-wider">
                        Co-Founder
                      </span>
                      <h5 className="text-2xl font-extrabold text-black dark:text-white mt-2">
                        Abdul Rehman
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                        Silicon Squad Core Team
                      </p>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      Co-Founder and AI Telemetry Specialist at Silicon Squad. Drives automated flashcard logic, symbolic math problem-solving algorithms, and real-time AR HUD overlay pipeline.
                    </p>
                    <div className="flex items-center gap-3 pt-2 font-mono text-xs text-blue-600 dark:text-yellow-400">
                      <Terminal className="w-4 h-4" /> Co-Founder | AI Telemetry | AR Overlay
                    </div>
                  </div>
                </div>
              </div>

              {/* MISSION STATEMENT CARD */}
              <div className="bg-slate-900 text-white rounded-2xl p-8 border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <h5 className="text-xl font-bold text-white flex items-center gap-2 justify-center md:justify-start">
                    <Globe className="w-5 h-5 text-yellow-400" />
                    Silicon Squad Vision
                  </h5>
                  <p className="text-xs text-slate-400 max-w-xl">
                    Empowering students, researchers, and professionals worldwide with cutting-edge AR vision software.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("camera")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center gap-2"
                >
                  <Camera className="w-4 h-4 text-yellow-400" />
                  Try CamNotes Live
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: LIVE AR CAMERA */}
          {activeTab === "camera" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* CAMERA VIEWPORT - LIGHT & DARK THEME RESPONSIVE */}
                <div className="lg:col-span-2 bg-slate-100 dark:bg-slate-900 rounded-2xl border-2 border-blue-600/30 overflow-hidden relative shadow-lg min-h-[420px] flex flex-col items-center justify-center p-6 text-center transition-colors duration-200">
                  {previewUrl ? (
                    <div
                      className="relative group cursor-pointer"
                      onClick={() => setLightboxImage({ src: previewUrl, title: selectedFile?.name || "Uploaded Scanned Note" })}
                    >
                      <img
                        src={previewUrl}
                        alt="Uploaded Note"
                        className="max-h-[380px] object-contain rounded-lg shadow-lg transition-transform duration-200 group-hover:scale-[1.02]"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
                        <span className="bg-slate-900/90 text-yellow-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-yellow-400/40">
                          <ZoomIn className="w-4 h-4" /> Expand Image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-full bg-blue-600/10 dark:bg-blue-600/20 text-blue-600 dark:text-yellow-400 flex items-center justify-center mx-auto transition-colors duration-200">
                        <Camera className="w-8 h-8" />
                      </div>
                      <p className="text-black dark:text-slate-200 font-semibold text-sm transition-colors duration-200">
                        No active camera feed or uploaded note selected.
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium transition-colors duration-200">
                        Upload an image or note (.png, .jpg, .jfif) to perform real-time AI vision analysis.
                      </p>
                    </div>
                  )}

                  {/* AR HUD OVERLAY CHIP - LIGHT & DARK THEME RESPONSIVE */}
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-2 text-xs font-mono font-semibold text-slate-900 dark:text-yellow-400 shadow-md transition-colors duration-200">
                    <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-yellow-400 animate-pulse" />
                    AR Telemetry Active | 60 FPS
                  </div>
                </div>

                {/* REAL-TIME OCR PANEL */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between transition-colors duration-200">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-black dark:text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Extracted Text
                      </h3>
                      {isProcessing && (
                        <span className="text-xs text-blue-600 dark:text-yellow-400 font-semibold animate-pulse">
                          Scanning...
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[220px] font-mono text-xs text-black dark:text-slate-200 whitespace-pre-wrap transition-colors duration-200">
                      {extractedText || "Upload a document to extract OCR text..."}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (selectedFile) {
                        performGeminiScan(selectedFile);
                      } else {
                        alert("Please upload an image note (.png, .jpg, .jfif) using the top right 'Upload Image' button to perform real-time Gemini AI vision analysis.");
                      }
                    }}
                    disabled={isProcessing}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    {isProcessing ? "Processing AI OCR..." : "Trigger AI OCR Scan"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AR HUD OVERLAY */}
          {activeTab === "hud" && (
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6 text-white">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-yellow-400" />
                    AR Multimodal Telemetry Grid
                  </h3>
                  <p className="text-xs text-slate-400">Live vision spatial mapping and note spatial bounding</p>
                </div>
                <span className="bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs px-3 py-1 rounded-full font-mono">
                  Engine Ready
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-semibold">OCR Confidence</p>
                  <p className="text-2xl font-extrabold text-yellow-400 mt-1">99.4%</p>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-semibold">Vision Processing Latency</p>
                  <p className="text-2xl font-extrabold text-blue-400 mt-1">12 ms</p>
                </div>
                <div className="bg-slate-950 p-5 rounded-xl border border-slate-800">
                  <p className="text-xs text-slate-400 font-semibold">Detected Text Segments</p>
                  <p className="text-2xl font-extrabold text-white mt-1">14 Nodes</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AI NOTES & SUMMARY */}
          {activeTab === "notes" && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4 transition-colors duration-200">
              <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Automated AI Summary & Study Guide
              </h3>
              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 font-sans text-sm text-black dark:text-slate-200 leading-relaxed whitespace-pre-wrap transition-colors duration-200">
                {notesSummary || "No note summary generated yet. Scan a document or select scan history to construct AI summary notes."}
              </div>
            </div>
          )}

          {/* TAB 4: FLASHCARDS - GLASSMORPHIC INTERACTIVE WORKSPACE */}
          {activeTab === "flashcards" && (
            <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
              {/* TOPIC SELECTOR TABS */}
              <div className="flex items-center justify-between flex-wrap gap-4 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-md">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-yellow-400" />
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Study Topics:</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {Object.keys(flashcardTopics).map((topicName) => (
                    <button
                      key={topicName}
                      onClick={() => {
                        setActiveTopic(topicName);
                        setCurrentCardIndex(0);
                        setIsFlipped(false);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        activeTopic === topicName
                          ? "bg-blue-600 text-white shadow-blue-600/30 scale-105"
                          : "bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {topicName}
                    </button>
                  ))}
                </div>
              </div>

              {/* GLASSMORPHIC 3D FLIP FLASHCARD */}
              <div className="relative group perspective-[1200px]">
                {/* 3D ROTATING CARD CONTAINER */}
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`w-full min-h-[340px] rounded-3xl p-8 cursor-pointer transition-all duration-700 transform-style-3d relative shadow-2xl flex flex-col justify-between border ${
                    isFlipped ? "rotate-y-180" : ""
                  } ${
                    themeMode === "light"
                      ? "bg-white/80 backdrop-blur-xl border-white/60 shadow-blue-500/10 text-slate-900"
                      : "bg-slate-800/80 backdrop-blur-xl border-slate-700/60 shadow-black/40 text-white"
                  }`}
                >
                  {/* FRONT SIDE - QUESTION */}
                  <div className={`space-y-6 flex-1 flex flex-col justify-between ${isFlipped ? "opacity-0 invisible hidden" : "opacity-100 visible"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-600 dark:text-yellow-400 uppercase tracking-widest bg-blue-50 dark:bg-yellow-400/10 px-3 py-1.5 rounded-full border border-blue-200 dark:border-yellow-400/20">
                        {flashcardTopics[activeTopic][currentCardIndex]?.topic} • Card #{currentCardIndex + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5" /> Click to Flip
                      </span>
                    </div>

                    <div className="my-auto py-6">
                      <h4 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-relaxed">
                        {flashcardTopics[activeTopic][currentCardIndex]?.question}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/60 dark:border-slate-700/60 pt-4">
                      <span>Question Side</span>
                      <span className="font-semibold text-blue-600 dark:text-yellow-400 flex items-center gap-1">
                        Reveal Answer <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* BACK SIDE - ANSWER */}
                  <div className={`space-y-6 flex-1 flex flex-col justify-between ${isFlipped ? "opacity-100 visible" : "opacity-0 invisible hidden"}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-widest bg-yellow-400/20 px-3 py-1.5 rounded-full border border-yellow-400/40">
                        Verified Answer
                      </span>
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                        <RotateCw className="w-3.5 h-3.5" /> Click to Flip Question
                      </span>
                    </div>

                    <div className="my-auto py-6 bg-blue-500/10 dark:bg-yellow-400/10 p-6 rounded-2xl border border-blue-500/20 dark:border-yellow-400/20">
                      <p className="text-xl font-bold text-blue-700 dark:text-yellow-300 leading-relaxed">
                        {flashcardTopics[activeTopic][currentCardIndex]?.answer}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/60 dark:border-slate-700/60 pt-4">
                      <span>Answer Side</span>
                      <span className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
                        Mastered <CheckCircle className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD CONTROLS & PROGRESS */}
              <div className="flex items-center justify-between bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-md">
                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : flashcardTopics[activeTopic].length - 1));
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 font-bold text-xs transition-all shadow-sm cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Card
                </button>

                <div className="font-extrabold text-sm text-slate-800 dark:text-slate-200 font-mono">
                  {currentCardIndex + 1} / {flashcardTopics[activeTopic].length}
                </div>

                <button
                  onClick={() => {
                    setIsFlipped(false);
                    setCurrentCardIndex((prev) => (prev < flashcardTopics[activeTopic].length - 1 ? prev + 1 : 0));
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  Next Card <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: QUIZ MODE */}
          {activeTab === "quiz" && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 transition-colors duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  AI Generated Knowledge Check
                </h3>
                <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-400/20 px-3 py-1 rounded-full">
                  Score: {quizScore} pts
                </span>
              </div>

              <p className="text-base font-semibold text-black dark:text-slate-100">
                Q1: Which formula represents Newton's 2nd Law?
              </p>

              <div className="space-y-3">
                {["F = m * a", "E = mc^2", "V = I * R", "P = W / t"].map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedAnswer(idx);
                      if (idx === 0) setQuizScore(100);
                    }}
                    className={`w-full text-left p-4 rounded-xl border font-medium text-sm transition-all flex items-center justify-between ${
                      selectedAnswer === idx
                        ? idx === 0
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-red-500 text-white border-red-500"
                        : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-black dark:text-white hover:border-blue-500"
                    }`}
                  >
                    {option}
                    {selectedAnswer === idx && <CheckCircle2 className="w-5 h-5 text-yellow-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: SCAN HISTORY */}
          {activeTab === "history" && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6 transition-colors duration-200">
              <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Previous Scans & Documents
              </h3>

              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {scanHistory.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-black dark:text-white">{item.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.time}</p>
                    </div>
                    <button
                      onClick={() => {
                        setExtractedText(item.text);
                        setActiveTab("camera");
                      }}
                      className="text-xs font-bold text-blue-600 dark:text-yellow-400 hover:underline flex items-center gap-1"
                    >
                      Load Scan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: CONDITIONAL MATH SOLVER */}
          {activeTab === "math" && showMathSolver && (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border-2 border-yellow-400 shadow-lg space-y-6 transition-colors duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
                <h3 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-yellow-500" />
                  Step-by-Step Symbolic Math Solver
                </h3>
                <span className="bg-yellow-400 text-slate-900 text-xs font-extrabold px-3 py-1 rounded-full uppercase">
                  Active
                </span>
              </div>

              <div className="bg-slate-900 text-yellow-300 p-6 rounded-xl font-mono text-sm leading-relaxed whitespace-pre-wrap border border-yellow-500/30">
                {mathSolution || "No math problem currently scanned."}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* LIGHTBOX MODAL DIALOG */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl border-2 border-yellow-400 p-4 md:p-6 shadow-2xl flex flex-col items-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* CLOSE BUTTON */}
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full p-2.5 transition-colors shadow-lg border border-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5 text-yellow-400" />
            </button>

            {/* TITLE */}
            <h4 className="font-extrabold text-base md:text-lg text-white mb-4 pr-12 text-center">
              {lightboxImage.title}
            </h4>

            {/* FULL RESOLUTION IMAGE */}
            <div className="flex-1 overflow-auto flex items-center justify-center rounded-2xl bg-black/40 p-2 w-full">
              <img
                src={lightboxImage.src}
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto object-contain rounded-xl shadow-2xl border border-slate-800"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
