import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-9xl font-bold text-leather-800 select-none">404</h1>
      <h2 className="text-2xl font-bold text-leather-pop mb-4">User Not Found</h2>
      <p className="text-leather-accent/70 mb-8 max-w-md">
        The user you are looking for has either vanished into the void or never existed at all.
      </p>
      <Link href="/">
        <Button>Go Home</Button>
      </Link>
    </div>
  );
}
