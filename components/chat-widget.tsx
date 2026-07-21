"use client";

import { useEffect, useState, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { MessageCircle, X, Send } from "lucide-react";

type Message = {
  id: string;
  sender_type: "applicant" | "employer" | "staff";
  content: string;
  created_at: string;
};

export function ChatWidget({
  tableName,
  identifierColumn,
  identifierValue,
  senderType,
  title = "Office Chat"
}: {
  tableName: "applicant_messages" | "employer_messages";
  identifierColumn: "applicant_id" | "partner_id";
  identifierValue: string;
  senderType: "applicant" | "employer";
  title?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const supabase = createSupabaseBrowserClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from(tableName)
        .select("*")
        .eq(identifierColumn, identifierValue)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`${tableName}_${identifierValue}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: tableName,
          filter: `${identifierColumn}=eq.${identifierValue}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, identifierValue, supabase, tableName, identifierColumn]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const content = newMessage.trim();
    setNewMessage(""); // Optimistic clear
    setSendError(""); // Clear previous errors

    const endpoint = senderType === "applicant" ? "/api/applicant/messages" : "/api/employer/messages";
    
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      setSendError("Failed to send message: The database is missing the required chat tables.");
      setNewMessage(content); // Restore optimistic clear
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-[var(--crimson)] text-white p-4 rounded-full shadow-lg hover:scale-105 transition-transform"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Drawer/Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end bg-black/50 sm:bg-transparent">
          <div 
            className="fixed inset-0" 
            onClick={() => setIsOpen(false)} 
            aria-hidden="true"
          />
          <div className="relative w-full sm:w-[400px] h-[90dvh] sm:h-[600px] sm:max-h-[80vh] bg-white mt-auto sm:mr-6 sm:mb-24 sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden sm:border sm:border-gray-200 z-10">
            {/* Header */}
            <div className="bg-[var(--navy)] text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle size={20} />
                <h3 className="font-semibold text-lg">{title}</h3>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white p-1 rounded-lg">
                <X size={24} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 my-auto">
                  <p>No messages yet.</p>
                  <p className="text-sm mt-1">Send a message to our office staff!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_type === senderType;
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                        isMe
                          ? "bg-[var(--navy)] text-white self-end rounded-br-sm"
                          : "bg-white border border-gray-200 text-gray-800 self-start rounded-bl-sm shadow-sm"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className={`text-[10px] block mt-1 ${isMe ? "text-white/70" : "text-gray-400"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Error Area */}
            {sendError && (
              <div className="bg-red-50 px-4 py-2 text-xs font-bold text-red-600 border-t border-red-100">
                {sendError}
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-200 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[var(--navy)]"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[var(--crimson)] text-white p-2 rounded-full disabled:opacity-50 hover:bg-red-700 transition-colors"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
