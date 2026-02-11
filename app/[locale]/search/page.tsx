import { Suspense } from "react";
import UserSearch from "@/components/UserSearch";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-leather-pop/10 flex items-center justify-center">
            <SearchIcon className="w-8 h-8 text-leather-pop" />
          </div>
          <h1 className="text-3xl font-bold text-leather-accent mb-2">
            Find People
          </h1>
          <p className="text-leather-100/60 text-sm">
            Search for users to send anonymous messages
          </p>
        </div>

        {/* Search Component */}
        <div className="max-w-xl mx-auto">
          <Suspense fallback={<SearchSkeleton />}>
            <UserSearch className="w-full" />
          </Suspense>
        </div>

        {/* Info Section */}
        <div className="mt-12 text-center">
          <div className="max-w-md mx-auto p-6 rounded-2xl bg-leather-800/50 border border-leather-700/30">
            <h2 className="text-lg font-bold text-leather-accent mb-2">
              How it works
            </h2>
            <ul className="text-sm text-leather-100/70 space-y-2 text-start">
              <li className="flex items-start gap-2">
                <span className="text-leather-pop mt-0.5">•</span>
                <span>Search for any user by their username</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-leather-pop mt-0.5">•</span>
                <span>Visit their profile to send an anonymous message</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-leather-pop mt-0.5">•</span>
                <span>Choose to send anonymously or reveal yourself</span>
              </li>
            </ul>
          </div>
        </div>
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="w-full">
      <div className="h-10 bg-leather-800/50 rounded-full animate-pulse" />
    </div>
  );
}
