import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { Conversation, DirectMessage } from '../types';
import { getUserConversations, getConversationMessages, sendMessage } from '../services/messagesService';
import { EmptyState } from '../components/EmptyState';
import {
  MessageSquare,
  Send,
  ShieldAlert,
  ArrowLeft,
  User,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface MessagesViewProps {
  initialConversationId?: string;
  onSelectReport: (reportId: string) => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  initialConversationId,
  onSelectReport,
}) => {
  const { t, formatRelativeTime } = useTranslation();
  const { user, openAuthModal } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!user) return;
    const loadConversations = async () => {
      try {
        setLoading(true);
        const convs = await getUserConversations(user.uid);
        setConversations(convs);

        if (initialConversationId) {
          const target = convs.find((c) => c.id === initialConversationId);
          if (target) {
            setActiveConversation(target);
          }
        } else if (convs.length > 0 && window.innerWidth >= 768) {
          setActiveConversation(convs[0]);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user, initialConversationId]);

  useEffect(() => {
    if (!activeConversation || !user) return;
    const loadMessages = async () => {
      try {
        const msgs = await getConversationMessages(activeConversation.id, user.uid);
        setMessages(msgs);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };

    loadMessages();
  }, [activeConversation, user]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeConversation || !user || sending) return;

    try {
      setSending(true);
      const newMsg = await sendMessage(
        activeConversation.id,
        user.uid,
        user.fullName || user.displayName || 'Member',
        newMessageText
      );
      setMessages((prev) => [...prev, newMsg]);
      setNewMessageText('');

      // Update last message preview in list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, lastMessage: newMsg.text, lastMessageTimestamp: newMsg.createdAt }
            : c
        )
      );

      setTimeout(scrollToBottom, 100);
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t('comments.mustLogin')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Sign in to access secure direct messages for coordinating item recovery.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl font-bold text-sm bg-blue-600 text-white"
        >
          {t('nav.signIn')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
      <div className="mb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t('messages.title')}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('messages.subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-sm text-slate-400">{t('common.loading')}</div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={t('messages.noConversations')}
          description={t('messages.noConversationsDesc')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm min-h-[580px]">
          {/* Conversation List (Hidden on mobile if a conversation is open) */}
          <div
            className={`border-b md:border-b-0 md:border-e border-slate-200 dark:border-slate-800 flex flex-col ${
              activeConversation ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-xs font-bold uppercase text-slate-400">
                Active Conversations ({conversations.length})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {conversations.map((conv) => {
                const otherUid = conv.participants.find((p) => p !== user.uid) || '';
                const otherName = conv.participantNames?.[otherUid] || 'Member';
                const isSelected = activeConversation?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full p-4 text-start transition-colors flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/80 dark:bg-blue-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 text-sm">
                      {otherName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {otherName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {formatRelativeTime(conv.lastMessageTimestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold truncate mb-0.5">
                        {conv.reportTitle}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {conv.lastMessage || 'Conversation started'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chat Window */}
          <div
            className={`col-span-2 flex flex-col ${
              !activeConversation ? 'hidden md:flex items-center justify-center' : 'flex'
            }`}
          >
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveConversation(null)}
                      className="md:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {activeConversation.participantNames?.[
                          activeConversation.participants.find((p) => p !== user.uid) || ''
                        ] || 'Member'}
                      </h4>
                      <button
                        onClick={() => onSelectReport(activeConversation.reportId)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <span>Regarding: {activeConversation.reportTitle}</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Safety advice banner in chat */}
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border-b border-amber-100 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <span>{t('messages.safetyNotice')}</span>
                </div>

                {/* Message Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40 dark:bg-slate-950/20">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-xs text-slate-400 italic">
                      Send a message to introduce yourself and coordinate handover in a public place.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMe = msg.senderUid === user.uid;
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                              isMe
                                ? 'bg-blue-600 text-white rounded-br-xs shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-xs'
                            }`}
                          >
                            <p className="whitespace-pre-line">{msg.text}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 mt-1 px-1">
                            {formatRelativeTime(msg.createdAt)}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 bg-white dark:bg-slate-900"
                >
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder={t('messages.typeMessage')}
                    maxLength={1500}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessageText.trim()}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-all cursor-pointer"
                    title={t('messages.send')}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center p-8 text-slate-400">
                <MessageSquare className="w-12 h-12 stroke-[1.4] mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="text-sm font-semibold">{t('messages.selectConversation')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
