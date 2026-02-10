import { cache } from "react";
import { auth } from "@/lib/auth";

// Memoize auth() calls within a single React render cycle
// This ensures that multiple auth() calls in the same request
// only hit the database once
export const getCachedSession = cache(async () => {
  return await auth();
});
