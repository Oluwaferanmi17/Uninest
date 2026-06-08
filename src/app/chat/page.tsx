"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils";

interface Conversation {
  id: string;
  listing: { id: string; title: string; images: { url: string }[] };
  student: { id: string; name: string; avatar: string | null };
  host: { id: string; name: string; avatar: string | null };
  messages: { body: string; createdAt: string; senderId: string }[];
  updatedAt: string;
}

interface Message {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  sender: { name: string; avatar: string | null };
}

function ChatContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    searchParams.get("conversation")
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUserId = (session?.user as any)?.id;

  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await fetch("/api/conversations");
        const data = await response.json();
        setConversations(data.conversations || []);
      } catch {
        console.error("Failed to fetch conversations");
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, []);

  useEffect(() => {
    if (!activeConversation) return;

    async function fetchMessages() {
      try {
        const response = await fetch(
          `/api/conversations/${activeConversation}/messages`
        );
        const data = await response.json();
        setMessages(data.messages || []);
      } catch {
        console.error("Failed to fetch messages");
      }
    }
    fetchMessages();

    // Real-time updates with Pusher
    let pusherClient: any;
    let channel: any;

    if (process.env.NEXT_PUBLIC_PUSHER_KEY && process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
      import("pusher-js").then((Pusher) => {
        pusherClient = new Pusher.default(process.env.NEXT_PUBLIC_PUSHER_KEY as string, {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
        });

        channel = pusherClient.subscribe(`conversation-${activeConversation}`);
        channel.bind("new-message", (data: Message) => {
          if (data.senderId !== currentUserId) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === data.id)) return prev;
              return [...prev, data];
            });
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversation
                  ? {
                      ...c,
                      messages: [{ body: data.body, createdAt: data.createdAt, senderId: data.senderId }],
                      updatedAt: new Date().toISOString(),
                    }
                  : c
              )
            );
          }
        });
      });
    }

    // Poll for new messages every 10 seconds (fallback if Pusher fails)
    const interval = setInterval(fetchMessages, 10000);
    return () => {
      clearInterval(interval);
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
      if (pusherClient) pusherClient.disconnect();
    };
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation) return;

    setSending(true);
    try {
      const response = await fetch(
        `/api/conversations/${activeConversation}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: newMessage }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
        // Update conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeConversation
              ? {
                  ...c,
                  messages: [
                    { body: newMessage, createdAt: new Date().toISOString(), senderId: currentUserId },
                  ],
                  updatedAt: new Date().toISOString(),
                }
              : c
          )
        );
      }
    } catch {
      console.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const getOtherUser = (conv: Conversation) => {
    return conv.student.id === currentUserId ? conv.host : conv.student;
  };

  if (loading) return <PageLoader />;

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-white">
      {/* Conversations List */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col ${
          activeConversation ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-400 text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const otherUser = getOtherUser(conv);
              const lastMessage = conv.messages[0];
              const isActive = activeConversation === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    isActive ? "bg-primary/5 border-l-2 border-l-primary" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      src={otherUser.avatar}
                      name={otherUser.name}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {otherUser.name}
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatRelativeTime(conv.updatedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-primary/70 truncate mt-0.5">
                        {conv.listing.title}
                      </p>
                      {lastMessage && (
                        <p className="text-sm text-gray-500 truncate mt-0.5">
                          {lastMessage.senderId === currentUserId ? "You: " : ""}
                          {lastMessage.body}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={`flex-1 flex flex-col ${
          !activeConversation ? "hidden md:flex" : "flex"
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            {(() => {
              const conv = conversations.find((c) => c.id === activeConversation);
              if (!conv) return null;
              const otherUser = getOtherUser(conv);

              return (
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-1 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <Avatar src={otherUser.avatar} name={otherUser.name} size="md" />
                  <div>
                    <p className="font-semibold text-gray-900">{otherUser.name}</p>
                    <p className="text-xs text-primary/70">{conv.listing.title}</p>
                  </div>
                </div>
              );
            })()}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.map((msg) => {
                const isOwn = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[70%] ${isOwn ? "flex-row-reverse" : ""}`}>
                      {!isOwn && (
                        <Avatar
                          src={msg.sender.avatar}
                          name={msg.sender.name}
                          size="sm"
                        />
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          isOwn
                            ? "bg-primary text-white rounded-br-md"
                            : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.body}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            isOwn ? "text-white/60" : "text-gray-400"
                          }`}
                        >
                          {formatRelativeTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form
              onSubmit={handleSend}
              className="p-4 border-t border-gray-100 bg-white"
            >
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState
              title="Select a conversation"
              description="Choose a conversation from the sidebar to start chatting."
              icon={
                <svg className="w-16 h-16 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ChatContent />
    </Suspense>
  );
}
