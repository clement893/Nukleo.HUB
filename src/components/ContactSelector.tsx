"use client";

import { useState, useEffect, useRef } from "react";
import { Contact } from "@/types/contact";
import { Search, User, X, Check, Building2, Mail } from "lucide-react";

interface ContactSelectorProps {
  selectedContactId: string | null;
  selectedContactName: string | null;
  onSelect: (contact: Contact | null) => void;
}

export default function ContactSelector({
  selectedContactId,
  selectedContactName,
  onSelect,
}: ContactSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch contacts on search
  useEffect(() => {
    const fetchContacts = async () => {
      if (!isOpen) return;
      
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set("search", searchQuery);
        
        const response = await fetch(`/api/contacts?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          setContacts(data.slice(0, 10)); // Limit to 10 results
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchContacts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, isOpen]);

  // Fetch selected contact details on mount
  useEffect(() => {
    const fetchSelectedContact = async () => {
      if (selectedContactId && !selectedContact) {
        try {
          const response = await fetch(`/api/contacts/${selectedContactId}`);
          if (response.ok) {
            const data = await response.json();
            setSelectedContact(data);
          }
        } catch (error) {
          console.error("Error fetching selected contact:", error);
        }
      }
    };

    fetchSelectedContact();
  }, [selectedContactId, selectedContact]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (contact: Contact) => {
    setSelectedContact(contact);
    onSelect(contact);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    setSelectedContact(null);
    onSelect(null);
  };

  const displayName = selectedContact?.fullName || selectedContactName;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-foreground mb-2">
        <User className="inline w-4 h-4 mr-1" />
        Contact lié
      </label>

      {/* Selected Contact Display / Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-muted border border-border rounded-lg text-foreground cursor-pointer hover:border-primary/50 transition-colors flex items-center justify-between"
      >
        {displayName ? (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selectedContact?.photoUrl ? (
              <img
                src={selectedContact.photoUrl}
                alt={displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayName}</p>
              {selectedContact?.company && (
                <p className="text-xs text-muted-foreground truncate">
                  {selectedContact.position ? `${selectedContact.position} @ ` : ""}
                  {selectedContact.company}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-muted-foreground">Sélectionner un contact...</span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Chargement...
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                {searchQuery ? "Aucun contact trouvé" : "Tapez pour rechercher"}
              </div>
            ) : (
              contacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleSelect(contact)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  {contact.photoUrl ? (
                    <img
                      src={contact.photoUrl}
                      alt={contact.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {contact.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {contact.fullName}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {contact.company && (
                        <span className="flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3" />
                          {contact.company}
                        </span>
                      )}
                      {contact.email && (
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-3 h-3" />
                          {contact.email}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedContactId === contact.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
