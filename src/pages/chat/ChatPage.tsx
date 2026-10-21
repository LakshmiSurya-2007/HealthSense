import { useEffect, useRef, useState, useMemo } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { askGemini } from '@/services/gemini'
import type { ChatMessage } from '@/services/gemini'
import { getAssessmentById } from '@/services/assessmentService'
import { MarkdownContent } from '@/components/chat/MarkdownContent'
import { Spinner } from '@/components/ui/Spinner'
import {
  Bot, User, Send, Plus, Edit2, Trash2, Check, X,
  Clock, AlertCircle, MessageSquare, Menu, RefreshCw, Sparkles,
  Zap, LogIn, FileText, ArrowUpRight
} from 'lucide-react'

interface Conversation {
  id: string
  user_id?: string
  title: string
  report_id?: string | null
  created_at: string
  updated_at: string
}

interface MessageItem {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

const REPORT_SUGGESTIONS = [
  'What does my hypertension risk percentage mean?',
  'Why is my blood pressure a risk factor in this report?',
  'What precautions should I take based on my numbers?',
  'What lifestyle changes might help reduce my risk?',
  'What foods should I consider eating or limiting?',
  'What exercises might be appropriate for me?',
  'What should I discuss with my doctor at my next visit?',
  'Can you explain this entire report in simple language?',
]

const SUGGESTIONS = [
  'What are the early warning signs of Type 2 diabetes?',
  'How can I lower my blood pressure naturally without medication?',
  'What is the DASH diet and which foods are best for heart health?',
  'What does high cholesterol mean and what are healthy target levels?',
  'What is a healthy BMI and how is it calculated?',
  'How much sleep do adults need for metabolic and heart health?',
  'Can chronic psychological stress cause hypertension?',
  'What lifestyle changes protect kidney function over time?',
]

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return 'Recently'
  }
}

function generateCleanTitle(text: string): string {
  const clean = text.replace(/[^\w\s?]/g, '').trim()
  if (clean.length <= 40) return clean || 'New Conversation'
  const truncated = clean.slice(0, 38)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > 15 ? truncated.slice(0, lastSpace) : truncated) + '…'
}

const STORAGE_TITLES_KEY = 'healthsense_chat_custom_titles'
function getStoredTitles(): Record<string, string> {
  try {
    const s = localStorage.getItem(STORAGE_TITLES_KEY)
    return s ? JSON.parse(s) : {}
  } catch {
    return {}
  }
}
function setStoredTitle(convId: string, title: string) {
  try {
    const titles = getStoredTitles()
    titles[convId] = title
    localStorage.setItem(STORAGE_TITLES_KEY, JSON.stringify(titles))
  } catch {}
}

