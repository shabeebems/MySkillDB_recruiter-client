import React, { useState, useRef, useEffect } from 'react';
import { postRequest, getRequest, putRequest } from '../../../../api/apiRequests';
import { toast } from 'react-hot-toast';

// Parse [QUICK_CHOICE:question|opt1|opt2|...] from content for storage (question/options in separate fields).
function parseQuickChoice(content) {
  if (!content || typeof content !== 'string') return null;
  const match = content.match(/\[QUICK_CHOICE:([^\]]*)\]/);
  if (!match || !match[1]) return null;
  const parts = match[1].split('|').map((p) => p.trim());
  const question = parts[0] || '';
  const options = parts.slice(1).filter(Boolean);
  const contentWithoutChoice = content.replace(/\[QUICK_CHOICE:[^\]]*\]/g, '').trim();
  return { question, options, contentWithoutChoice };
}

// Build one message for API: content only, or content + question + options when applicable.
function toMessagePayload(m, timestamp) {
  const base = { role: m.role, content: m.content ?? '', timestamp: timestamp || m.timestamp || new Date().toISOString() };
  if (m.question != null && m.options != null && m.options.length > 0) {
    return { ...base, content: m.content ?? '', question: m.question, options: m.options };
  }
  const parsed = parseQuickChoice(m.content);
  if (parsed) {
    return { ...base, content: parsed.contentWithoutChoice || parsed.question, question: parsed.question, options: parsed.options };
  }
  return base;
}

