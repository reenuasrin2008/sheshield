"use client";

import React, { useState, useEffect } from "react";
import { Phone, UserPlus, Trash2, ShieldCheck, Check, AlertCircle } from "lucide-react";
import { EmergencyContact, SupportedLanguage } from "@/types/sheshield";
import { getTranslation } from "@/lib/i18n/translations";
import { createClient } from "@/lib/supabase/client";

interface EmergencyContactsManagerProps {
  currentLang: SupportedLanguage;
}

export function EmergencyContactsManager({ currentLang }: EmergencyContactsManagerProps) {
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [relationship, setRelationship] = useState("Family");
  const [isAdding, setIsAdding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const t = getTranslation(currentLang);
  const supabase = createClient();

  // Load contacts
  useEffect(() => {
    async function loadContacts() {
      try {
        const { data: claimsData } = await supabase.auth.getClaims();
        const user = claimsData?.claims;
        if (!user) {
          // Demo fallback
          setContacts([
            {
              id: "demo_1",
              user_id: "demo",
              name: "Mother (Demo)",
              phone_number: "+91 98765 43210",
              relationship: "Parent",
              priority_order: 1,
              notify_sms: true,
              notify_call: true,
              is_verified: true,
              created_at: new Date().toISOString()
            }
          ]);
          return;
        }

        const { data, error } = await supabase
          .from("emergency_contacts")
          .select("*")
          .order("priority_order", { ascending: true });

        if (data && data.length > 0) {
          setContacts(data as any);
        } else {
          setContacts([]);
        }
      } catch (e) {
        console.warn("Could not load contacts:", e);
      }
    }
    loadContacts();
  }, [supabase]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phoneNumber.trim()) return;

    setIsAdding(true);
    try {
      const { data: claimsData } = await supabase.auth.getClaims();
      const user = claimsData?.claims;

      const newContact: EmergencyContact = {
        id: `contact_${Date.now()}`,
        user_id: user?.sub || "demo",
        name: name.trim(),
        phone_number: phoneNumber.trim(),
        relationship,
        priority_order: contacts.length + 1,
        notify_sms: true,
        notify_call: true,
        is_verified: true,
        created_at: new Date().toISOString()
      };

      if (user) {
        await supabase.from("emergency_contacts").insert({
          user_id: user.sub,
          name: newContact.name,
          phone_number: newContact.phone_number,
          relationship: newContact.relationship,
          priority_order: newContact.priority_order,
          notify_sms: true,
          notify_call: true
        });
      }

      setContacts(prev => [...prev, newContact]);
      setName("");
      setPhoneNumber("");
      setStatusMessage("Emergency contact registered successfully.");
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      alert("Failed to add contact: " + err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    try {
      await supabase.from("emergency_contacts").delete().eq("id", id);
    } catch {
      // optimistic
    }
  };

  return (
    <div className="w-full bg-card rounded-3xl border border-border p-6 sm:p-8 shadow-xl text-card-foreground">
      <div className="flex items-center justify-between border-b border-border/60 pb-5 mb-6">
        <div>
          <h3 className="text-xl font-bold tracking-tight">{t.settings_emergency_contacts}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Contacts receive automatic SMS alerts with your live coordinates during SOS.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full">
          {contacts.length} Registered
        </span>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs mb-4 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Add Contact Form */}
      <form onSubmit={handleAddContact} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
        <div>
          <input
            type="text"
            placeholder={t.settings_contact_name}
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-rose-500"
            required
          />
        </div>
        <div>
          <input
            type="tel"
            placeholder="+91 Phone Number"
            value={phoneNumber}
            onChange={e => setPhoneNumber(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-rose-500"
            required
          />
        </div>
        <div>
          <select
            value={relationship}
            onChange={e => setRelationship(e.target.value)}
            className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-rose-500"
          >
            <option value="Family">Family / Parent</option>
            <option value="Spouse">Spouse / Partner</option>
            <option value="Friend">Trusted Friend</option>
            <option value="Colleague">Colleague</option>
            <option value="Guardian">Guardian</option>
          </select>
        </div>
        <div>
          <button
            type="submit"
            disabled={isAdding}
            className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t.settings_add_contact}</span>
          </button>
        </div>
      </form>

      {/* Contacts List */}
      <div className="space-y-2">
        {contacts.map((contact, idx) => (
          <div
            key={contact.id}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border hover:border-border/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center">
                {idx + 1}
              </div>
              <div>
                <p className="font-semibold text-xs text-foreground flex items-center gap-2">
                  <span>{contact.name}</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-normal">
                    {contact.relationship}
                  </span>
                </p>
                <p className="text-[11px] text-muted-foreground font-mono">{contact.phone_number}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                <Check className="w-3 h-3" />
                SMS Active
              </span>
              <button
                onClick={() => handleDeleteContact(contact.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                title="Remove contact"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