export function ChatPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()

  // Conversations state
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConvId, setActiveConvId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Report-specific context state
  const [reportContext, setReportContext] = useState<any>(null)

  // Messages state
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [loadingConv, setLoadingConv] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Rename & Delete state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 1. Load conversations for the authenticated user and initialize report context if requested
  useEffect(() => {
    async function loadConversations() {
      setLoadingConv(true)
      const paramConvId = searchParams.get('c')
      const paramReportId = searchParams.get('reportId')
      const storedId = localStorage.getItem('healthsense_active_chat_id')

      // Resolve report context if reportId provided
      let currentReportContext: any = null
      if (paramReportId) {
        const stateReport = (location.state as any)?.report
        let foundReport = stateReport
        if (!foundReport) {
          foundReport = await getAssessmentById(paramReportId, user)
        }
        if (foundReport) {
          currentReportContext = {
            reportId: foundReport.id,
            createdAt: foundReport.assessment_date || foundReport.created_at,
            healthScore: foundReport.health_score,
            riskLevel: foundReport.risk_level,
            diabetesRisk: foundReport.diabetes_risk,
            heartRisk: foundReport.heart_risk,
            hypertensionRisk: foundReport.hypertension_risk,
            kidneyRisk: foundReport.kidney_risk,
            input: foundReport.input || foundReport.input_parameters,
            riskFactors: foundReport.risk_factors || [],
            recommendations: foundReport.recommendations || foundReport.suggestions || [],
            categoryDetails: foundReport.complete_report?.result?.category_details || foundReport.category_details,
          }
          setReportContext(currentReportContext)
        }
      }

      if (user) {
        try {
          // Fetch messages directly from chat_messages table (no chat_conversations table exists)
          const { data, error } = await supabase
            .from('chat_messages')
            .select('id, user_id, conversation_id, report_id, role, content, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })

          if (error) {
            console.warn('Could not fetch chat_messages:', error.message)
          }

          const customTitles = getStoredTitles()
          const convMap = new Map<string, Conversation & { firstUserContent?: string }>()

          if (data && data.length > 0) {
            for (const msg of data) {
              const cid = msg.conversation_id
              if (!cid) continue
              if (!convMap.has(cid)) {
                convMap.set(cid, {
                  id: cid,
                  user_id: msg.user_id,
                  title: customTitles[cid] || '',
                  report_id: msg.report_id || null,
                  created_at: msg.created_at,
                  updated_at: msg.created_at,
                  firstUserContent: msg.role === 'user' ? msg.content : undefined,
                })
              } else {
                const c = convMap.get(cid)!
                if (msg.report_id && !c.report_id) {
                  c.report_id = msg.report_id
                }
                if (msg.role === 'user' && !c.firstUserContent) {
                  c.firstUserContent = msg.content
                }
                if (new Date(msg.created_at) > new Date(c.updated_at)) {
                  c.updated_at = msg.created_at
                }
              }
            }
          }

          let convList: Conversation[] = []
          for (const c of convMap.values()) {
            let title = c.title
            if (!title) {
              if (c.report_id) {
                title = 'Report Consultation'
              } else if (c.firstUserContent) {
                title = generateCleanTitle(c.firstUserContent)
              } else {
                title = 'Health Consultation'
              }
            }
            convList.push({
              id: c.id,
              user_id: c.user_id,
              title,
              report_id: c.report_id,
              created_at: c.created_at,
              updated_at: c.updated_at,
            })
          }

          // Sort most recent first
          convList.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

          let targetId: string | null = null

          // If a specific reportId was requested, find or prepare a conversation for it
          if (paramReportId) {
            const matchingConv = convList.find(c => c.report_id === paramReportId)
            if (matchingConv) {
              targetId = matchingConv.id
            } else {
              const newConvId = crypto.randomUUID()
              const now = new Date().toISOString()
              const reportDate = currentReportContext
                ? new Date(currentReportContext.createdAt).toLocaleDateString()
                : new Date().toLocaleDateString()
              const newTitle = `Report Consultation (${reportDate})`
              const newConv: Conversation = {
                id: newConvId,
                user_id: user.id,
                title: newTitle,
                report_id: paramReportId,
                created_at: now,
                updated_at: now,
              }
              convList = [newConv, ...convList]
              targetId = newConvId
            }
          } else {
            targetId = (paramConvId && convList.some(c => c.id === paramConvId))
              ? paramConvId
              : (storedId && convList.some(c => c.id === storedId))
              ? storedId
              : convList[0]?.id || null
          }

          setConversations(convList)
          setActiveConvId(targetId)

          // If the selected conversation is linked to a report, load its context
          const activeConv = convList.find(c => c.id === targetId)
          if (activeConv?.report_id && !currentReportContext) {
            getAssessmentById(activeConv.report_id, user).then(rep => {
              if (rep) {
                setReportContext({
                  reportId: rep.id,
                  createdAt: rep.assessment_date || rep.created_at,
                  healthScore: rep.health_score,
                  riskLevel: rep.risk_level,
                  diabetesRisk: rep.diabetes_risk,
                  heartRisk: rep.heart_risk,
                  hypertensionRisk: rep.hypertension_risk,
                  kidneyRisk: rep.kidney_risk,
                  input: rep.input_parameters || rep.input,
                  riskFactors: rep.risk_factors || [],
                  recommendations: rep.suggestions || rep.recommendations || [],
                  categoryDetails: rep.complete_report?.result?.category_details,
                })
              }
            })
          }
        } catch (err) {
          console.warn('Could not fetch conversations from Supabase:', err)
        }
      } else {
        // Unauthenticated session mode: check local storage
        try {
          const localConvsStr = localStorage.getItem('healthsense_local_conversations')
          if (localConvsStr) {
            const localConvs: Conversation[] = JSON.parse(localConvsStr)
            setConversations(localConvs)
            const targetId = paramConvId || storedId || localConvs[0]?.id || null
            setActiveConvId(targetId)
          }
        } catch {}
      }
      setLoadingConv(false)
    }

    loadConversations()
  }, [user, searchParams.get('reportId')])

  // 2. Load messages whenever active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([])
      return
    }

    // Keep URL and localStorage in sync
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('c', activeConvId)
      return next
    }, { replace: true })
    localStorage.setItem('healthsense_active_chat_id', activeConvId)

    // Load report context if this conversation is linked to a report
    const curConv = conversations.find(c => c.id === activeConvId)
    if (curConv?.report_id) {
      if (reportContext?.reportId !== curConv.report_id) {
        getAssessmentById(curConv.report_id, user).then(rep => {
          if (rep) {
            setReportContext({
              reportId: rep.id,
              createdAt: rep.assessment_date || rep.created_at,
              healthScore: rep.health_score,
              riskLevel: rep.risk_level,
              diabetesRisk: rep.diabetes_risk,
              heartRisk: rep.heart_risk,
              hypertensionRisk: rep.hypertension_risk,
              kidneyRisk: rep.kidney_risk,
              input: rep.input_parameters || rep.input,
              riskFactors: rep.risk_factors || [],
              recommendations: rep.suggestions || rep.recommendations || [],
              categoryDetails: rep.complete_report?.result?.category_details,
            })
          }
        })
      }
    } else if (!searchParams.get('reportId')) {
      setReportContext(null)
    }

    async function loadMessages() {
      setLoadingMsgs(true)
      setErrorMsg('')

      if (user) {
        try {
          const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', activeConvId)
            .order('created_at', { ascending: true })
            .limit(100)

          if (!error && data) {
            setMessages(data as MessageItem[])
          }
        } catch (err) {
          console.warn('Failed to load chat messages:', err)
        }
      } else {
        // Load from local storage for unauthenticated
        try {
          const localMsgsStr = localStorage.getItem(`healthsense_msgs_${activeConvId}`)
          if (localMsgsStr) {
            setMessages(JSON.parse(localMsgsStr))
          } else {
            setMessages([])
          }
        } catch {}
      }
      setLoadingMsgs(false)
    }

    loadMessages()
  }, [activeConvId, user])

  // 3. Scroll to bottom when messages update or when thinking
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeConvId) || null
  }, [conversations, activeConvId])

  // Create a new conversation
  function handleNewChat() {
    setErrorMsg('')
    const newId = crypto.randomUUID()
    const now = new Date().toISOString()
    const newConv: Conversation = {
      id: newId,
      user_id: user?.id,
      title: 'New Conversation',
      created_at: now,
      updated_at: now,
    }

    setConversations(prev => [newConv, ...prev])
    setActiveConvId(newId)
    setMessages([])
    setSidebarOpen(false)
    setReportContext(null)
    inputRef.current?.focus()

    if (!user) {
      try {
        const updated = [newConv, ...conversations]
        localStorage.setItem('healthsense_local_conversations', JSON.stringify(updated))
      } catch {}
    }
  }

  // Rename a conversation
  async function handleRenameSave(id: string) {
    const trimmed = editingTitle.trim()
    if (!trimmed) {
      setEditingId(null)
      return
    }

    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: trimmed } : c))
    setStoredTitle(id, trimmed)
    setEditingId(null)
  }

  // Delete a conversation
  async function handleDeleteConfirm(id: string) {
    const remaining = conversations.filter(c => c.id !== id)
    setConversations(remaining)
    setDeletingId(null)

    if (activeConvId === id) {
      const nextId = remaining[0]?.id || null
      setActiveConvId(nextId)
      if (!nextId) setMessages([])
    }

    if (user) {
      try {
        const { error: delErr } = await supabase
          .from('chat_messages')
          .delete()
          .eq('conversation_id', id)
          .eq('user_id', user.id)
        if (delErr) {
          console.warn('Could not delete conversation messages from Supabase:', delErr.message)
        }
      } catch (err) {
        console.warn('Could not delete conversation from Supabase:', err)
      }
    } else {
      try {
        localStorage.setItem('healthsense_local_conversations', JSON.stringify(remaining))
        localStorage.removeItem(`healthsense_msgs_${id}`)
      } catch {}
    }
  }

  // Send message
  async function handleSendMessage(overrideText?: string) {
    const textToSend = (overrideText ?? input).trim()
    if (!textToSend || thinking) return
    setInput('')
    setErrorMsg('')

    let currentConvId = activeConvId
    const now = new Date().toISOString()
    const currentReportId = reportContext?.reportId || activeConversation?.report_id || null

    // If no active conversation, create one first
    if (!currentConvId) {
      currentConvId = crypto.randomUUID()
      const title = generateCleanTitle(textToSend)
      const newConv: Conversation = {
        id: currentConvId,
        user_id: user?.id,
        title,
        report_id: currentReportId,
        created_at: now,
        updated_at: now,
      }
      setConversations(prev => [newConv, ...prev])
      setActiveConvId(currentConvId)
      setStoredTitle(currentConvId, title)

      if (!user) {
        try {
          const updated = [newConv, ...conversations]
          localStorage.setItem('healthsense_local_conversations', JSON.stringify(updated))
        } catch {}
      }
    } else {
      // If conversation is titled "New Conversation", auto-title it
      const current = conversations.find(c => c.id === currentConvId)
      if (current && (current.title === 'New Conversation' || !current.title)) {
        const title = generateCleanTitle(textToSend)
        setConversations(prev => prev.map(c => c.id === currentConvId ? { ...c, title, updated_at: now } : c))
        setStoredTitle(currentConvId, title)
      }
    }

    const userMessage: MessageItem = {
      id: crypto.randomUUID(),
      conversation_id: currentConvId,
      role: 'user',
      content: textToSend,
      created_at: now,
    }

    setMessages(prev => [...prev, userMessage])
    setThinking(true)
    inputRef.current?.focus()

    // Save user message to Supabase chat_messages table
    if (user) {
      try {
        const { error: insertUserErr } = await supabase.from('chat_messages').insert({
          id: userMessage.id,
          conversation_id: currentConvId,
          report_id: currentReportId,
          user_id: user.id,
          role: 'user',
          content: userMessage.content,
        })
        if (insertUserErr) {
          console.warn('Could not persist user message:', insertUserErr.message)
        }
      } catch (err) {
        console.warn('Could not persist user message:', err)
      }
    } else {
      try {
        const updated = [...messages, userMessage]
        localStorage.setItem(`healthsense_msgs_${currentConvId}`, JSON.stringify(updated))
      } catch {}
    }

    // Call Gemini API with conversation history AND report context
    try {
      const historyContext: ChatMessage[] = [...messages, userMessage].slice(-14).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const reply = await askGemini(historyContext, reportContext)
      const assistantNow = new Date().toISOString()
      const botMessage: MessageItem = {
        id: crypto.randomUUID(),
        conversation_id: currentConvId,
        role: 'assistant',
        content: reply,
        created_at: assistantNow,
      }

      setMessages(prev => [...prev, botMessage])

      // Save assistant message to Supabase chat_messages table
      if (user) {
        try {
          const { error: insertBotErr } = await supabase.from('chat_messages').insert({
            id: botMessage.id,
            conversation_id: currentConvId,
            report_id: currentReportId,
            user_id: user.id,
            role: 'assistant',
            content: reply,
          })
          if (insertBotErr) {
            console.warn('Could not persist assistant message:', insertBotErr.message)
          }
        } catch (err) {
          console.warn('Could not persist assistant message:', err)
        }
      } else {
        try {
          const updated = [...messages, userMessage, botMessage]
          localStorage.setItem(`healthsense_msgs_${currentConvId}`, JSON.stringify(updated))
        } catch {}
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to get a response from the AI assistant. Please try again.')
    } finally {
      setThinking(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden bg-background relative" style={{ height: 'calc(100vh - 56px)' }}>
      {/* ── CONVERSATIONS SIDEBAR ─────────────────────────────────────── */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-[#0c031c] border-r border-white/08 flex flex-col transition-transform duration-300 md:static md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-white/06 flex items-center justify-between gap-2">
          <button
            onClick={handleNewChat}
            className="btn-gradient w-full py-2.5 px-3 text-xs flex items-center justify-center gap-2 shadow-neon font-bold"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/05"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConv ? (
            <div className="flex justify-center py-8">
              <Spinner size={20} className="text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 px-4">
              <MessageSquare className="w-8 h-8 text-white/15 mx-auto mb-2" />
              <p className="text-xs text-white/40">
                No saved conversations yet
              </p>
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = conv.id === activeConvId
              const isEditing = editingId === conv.id
              const isDeleting = deletingId === conv.id

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (!isEditing && !isDeleting) {
                      setActiveConvId(conv.id)
                      setSidebarOpen(false)
                    }
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all border ${
                    isActive
                      ? 'bg-primary/20 border-primary/40 text-white font-semibold'
                      : 'bg-white/02 border-transparent text-white/70 hover:bg-white/05 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-secondary' : 'text-white/35'}`} />
                    {isEditing ? (
                      <div className="flex items-center gap-1 flex-1 mr-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleRenameSave(conv.id)}
                          autoFocus
                          className="bg-black/50 border border-primary/60 rounded px-1.5 py-0.5 text-xs text-white w-full focus:outline-none"
                        />
                        <button
                          onClick={() => handleRenameSave(conv.id)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                          title="Save title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 text-white/40 hover:text-white"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs">{conv.title}</p>
                        <p className="text-[10px] text-white/30 truncate mt-0.5">{formatRelativeTime(conv.updated_at || conv.created_at)}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions when not editing */}
                  {!isEditing && (
                    <div
                      className={`flex items-center gap-0.5 flex-shrink-0 ${
                        isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      } transition-opacity`}
                      onClick={e => e.stopPropagation()}
                    >
                      {isDeleting ? (
                        <div className="flex items-center gap-1 bg-red-950/80 p-1 rounded border border-red-500/30">
                          <span className="text-[10px] text-red-300 font-bold px-1">Delete?</span>
                          <button
                            onClick={() => handleDeleteConfirm(conv.id)}
                            className="p-0.5 text-red-400 hover:text-red-200"
                            title="Confirm delete"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="p-0.5 text-white/50 hover:text-white"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingId(conv.id)
                              setEditingTitle(conv.title)
                            }}
                            className="p-1 text-white/40 hover:text-primary transition-colors rounded"
                            title="Rename"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setDeletingId(conv.id)}
                            className="p-1 text-white/40 hover:text-red-400 transition-colors rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Sidebar Footer — Auth status */}
        <div className="p-3 border-t border-white/06 bg-white/01">
          {user ? (
            <div className="flex items-center gap-2 text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Chats automatically synced to Supabase</span>
            </div>
          ) : (
            <div className="text-[10px] text-amber-300/80 leading-tight">
              <span className="font-semibold block text-amber-300 mb-0.5">Guest Mode:</span>
              Chats saved locally in browser. Sign in to sync across devices.
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
        />
      )}

      {/* ── CHAT COLUMN ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/06 bg-white/02 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl bg-white/05 text-white/70 hover:text-white"
              title="Open conversations"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-white font-bold text-sm truncate">
                  {activeConversation?.title || 'HealthSense AI Assistant'}
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/20 text-primary border border-primary/30">
                  <Sparkles className="w-2.5 h-2.5" /> Gemini AI
                </span>
              </div>
              <p className="text-white/40 text-[10px] flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                <span>Evidence-based preventive health intelligence</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleNewChat}
              className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1.5"
              title="Start a new chat"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        </div>

        {/* Unauthenticated notice */}
        {!user && (
          <div className="px-4 py-2 bg-purple-950/40 border-b border-purple-500/20 flex items-center justify-between gap-2 text-xs text-white/80">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-secondary flex-shrink-0" />
              <span>Persistent cloud chat history requires signing in to HealthSense AI.</span>
            </div>
            <a href="/login" className="text-secondary hover:text-pink-300 font-bold underline flex items-center gap-1">
              <LogIn className="w-3 h-3" /> Sign in
            </a>
          </div>
        )}

        {/* Report Context Banner */}
        {reportContext && (
          <div className="bg-gradient-to-r from-primary/15 via-secondary/10 to-transparent border-b border-primary/25 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-primary/25 border border-primary/40 flex items-center justify-center flex-shrink-0 shadow-neon">
                <FileText className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs font-bold truncate">Report Consultation</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    reportContext.riskLevel === 'high' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                    reportContext.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {reportContext.riskLevel} Risk
                  </span>
                  <span className="text-white/60 text-[11px] font-semibold">Health Score: {reportContext.healthScore}/100</span>
                </div>
                <p className="text-white/40 text-[10px] truncate mt-0.5">
                  AI has loaded your clinical vitals, glucose, BP & calculated disease risks for tailored guidance.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={`/results/${reportContext.reportId}`}
                className="text-[11px] font-bold text-secondary hover:text-pink-300 flex items-center gap-1 bg-white/05 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 transition-colors"
              >
                <span>View Full Report</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4">
          {loadingMsgs ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Spinner size={28} className="text-primary" />
              <p className="text-white/40 text-xs">Loading conversation…</p>
            </div>
          ) : messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-10 sm:py-16 gap-4 text-center max-w-xl mx-auto"
            >
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon animate-float">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white mb-2">
                  {reportContext ? 'Consultation on Your Health Report' : 'HealthSense AI Assistant'}
                </h1>
                <p className="text-white/50 text-xs sm:text-sm leading-relaxed max-w-md">
                  {reportContext
                    ? `I have reviewed your assessment report (Health Score: ${reportContext.healthScore}/100, ${reportContext.riskLevel} overall risk). Ask me any questions about your metrics, risks, or lifestyle recommendations.`
                    : 'I can answer your questions on diabetes, hypertension, cardiovascular health, nutrition, and exercise. All answers are structured with clear headings, bullet points, and clinical reference ranges.'}
                </p>
              </div>

              {/* Suggestions */}
              <div className="w-full pt-3">
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
                  {reportContext ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-secondary" /> Questions About Your Assessment Report
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-secondary" /> Common Health Questions
                    </>
                  )}
                </p>
                <div className="grid sm:grid-cols-2 gap-2 text-left">
                  {(reportContext ? REPORT_SUGGESTIONS : SUGGESTIONS).slice(0, 6).map(q => (
                    <button
                      key={q}
                      onClick={() => handleSendMessage(q)}
                      className="text-xs bg-white/03 border border-white/07 rounded-xl p-3 text-white/70 hover:text-white hover:border-primary/40 hover:bg-primary/08 transition-all leading-relaxed"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            messages.map((m, idx) => (
              <motion.div
                key={m.id || idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                style={{
                  maxWidth: m.role === 'user' ? '82%' : '90%',
                  [m.role === 'user' ? 'marginLeft' : 'marginRight']: 'auto',
                }}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1 shadow-sm ${
                    m.role === 'assistant'
                      ? 'bg-gradient-to-br from-primary to-secondary shadow-neon'
                      : 'bg-white/10'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <Bot className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-white/80" />
                  )}
                </div>

                {/* Content Bubble */}
                <div className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
                  <div
                    className={`px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-primary to-secondary/90 text-white rounded-tr-sm shadow-md font-medium whitespace-pre-wrap'
                        : 'bg-white/05 border border-white/08 text-white/95 rounded-tl-sm shadow-lg w-full overflow-hidden'
                    }`}
                  >
                    {m.role === 'assistant' ? (
                      <MarkdownContent content={m.content} />
                    ) : (
                      m.content
                    )}
                  </div>
                  <div className="flex items-center gap-1 px-1">
                    <Clock className="w-2.5 h-2.5 text-white/20" />
                    <span className="text-[10px] text-white/30">
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}

          {/* Typing Indicator */}
          <AnimatePresence>
            {thinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
                style={{ maxWidth: '85%' }}
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-neon flex-shrink-0 mt-1">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white/05 border border-white/08 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <span className="text-xs text-white/50 mr-1">Generating response</span>
                  {[0, 0.18, 0.36].map((d, i) => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -5, 0], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 0.75, delay: d, repeat: Infinity }}
                      className="w-1.5 h-1.5 bg-secondary rounded-full block"
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message with Retry */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 flex items-start justify-between gap-3 text-xs text-red-300"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block text-red-200 font-semibold">Assistant Error</strong>
                  {errorMsg}
                </div>
              </div>
              <button
                onClick={() => handleSendMessage()}
                className="btn-secondary px-2.5 py-1 text-[11px] flex-shrink-0 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Retry
              </button>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-white/06 p-3 sm:p-4 bg-white/01 flex-shrink-0">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2.5 items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Ask about diabetes, BP, heart health, nutrition, or symptoms… (Press Enter)"
                className="input-dark flex-1 text-xs sm:text-sm py-2.5"
                disabled={thinking}
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || thinking}
                className="btn-gradient p-2.5 sm:px-4 sm:py-2.5 text-xs sm:text-sm disabled:opacity-40 flex-shrink-0 flex items-center gap-1.5 shadow-neon"
                title="Send message"
              >
                {thinking ? (
                  <Spinner size={16} className="text-white" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-white/30 text-[10px] mt-2 text-center">
              HealthSense AI provides educational health insights only — not a definitive medical diagnosis. Consult a physician for clinical decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
