"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Loader2 } from "lucide-react";
import { searchUsers } from "@/lib/actions/search";
import { EmptySearchResults } from "./ui/EmptyState";

// We accept className so we can style it differently for Mobile vs Desktop
export default function UserSearch({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounce Search (Wait 300ms after typing stops before hitting DB)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const performSearch = async () => {
      if (isCancelled) return;

      if (query.length >= 2) {
        setIsLoading(true);
        setIsOpen(true);
        const users = await searchUsers(query);

        if (!isCancelled) {
          setResults(users);
          setIsLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    };

    timeoutId = setTimeout(() => {
      performSearch();
    }, 300);

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [query]);

  const handleSelect = (username: string) => {
    setQuery("");
    setIsOpen(false);
    router.push(`/u/${username}`);
    // If inside mobile menu, we might want to close it,
    // but the Link click in MobileMenu.tsx handles that separately.
  };

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
        {/* Search Input */}
        <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-leather-500 group-focus-within:text-leather-pop transition-colors" />
            <input
                type="text"
                aria-label="Search users"
                placeholder="Find a soul..."
                className="w-full bg-leather-900 border border-leather-600/50 rounded-full py-2 pl-10 pr-4 text-sm text-leather-accent placeholder-leather-600 focus:outline-none focus:ring-1 focus:ring-leather-pop focus:border-leather-pop transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
            />
            {isLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-leather-pop animate-spin" />
            )}
        </div>

        {/* Dropdown Results */}
        {isOpen && results.length > 0 && (
            <div className="absolute top-full mt-3 w-full bg-leather-800 border border-leather-600 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                <div className="py-2">
                  {results.map((user) => (
                      <button
                          key={user.username}
                          onClick={() => handleSelect(user.username)}
                          className="w-full text-left px-4 py-3 hover:bg-leather-700 flex items-center gap-3 transition-colors group"
                      >
                          <div className="relative w-avatar-sm h-avatar-sm rounded-full overflow-hidden bg-leather-900 shrink-0 border border-leather-600 group-hover:border-leather-pop">
                              <Image
                                  src={user.image || "/placeholder-avatar.png"}
                                  alt={`${user.username}'s profile picture`}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                  unoptimized={user.image !== undefined}
                              />
                          </div>
                          <span className="text-sm font-bold text-leather-accent group-hover:text-white truncate">
                              {user.username}
                          </span>
                      </button>
                  ))}
                </div>
            </div>
        )}

        {/* No Results State */}
        {isOpen && results.length === 0 && query.length >= 2 && !isLoading && (
             <div className="absolute top-full mt-3 w-full bg-leather-800 border border-leather-600 rounded-2xl shadow-xl p-4 z-50">
                <EmptySearchResults query={query} />
             </div>
        )}
    </div>
  );
}