const InterviewBuddyChatbot = ({ job, skills, initialSkill = null, isOpen, onClose, allowSave = false }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  
  const messagesEndRef = useRef(null);
  const lastMessageRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const typewriterBufferRef = useRef({});
  const typewriterIntervalRef = useRef({});
  const displayedLengthRef = useRef({});
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const SCROLL_TOP_THRESHOLD = 120;
  const hasLoadedChatRef = useRef(false);

  // Save/load only when allowSave is true (opened from "Interview Buddy" button). Skill-level: no save, always fresh.
  const isInterviewBuddyOnly = allowSave && initialSkill == null;

  // Load saved chat only when allowSave (Interview Buddy entry). Otherwise: always show fresh greeting.
  useEffect(() => {
    if (!isOpen || !job) {
      hasLoadedChatRef.current = false;
      return;
    }
    if (!allowSave || initialSkill != null) {
      // Skill-level: no load, show fresh greeting
      const skillName = initialSkill?.name || initialSkill?.title || (skills[0]?.name || skills[0]?.title || 'this skill');
      let content;
      if (initialSkill) {
        content = `Hey! You're focusing on **${skillName}** for the ${job.title} role at ${job.company}.\n\n[QUICK_CHOICE:What's your experience level with ${skillName}?|Beginner|Know the basics|Intermediate|Expert]`;
      } else {
        content = `Hey! I'm your Interview Buddy for the **${job.title}** role at ${job.company}.\n\nWe'll do a short **interview prep** pass: for each skill I'll explain it, why it matters for the role, and share learning materials—then a quick MCQ. One round through all skills and we're done.\n\nReady? We'll start with the first skill.`;
      }
      setMessages([{ id: Date.now(), role: 'assistant', content, timestamp: new Date().toISOString() }]);
      setConversationHistory([]);
      hasLoadedChatRef.current = true;
      return;
    }

    const params = new URLSearchParams({ jobId: job._id });
    getRequest(`/interview-buddy-chats?${params.toString()}`)
      .then((res) => {
        const saved = res?.data?.data;
        const savedMessages = saved?.messages;
        if (savedMessages && savedMessages.length > 0) {
          const withIds = savedMessages.map((m, i) => ({
            id: (m.timestamp ? new Date(m.timestamp).getTime() : 0) + i,
            role: m.role,
            content: m.content ?? '',
            ...(m.question != null && { question: m.question }),
            ...(m.options != null && m.options.length > 0 && { options: m.options }),
            timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : new Date().toISOString()
          }));
          setMessages(withIds);
          setConversationHistory(savedMessages.map((m) => ({ role: m.role, content: m.content ?? '', ...(m.question != null && { question: m.question }), ...(m.options != null && { options: m.options }) })));
        } else {
          const content = `Hey! I'm your Interview Buddy for the **${job.title}** role at ${job.company}.\n\nWe'll do a short **interview prep** pass: for each skill I'll explain it, why it matters for the role, and share learning materials—then a quick MCQ. One round through all skills and we're done.\n\nReady? We'll start with the first skill.`;
          setMessages([{ id: Date.now(), role: 'assistant', content, timestamp: new Date().toISOString() }]);
          setConversationHistory([]);
        }
        hasLoadedChatRef.current = true;
      })
      .catch(() => {
        const content = `Hey! I'm your Interview Buddy for the **${job.title}** role at ${job.company}.\n\nWe'll do a short **interview prep** pass: for each skill I'll explain it, why it matters for the role, and share learning materials—then a quick MCQ. One round through all skills and we're done.\n\nReady? We'll start with the first skill.`;
        setMessages([{ id: Date.now(), role: 'assistant', content, timestamp: new Date().toISOString() }]);
        setConversationHistory([]);
        hasLoadedChatRef.current = true;
      });
  }, [isOpen, job?._id, allowSave, initialSkill?._id ?? initialSkill?.id, initialSkill?.name, skills]);

  // Reset loaded flag when modal closes so next open fetches again
  useEffect(() => {
    if (!isOpen) hasLoadedChatRef.current = false;
  }, [isOpen]);

  // Keep view at start of chat when opening or when new content is done; only auto-scroll if user was already near bottom
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScrollRef.current) {
      setTimeout(() => {
        scrollToBottom();
      }, 50);
    }
  }, [messages]);

  // When chat opens, scroll to top so user sees the start of the conversation
  useEffect(() => {
    if (isOpen && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const t = setTimeout(() => {
        container.scrollTop = 0;
        setIsScrolledDown(false);
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const checkIfNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    
    const threshold = 100;
    const isNearBottom = 
      container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    
    shouldAutoScrollRef.current = isNearBottom;
    return isNearBottom;
  };

  const handleScroll = () => {
    checkIfNearBottom();
    const container = messagesContainerRef.current;
    if (container) {
      setIsScrolledDown(container.scrollTop > SCROLL_TOP_THRESHOLD);
    }
  };

  const scrollToBottom = () => {
    if (shouldAutoScrollRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll to bottom of chat (latest message)
  const goToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
    shouldAutoScrollRef.current = true;
  };

  // Scroll so the top of the latest chat reply is at the top of the view
  const goToTopOfLatest = () => {
    lastMessageRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  // When user clicks an option button, send that choice as their message
  const handleQuickChoiceClick = (choice) => {
    setInputMessage(choice);
    setTimeout(() => handleSendMessageWithText(choice), 100);
  };

  const handleSendMessageWithText = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    const userMessageContent = text.trim();
    setInputMessage('');
    setIsTyping(true);
    // Keep view at start; user can use "Go to bottom" to jump to latest
    shouldAutoScrollRef.current = false;

    const aiMessageId = Date.now() + 1;
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      const context = {
        jobTitle: job.title,
        company: job.company,
        skills: skills.map(s => ({
          name: s.name || s.title,
          description: s.description || '',
          status: s.status || 'not-started'
        })),
        conversationHistory: conversationHistory,
        userMessage: userMessageContent,
        selectedSkill: initialSkill ? { name: initialSkill.name || initialSkill.title } : null,
        chatMode: initialSkill ? 'skill_deep_dive' : 'interview_prep'
      };

      const response = await postRequest('/ai/job-interview-buddy-chat', context);

      if (response.data?.success && response.data?.data?.response) {
        const fullResponse = response.data.data.response;
        
        typewriterBufferRef.current[aiMessageId] = fullResponse;
        displayedLengthRef.current[aiMessageId] = 0;

        const startTypewriter = () => {
          if (typewriterIntervalRef.current[aiMessageId]) {
            clearInterval(typewriterIntervalRef.current[aiMessageId]);
          }

          const typewriter = () => {
            const currentBuffer = typewriterBufferRef.current[aiMessageId] || '';
            const displayedLength = displayedLengthRef.current[aiMessageId] || 0;
            
            if (displayedLength < currentBuffer.length) {
              const charsToAdd = Math.min(5, currentBuffer.length - displayedLength);
              const newDisplayedLength = displayedLength + charsToAdd;
              displayedLengthRef.current[aiMessageId] = newDisplayedLength;
              
              const displayedText = currentBuffer.substring(0, newDisplayedLength);
              
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: displayedText }
                  : msg
              ));
            } else {
              clearInterval(typewriterIntervalRef.current[aiMessageId]);
              delete typewriterIntervalRef.current[aiMessageId];
              
              setConversationHistory(prev => [
                ...prev,
                { role: 'user', content: userMessageContent },
                { role: 'assistant', content: fullResponse }
              ]);
              
              // Save after every message exchange when Interview Buddy is opened (allowSave)
              if (allowSave && job?._id) {
                const ts = new Date().toISOString();
                const payload = {
                  jobId: job._id,
                  messages: [
                    ...conversationHistory.map(m => toMessagePayload(m, m.timestamp)),
                    toMessagePayload({ role: 'user', content: userMessageContent }, ts),
                    toMessagePayload({ role: 'assistant', content: fullResponse }, ts)
                  ]
                };
                putRequest('/interview-buddy-chats', payload).catch(() => {});
              }
              
              delete typewriterBufferRef.current[aiMessageId];
              delete displayedLengthRef.current[aiMessageId];
            }
          };

          typewriterIntervalRef.current[aiMessageId] = setInterval(typewriter, 12);
        };

        startTypewriter();
      } else {
        throw new Error('Invalid response from AI');
      }
    } catch (error) {
      console.error('Error sending message:', error);
     
      if (typewriterIntervalRef.current[aiMessageId]) {
        clearInterval(typewriterIntervalRef.current[aiMessageId]);
        delete typewriterIntervalRef.current[aiMessageId];
      }
      delete typewriterBufferRef.current[aiMessageId];
      delete displayedLengthRef.current[aiMessageId];
     
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.id !== aiMessageId);
        const fallbackMessage = {
          id: Date.now() + 2,
          role: 'assistant',
          content: `Oops! I ran into a small issue. Could you try sending that again?\n\n*Our AI service is temporarily unavailable.*`,
          timestamp: new Date().toISOString()
        };
        return [...filtered, fallbackMessage];
      });
      toast.error('Connection issue - please try again');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    handleSendMessageWithText(inputMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Chat is saved on every message send when allowSave; on close just dismiss.
  const handleClose = () => {
    onClose();
    return Promise.resolve();
  };

  // Copy to clipboard helper
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('copied!');
    }).catch(() => {
      toast.error('copy failed');
    });
  };

  // Code block component with copy button
  const CodeBlock = ({ code, language }) => {
    const isInfographic = code.includes('→') || code.includes('├') || code.includes('↓') || code.includes('│') || code.includes('───');
    return (
      <div className="my-3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        <div className="flex items-center justify-between px-3 py-2 bg-white/80 border-b border-slate-200">
          <span className="text-xs font-mono text-slate-500">
            {isInfographic ? 'Visual' : language || 'code'}
          </span>
          <button
            onClick={() => copyToClipboard(code)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
          >
            <i className="fas fa-copy text-[10px]" />
            <span>Copy</span>
          </button>
        </div>
        <pre className={`p-3 overflow-x-auto text-sm ${isInfographic ? 'text-slate-700' : 'text-slate-600'}`}>
          <code className="font-mono whitespace-pre">{code}</code>
        </pre>
      </div>
    );
  };

  // Parse content and extract code blocks
  const parseContentWithCodeBlocks = (content) => {
    const parts = [];
    const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.slice(lastIndex, match.index) });
      }
      parts.push({ type: 'code', language: match[1] || '', content: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }
    
    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.slice(lastIndex) });
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content }];
  };

  const formatTextContent = (text) => {
    return text.split('\n').map((line, index) => {
      if (line.includes('`') && !line.includes('```')) {
        const parts = line.split(/`([^`]+)`/);
        return (
          <p key={index} className="mb-2 text-base sm:text-lg">
            {parts.map((part, i) =>
              i % 2 === 1 ? (
                <code key={i} className="px-2 py-0.5 bg-sky-100 text-slate-700 rounded-lg font-mono text-sm">
                  {part}
                </code>
              ) : part
            )}
          </p>
        );
      }
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-2 text-base sm:text-lg">
            {parts.map((part, i) =>
              i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part
            )}
          </p>
        );
      }
      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <p key={index} className="mb-2 ml-4 text-base sm:text-lg">
            {line}
          </p>
        );
      }
      if (/^\d+\./.test(line.trim())) {
        return (
          <p key={index} className="mb-2 ml-4 text-base sm:text-lg">
            {line}
          </p>
        );
      }
      if (line.trim()) {
        return <p key={index} className="mb-2 text-base sm:text-lg">{line}</p>;
      }
      return <br key={index} />;
    });
  };

  const formatMessage = (content, messageId, explicitChoice = null) => {
    if (content == null || typeof content !== 'string') {
      return <span className="text-slate-500 text-sm">...</span>;
    }
    const hasExplicitChoice = explicitChoice && explicitChoice.question != null && explicitChoice.options?.length > 0;
    const hasQuickChoice = !hasExplicitChoice && content.includes('[QUICK_CHOICE:');

    let cleanContent = content
      .replace(/\[QUICK_CHOICE:[^\]]*\]/g, '')
      .trim();

    const parsedParts = parseContentWithCodeBlocks(cleanContent);
    const renderParsedContent = () => (
      <>
        {parsedParts.map((part, idx) => (
          part.type === 'code' ? (
            <CodeBlock key={idx} code={part.content} language={part.language} />
          ) : (
            <div key={idx}>{formatTextContent(part.content)}</div>
          )
        ))}
      </>
    );

    const renderChoiceButtons = (question, options) => (
      <div className="mt-4 space-y-3">
        {question && (
          <p className="text-sm font-semibold text-slate-700">{question}</p>
        )}
        <div className="flex flex-wrap gap-2 justify-end items-center">
          {(options || []).map((option, idx) => (
            <button
              key={`opt-${idx}`}
              type="button"
              onClick={() => handleQuickChoiceClick(option.trim())}
              className="px-4 py-2.5 bg-white border border-sky-200 text-slate-700 hover:bg-sky-50 rounded-full text-sm font-medium transition-colors"
            >
              {option.trim()}
            </button>
          ))}
          <button
            key="no-idea"
            type="button"
            onClick={() => handleQuickChoiceClick('No idea')}
            className="px-4 py-2.5 bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 rounded-full text-sm font-medium transition-colors"
          >
            No idea
          </button>
        </div>
      </div>
    );

    if (hasExplicitChoice) {
      return (
        <>
          {renderParsedContent()}
          {renderChoiceButtons(explicitChoice.question, explicitChoice.options)}
        </>
      );
    }
    if (hasQuickChoice) {
      const quickChoiceMatch = content.match(/\[QUICK_CHOICE:([^\]]*)\]/);
      const choiceData = quickChoiceMatch && quickChoiceMatch[1] ? quickChoiceMatch[1] : '';
      const parts = choiceData.split('|').map((p) => p.trim());
      const question = parts[0] || '';
      const options = parts.slice(1).filter(Boolean);
      return (
        <>
          {renderParsedContent()}
          {renderChoiceButtons(question, options)}
        </>
      );
    }

    return renderParsedContent();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gradient-to-b from-sky-50/95 to-white">
      <div className="w-full h-full flex flex-col max-w-2xl mx-auto">
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white/80 border-b border-sky-100/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-md border border-sky-100 flex items-center justify-center">
                <span className="text-slate-700 text-lg sm:text-xl font-medium">C</span>
              </div>
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 opacity-40 -z-10 blur-sm" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800 truncate">Interview Buddy</h2>
              <p className="text-xs sm:text-sm text-slate-500 truncate">{job.title} · {job.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
              title="Close"
            >
              <i className="fas fa-times text-sm" />
            </button>
          </div>
        </div>

        {isTyping && (
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-sky-50 border-b border-sky-100/80">
            <i className="fas fa-spinner fa-spin text-sky-500 text-sm" />
            <span className="text-sm text-slate-600">Generating reply...</span>
          </div>
        )}

        <div className="flex-1 min-h-0 flex flex-col relative">
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 space-y-4 bg-gradient-to-b from-sky-50/50 to-white"
          >
          {messages.map((message, idx) => (
            <div
              key={message.id}
              ref={idx === messages.length - 1 ? lastMessageRef : undefined}
              data-message-id={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 ${
                  message.role === 'user'
                    ? 'bg-white border border-sky-200/80 text-slate-800 shadow-sm'
                    : 'bg-slate-100/90 text-slate-700 border border-slate-200/60 shadow-sm'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-white border border-sky-200 flex items-center justify-center">
                      <span className="text-sky-600 text-xs font-medium">C</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500">Interview Buddy</span>
                  </div>
                )}
                <div className={`leading-relaxed text-left text-sm sm:text-base ${message.role === 'user' ? 'text-slate-800' : 'text-slate-700'}`}>
                  {formatMessage(message.content, message.id, message.question != null ? { question: message.question, options: message.options } : null)}
                </div>
                {message.role === 'assistant' && message.content && !String(message.content).includes('[QUICK_CHOICE:') && !(message.question != null && message.options?.length) && (
                  <div className="flex flex-wrap gap-2 justify-end items-center mt-3">
                    <button
                      type="button"
                      onClick={() => handleQuickChoiceClick('Ok')}
                      className="px-4 py-2 bg-white border border-sky-200 text-slate-700 hover:bg-sky-50 rounded-full text-sm font-medium transition-colors"
                    >
                      Ok
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickChoiceClick('Not clear')}
                      className="px-4 py-2 bg-slate-100 border border-slate-300 text-slate-600 hover:bg-slate-200 rounded-full text-sm font-medium transition-colors"
                    >
                      Not clear
                    </button>
                  </div>
                )}
                <p className={`text-[11px] mt-2 ${message.role === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                  {new Date(message.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-3 bg-slate-100/90 border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white border border-sky-200 flex items-center justify-center">
                    <span className="text-sky-600 text-xs font-medium">C</span>
                  </div>
                  <span className="text-sm text-slate-500">typing</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={isScrolledDown ? goToTopOfLatest : goToBottom}
              className="absolute bottom-3 right-4 sm:right-6 flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-sky-200 text-slate-600 hover:bg-sky-50 hover:text-slate-800 shadow-sm text-xs font-medium transition-colors"
              title={isScrolledDown ? 'Go to top of latest reply' : 'Go to latest message'}
            >
              {isScrolledDown ? (
                <>
                  <i className="fas fa-chevron-up text-xs" />
                  <span>Go top</span>
                </>
              ) : (
                <>
                  <i className="fas fa-chevron-down text-xs" />
                  <span>Latest</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex-shrink-0 p-4 sm:p-5 bg-white/90 border-t border-sky-100/80">
          <div className="flex items-center gap-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              rows={1}
              className="flex-1 min-h-[44px] max-h-28 px-4 py-2.5 rounded-full border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 resize-none text-sm sm:text-base"
              style={{ minHeight: '44px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="w-11 h-11 shrink-0 rounded-full bg-slate-700 hover:bg-slate-800 disabled:bg-slate-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
            >
              <i className="fas fa-arrow-up text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewBuddyChatbot;
