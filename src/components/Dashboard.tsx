import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, Clock, AlertTriangle, CheckCircle, 
  Trash2, Plus, Bell, Sparkles, Filter, CheckSquare, 
  Square, CalendarDays, BarChart2, Coffee, MessageSquare, 
  HelpCircle, RefreshCw, Moon 
} from "lucide-react";
import { Deadline } from "../types";

interface DashboardProps {
  deadlines: Deadline[];
  onAddDeadline: (d: Omit<Deadline, "id" | "createdAt" | "completed">) => void;
  onToggleComplete: (id: string) => void;
  onDeleteDeadline: (id: string) => void;
  onSnoozeDeadline: (id: string, hours: number) => void;
  onTriggerCall: (type: "incoming" | "outgoing") => void;
  onDiscussDeadlineInChat: (title: string) => void;
}

export default function Dashboard({
  deadlines,
  onAddDeadline,
  onToggleComplete,
  onDeleteDeadline,
  onSnoozeDeadline,
  onTriggerCall,
  onDiscussDeadlineInChat,
}: DashboardProps) {
  // Filters State
  const [filterUrgency, setFilterUrgency] = useState<"all" | "high" | "medium" | "low">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "completed">("active");

  // Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newUrgency, setNewUrgency] = useState<"low" | "medium" | "high">("medium");
  const [newCategory, setNewCategory] = useState<"study" | "work" | "personal" | "health" | "other">("study");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTime, setNewTime] = useState("12:00");

  // Statistics calculation
  const totalCount = deadlines.length;
  const activeDeadlines = deadlines.filter(d => !d.completed);
  const completedCount = deadlines.filter(d => d.completed).length;
  const highUrgencyCount = activeDeadlines.filter(d => d.urgency === "high").length;
  
  // Wellness / Peace Index calculation
  // Base peace is 100%. -15% for each High Urgency active goal, -8% for Medium, -4% for Low.
  // Completing goals restores peace index.
  const calculatePeaceIndex = () => {
    let base = 100;
    activeDeadlines.forEach(d => {
      if (d.urgency === "high") base -= 15;
      else if (d.urgency === "medium") base -= 8;
      else base -= 4;
    });
    return Math.max(10, base);
  };

  const peaceIndex = calculatePeaceIndex();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDueDate) return;

    onAddDeadline({
      title: newTitle.trim(),
      description: newDescription.trim(),
      urgency: newUrgency,
      category: newCategory,
      dueDate: newDueDate,
      time: newTime || undefined,
    });

    // Reset Form
    setNewTitle("");
    setNewDescription("");
    setNewUrgency("medium");
    setNewCategory("study");
    setNewDueDate("");
    setNewTime("12:00");
    setShowAddForm(false);
  };

  // Filter deadlines
  const filteredDeadlines = deadlines.filter(d => {
    const matchesUrgency = filterUrgency === "all" || d.urgency === filterUrgency;
    const matchesCategory = filterCategory === "all" || d.category === filterCategory;
    const matchesStatus = 
      filterStatus === "all" || 
      (filterStatus === "active" && !d.completed) || 
      (filterStatus === "completed" && d.completed);
    return matchesUrgency && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Mindful Cockpit Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-[#E9ECEF] p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold bg-[#F1F2F6] text-[#6C5CE7] border border-[#DFE6E9] rounded-full px-2.5 py-1 uppercase tracking-widest">
              System Calibrated: Calm
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[#1E272E]">Hello, companion.</h2>
          <p className="text-sm text-[#636E72]">
            {highUrgencyCount > 0 
              ? `You have ${highUrgencyCount} high-urgency goals drawing near. Let's tackle them honestly, step-by-step.`
              : "Your mind space is serene and balanced. Enjoy this quiet momentum."
            }
          </p>
        </div>
        
        {/* Core Quick call launcher */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onTriggerCall("outgoing")}
            className="flex items-center gap-2 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white rounded-2xl px-5 py-3 text-sm font-semibold shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Call Liora Voice Coach</span>
          </button>
          
          <button 
            onClick={() => onTriggerCall("incoming")}
            className="p-3 bg-white hover:bg-gray-50 text-[#636E72] rounded-2xl border border-[#DFE6E9] transition shadow-sm"
            title="Request Instant Check-in Call"
          >
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metrics Card 1: Active Deadlines */}
        <div className="bg-white p-6 rounded-3xl border-l-4 border-[#6C5CE7] border-t border-b border-r border-[#E9ECEF] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-[#6C5CE7] uppercase tracking-widest">Active Goals</p>
            <h3 className="text-3xl font-bold mt-2 text-[#1E272E]">{activeDeadlines.length}</h3>
            <p className="text-[11px] text-[#636E72] italic">Unfinished priorities</p>
          </div>
          <div className="p-3 bg-[#F1F2F6] rounded-2xl text-[#6C5CE7] border border-[#E9ECEF]">
            <CalendarDays className="w-5 h-5" />
          </div>
        </div>

        {/* Metrics Card 2: High Urgency Alert */}
        <div className={`p-6 rounded-3xl border-l-4 border-t border-b border-r border-[#E9ECEF] shadow-sm flex items-center justify-between transition ${
          highUrgencyCount > 0 
            ? "bg-red-50 border-l-red-500" 
            : "bg-white border-l-[#A4B0BE]"
        }`}>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">High Priority</p>
            <h3 className="text-3xl font-bold mt-2 text-[#1E272E]">
              {highUrgencyCount < 10 ? `0${highUrgencyCount}` : highUrgencyCount}
            </h3>
            <p className="text-[11px] text-[#636E72] italic">Immediate attention</p>
          </div>
          <div className={`p-3 rounded-2xl border transition ${
            highUrgencyCount > 0 
              ? "bg-white border-red-200 text-red-500" 
              : "bg-[#F1F2F6] border-[#E9ECEF] text-[#636E72]"
          }`}>
            <AlertTriangle className={`w-5 h-5 ${highUrgencyCount > 0 ? "animate-pulse" : ""}`} />
          </div>
        </div>

        {/* Metrics Card 3: Completed Rates */}
        <div className="bg-white p-6 rounded-3xl border-l-4 border-blue-500 border-t border-b border-r border-[#E9ECEF] shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Task Completion</p>
            <h3 className="text-3xl font-bold mt-2 text-[#1E272E]">
              {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
            </h3>
            <p className="text-[11px] text-[#636E72] italic">{completedCount} of {totalCount} completed</p>
          </div>
          <div className="p-3 bg-[#F1F2F6] rounded-2xl text-blue-500 border border-[#E9ECEF]">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Metrics Card 4: Mindful Peace Index */}
        <div className="bg-white p-6 rounded-3xl border-l-4 border-amber-500 border-t border-b border-r border-[#E9ECEF] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Wellness Peace Index</p>
              <h3 className={`text-3xl font-bold mt-2 text-[#1E272E]`}>
                {peaceIndex}%
              </h3>
            </div>
            <div className="p-2 bg-amber-50 text-amber-500 rounded-2xl border border-amber-100">
              <Moon className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-[#F1F2F6] h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                peaceIndex >= 70 ? "bg-emerald-500" : peaceIndex >= 40 ? "bg-amber-500" : "bg-red-500"
              }`}
              style={{ width: `${peaceIndex}%` }}
            />
          </div>
          <p className="text-[10px] text-[#636E72] mt-2 italic">
            {peaceIndex >= 70 ? '"Peaceful breathing, steady focus."' : peaceIndex >= 40 ? '"A bit busy. One thing at a time."' : '"System heavy. Stop and breathe."'}
          </p>
        </div>

      </div>

      {/* Control Filters and Trigger Add Button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-[#636E72] text-xs font-bold uppercase tracking-wider mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter:</span>
          </div>
          
          {/* Urgency select */}
          <select 
            value={filterUrgency} 
            onChange={(e) => setFilterUrgency(e.target.value as any)}
            className="bg-white border border-[#DFE6E9] text-[#2D3436] text-xs font-semibold rounded-xl px-3 py-2.5 shadow-sm focus:outline-none focus:border-[#6C5CE7]"
          >
            <option value="all">All Urgency</option>
            <option value="high">🔴 High Urgency</option>
            <option value="medium">🟡 Medium Urgency</option>
            <option value="low">🟢 Low Urgency</option>
          </select>

          {/* Category select */}
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-white border border-[#DFE6E9] text-[#2D3436] text-xs font-semibold rounded-xl px-3 py-2.5 shadow-sm focus:outline-none focus:border-[#6C5CE7]"
          >
            <option value="all">All Categories</option>
            <option value="study">🎓 Study</option>
            <option value="work">💼 Work</option>
            <option value="personal">🏠 Personal</option>
            <option value="health">🌱 Health</option>
            <option value="other">✨ Other</option>
          </select>

          {/* Status filter toggles */}
          <div className="flex bg-[#F1F2F6] border border-[#DFE6E9] rounded-xl p-1">
            <button
              onClick={() => setFilterStatus("active")}
              className={`text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition ${
                filterStatus === "active" ? "bg-white text-[#6C5CE7] shadow-sm" : "text-[#636E72] hover:text-[#1E272E]"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterStatus("completed")}
              className={`text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition ${
                filterStatus === "completed" ? "bg-white text-[#6C5CE7] shadow-sm" : "text-[#636E72] hover:text-[#1E272E]"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilterStatus("all")}
              className={`text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition ${
                filterStatus === "all" ? "bg-white text-[#6C5CE7] shadow-sm" : "text-[#636E72] hover:text-[#1E272E]"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Trigger Add Form Button */}
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white font-bold text-xs px-5 py-3 rounded-xl transition w-full sm:w-auto justify-center shadow-sm font-sans uppercase tracking-wider"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add Deadline</span>
        </button>
      </div>

      {/* Add Form sliding container */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleFormSubmit} className="bg-white border border-[#E9ECEF] rounded-3xl p-6 space-y-4 shadow-md">
              <h3 className="text-sm font-bold text-[#1E272E] pb-2 border-b border-[#F1F2F6] flex items-center gap-1.5 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-[#6C5CE7]" />
                <span>Establish New Deadline Goal</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#636E72]">Deadline Title *</label>
                  <input 
                    type="text" 
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., Submit Chemistry Thesis"
                    className="w-full bg-white border border-[#DFE6E9] focus:outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7] rounded-xl px-4 py-2.5 text-sm text-[#2D3436] shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#636E72]">Urgency Level *</label>
                    <select
                      value={newUrgency}
                      onChange={(e) => setNewUrgency(e.target.value as any)}
                      className="w-full bg-white border border-[#DFE6E9] focus:outline-none focus:border-[#6C5CE7] rounded-xl px-3 py-2.5 text-sm text-[#2D3436] shadow-sm font-semibold"
                    >
                      <option value="low">🟢 Low Urgency</option>
                      <option value="medium">🟡 Medium Urgency</option>
                      <option value="high">🔴 High Urgency</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#636E72]">Category *</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full bg-white border border-[#DFE6E9] focus:outline-none focus:border-[#6C5CE7] rounded-xl px-3 py-2.5 text-sm text-[#2D3436] shadow-sm font-semibold"
                    >
                      <option value="study">🎓 Study</option>
                      <option value="work">💼 Work</option>
                      <option value="personal">🏠 Personal</option>
                      <option value="health">🌱 Health</option>
                      <option value="other">✨ Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#636E72]">Due Date *</label>
                    <input 
                      type="date" 
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full bg-white border border-[#DFE6E9] focus:outline-none focus:border-[#6C5CE7] rounded-xl px-4 py-2.5 text-sm text-[#2D3436] shadow-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#636E72]">Due Time</label>
                    <input 
                      type="time" 
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full bg-white border border-[#DFE6E9] focus:outline-none focus:border-[#6C5CE7] rounded-xl px-4 py-2.5 text-sm text-[#2D3436] shadow-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#636E72]">Short Note / Description</label>
                  <input 
                    type="text" 
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Briefly state context..."
                    className="w-full bg-white border border-[#DFE6E9] focus:outline-none focus:border-[#6C5CE7] rounded-xl px-4 py-2.5 text-sm text-[#2D3436] shadow-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-[#F1F2F6] hover:bg-[#DFE6E9] text-[#2D3436] text-xs font-bold px-5 py-3 rounded-xl transition font-sans uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#6C5CE7] hover:bg-[#5b4bc4] text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm font-sans uppercase tracking-wider"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deadlines List */}
      <div className="space-y-3.5">
        {filteredDeadlines.length === 0 ? (
          <div className="bg-white border border-[#E9ECEF] p-12 rounded-3xl text-center shadow-sm">
            <Calendar className="w-8 h-8 text-[#A4B0BE] mx-auto mb-3" />
            <p className="text-base text-[#1E272E] font-bold">No matching deadlines registered.</p>
            <p className="text-xs text-[#636E72] font-mono mt-1 uppercase tracking-wider">Try toggling filter constraints or adding a new deadline.</p>
          </div>
        ) : (
          filteredDeadlines.map((item) => {
            // Determine days remaining
            const dateObj = new Date(`${item.dueDate}T${item.time || '23:59'}`);
            const diffMs = dateObj.getTime() - new Date().getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            
            let dateNotice = "";
            let noticeColorClass = "text-[#636E72]";
            if (item.completed) {
              dateNotice = "Goal achieved";
              noticeColorClass = "text-emerald-500 font-bold";
            } else if (diffDays < 0) {
              dateNotice = "Overdue";
              noticeColorClass = "text-red-500 font-bold";
            } else if (diffDays === 0) {
              dateNotice = "Due today";
              noticeColorClass = "text-amber-500 font-semibold";
            } else if (diffDays === 1) {
              dateNotice = "Due tomorrow";
              noticeColorClass = "text-amber-500 font-medium";
            } else {
              dateNotice = `${diffDays} days remaining`;
            }

            return (
              <div 
                key={item.id}
                className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl border shadow-sm transition ${
                  item.completed 
                    ? "bg-white border-[#F1F2F6] opacity-65" 
                    : item.urgency === "high"
                      ? "bg-red-50/50 border-red-200 hover:border-red-300" 
                      : item.urgency === "medium"
                        ? "bg-amber-50/30 border-amber-200 hover:border-amber-300"
                        : "bg-white border-[#E9ECEF] hover:border-[#6C5CE7]/40"
                }`}
              >
                {/* Left: Checkbox + Title / Urgency */}
                <div className="flex items-start gap-4 flex-1">
                  <button 
                    onClick={() => onToggleComplete(item.id)}
                    className="mt-1 transition shrink-0"
                    title={item.completed ? "Mark unfinished" : "Mark achieved"}
                  >
                    {item.completed ? (
                      <CheckCircle className="w-5.5 h-5.5 text-emerald-500" />
                    ) : (
                      <div className="w-5.5 h-5.5 rounded-lg border-2 border-[#DFE6E9] hover:border-[#6C5CE7] transition flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-sm bg-transparent" />
                      </div>
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        item.urgency === "high" 
                          ? "bg-red-100 text-red-600 border-red-200" 
                          : item.urgency === "medium"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-emerald-100 text-emerald-700 border-emerald-200"
                      }`}>
                        {item.urgency.toUpperCase()}
                      </span>
                      
                      <span className="text-[10px] font-bold text-[#A4B0BE] uppercase tracking-widest">
                        {item.category}
                      </span>
                    </div>

                    <h4 className={`text-base font-bold tracking-tight ${
                      item.completed ? "line-through text-[#A4B0BE]" : "text-[#1E272E]"
                    }`}>
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="text-xs text-[#636E72] leading-relaxed max-w-xl">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Due dates, alert call actions */}
                <div className="flex flex-wrap items-center gap-4 sm:justify-end w-full sm:w-auto pl-9 sm:pl-0">
                  
                  {/* Due state */}
                  <div className="space-y-0.5 text-left sm:text-right">
                    <div className="flex items-center gap-1.5 text-xs text-[#2D3436] font-mono font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-[#A4B0BE]" />
                      <span>{item.dueDate}</span>
                      {item.time && (
                        <>
                          <Clock className="w-3.5 h-3.5 text-[#A4B0BE] ml-1" />
                          <span>{item.time}</span>
                        </>
                      )}
                    </div>
                    <p className={`text-[11px] font-bold uppercase tracking-wider ${noticeColorClass}`}>
                      {dateNotice}
                    </p>
                  </div>

                  {/* Actions bar */}
                  <div className="flex items-center gap-2">
                    
                    {/* Discuss in Chat */}
                    {!item.completed && (
                      <button
                        onClick={() => onDiscussDeadlineInChat(item.title)}
                        className="p-2.5 bg-white hover:bg-gray-50 text-[#636E72] hover:text-[#1E272E] rounded-xl border border-[#DFE6E9] transition shadow-sm"
                        title="Discuss and Coach with Liora"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Snooze Options */}
                    {!item.completed && (
                      <div className="relative group">
                        <button
                          className="p-2.5 bg-white hover:bg-gray-50 text-[#636E72] hover:text-[#1E272E] rounded-xl border border-[#DFE6E9] transition text-xs font-bold uppercase tracking-widest shadow-sm"
                          title="Snooze deadline (+24 hours)"
                        >
                          Snooze
                        </button>
                        <div className="absolute right-0 bottom-full mb-1.5 z-10 hidden group-hover:block bg-white border border-[#E9ECEF] rounded-xl p-1.5 shadow-lg space-y-1 min-w-[90px]">
                          <button
                            onClick={() => onSnoozeDeadline(item.id, 1)}
                            className="block w-full text-left text-[10px] font-bold uppercase tracking-wider hover:bg-[#F1F2F6] text-[#2D3436] px-2 py-1.5 rounded"
                          >
                            +1 Hour
                          </button>
                          <button
                            onClick={() => onSnoozeDeadline(item.id, 24)}
                            className="block w-full text-left text-[10px] font-bold uppercase tracking-wider hover:bg-[#F1F2F6] text-[#2D3436] px-2 py-1.5 rounded"
                          >
                            +1 Day
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delete */}
                    <button
                      onClick={() => onDeleteDeadline(item.id)}
                      className="p-2.5 bg-white hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl border border-[#DFE6E9] hover:border-red-200 transition shadow-sm"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                  </div>

                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
