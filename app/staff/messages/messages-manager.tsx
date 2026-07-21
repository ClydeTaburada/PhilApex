"use client";

import { useState, useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Send, User, Building2, MessageCircle } from "lucide-react";

type Contact = {
  id: string;
  name: string;
  email: string;
  type: "applicant" | "employer";
};

type Message = {
  id: string;
  sender_type: "applicant" | "employer" | "staff";
  content: string;
  created_at: string;
};

export function MessagesManager({ 
  applicants, 
  employers,
  staffId 
}: { 
  applicants: any[]; 
  employers: any[];
  staffId: string;
}) {
  const [activeTab, setActiveTab] = useState<"applicant" | "employer">("applicant");
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const supabase = createSupabaseBrowserClient();

  const contacts: Contact[] = [
    ...applicants.map(a => ({ id: a.id, name: a.full_name, email: a.email, type: "applicant" as const })),
    ...employers.map(e => ({ id: e.id, name: e.name, email: e.contact_email, type: "employer" as const }))
  ];

  const filteredContacts = contacts.filter(c => 
    c.type === activeTab && 
    (c.name.toLowerCase().includes(search.toLowerCase()) || (c.email && c.email.toLowerCase().includes(search.toLowerCase())))
  );

  const activeContact = contacts.find(c => c.id === activeContactId);
  const tableName = activeContact?.type === "applicant" ? "applicant_messages" : "employer_messages";
  const identifierCol = activeContact?.type === "applicant" ? "applicant_id" : "partner_id";

  // Fetch & Subscribe to messages when contact changes
  useEffect(() => {
    if (!activeContactId || !activeContact) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from(tableName)
        .select("*")
        .eq(identifierCol, activeContactId)
        .order("created_at", { ascending: true });
      if (data) setMessages(data as Message[]);
    };

    fetchMessages();

    const channel = supabase
      .channel(`staff_chat_${activeContactId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: tableName,
          filter: `${identifierCol}=eq.${activeContactId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeContactId, tableName, identifierCol, supabase, activeContact]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeContactId) return;

    const content = newMessage.trim();
    setNewMessage(""); 

    const { error } = await supabase.from(tableName).insert({
      [identifierCol]: activeContactId,
      sender_type: "staff",
      staff_id: staffId,
      content,
    });

    if (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-140px)] flex overflow-hidden">
      
      {/* Sidebar: Contacts List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-200">
          <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
            <button 
              onClick={() => { setActiveTab("applicant"); setActiveContactId(null); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "applicant" ? "bg-white shadow-sm text-[var(--navy)]" : "text-gray-500 hover:text-gray-700"}`}
            >
              Applicants
            </button>
            <button 
              onClick={() => { setActiveTab("employer"); setActiveContactId(null); }}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === "employer" ? "bg-white shadow-sm text-[var(--navy)]" : "text-gray-500 hover:text-gray-700"}`}
            >
              Employers
            </button>
          </div>
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--navy)]"
          />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No contacts found.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => setActiveContactId(contact.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex items-center gap-3 ${activeContactId === contact.id ? "bg-blue-50/50 border-l-4 border-[var(--navy)]" : "border-l-4 border-transparent"}`}
                >
                  <div className={`p-2 rounded-full ${activeContactId === contact.id ? "bg-[var(--navy)] text-white" : "bg-gray-200 text-gray-500"}`}>
                    {contact.type === "applicant" ? <User size={16} /> : <Building2 size={16} />}
                  </div>
                  <div className="overflow-hidden">
                    <p className={`text-sm font-medium truncate ${activeContactId === contact.id ? "text-[var(--navy)]" : "text-gray-900"}`}>{contact.name}</p>
                    <p className="text-xs text-gray-500 truncate">{contact.email || "No email"}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Chat View */}
      <div className="w-2/3 flex flex-col bg-white">
        {!activeContactId || !activeContact ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageCircle size={48} className="mb-4 opacity-20" />
            <p>Select a contact to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-[var(--navy)] text-white">
                  {activeContact.type === "applicant" ? <User size={20} /> : <Building2 size={20} />}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{activeContact.name}</h3>
                  <p className="text-xs text-gray-500 capitalize">{activeContact.type}</p>
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex flex-col gap-4">
              {messages.length === 0 ? (
                <div className="my-auto text-center text-gray-400">
                  <p>No messages in this thread yet.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isStaff = msg.sender_type === "staff";
                  return (
                    <div
                      key={msg.id}
                      className={`max-w-[70%] rounded-2xl px-5 py-3 ${
                        isStaff
                          ? "bg-[var(--navy)] text-white self-end rounded-br-sm shadow-md"
                          : "bg-white border border-gray-200 text-gray-800 self-start rounded-bl-sm shadow-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <span className={`text-[10px] block mt-1.5 ${isStaff ? "text-white/70" : "text-gray-400"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isStaff && msg.sender_type === "staff" ? " • Office" : ""}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={sendMessage} className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${activeContact.name}...`}
                  className="flex-1 bg-gray-100 border-transparent rounded-full px-5 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--navy)] focus:border-transparent transition-all outline-none"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-[var(--crimson)] text-white p-3 rounded-full hover:bg-red-700 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center shadow-md"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
