import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-24 h-24 bg-leather-800 rounded-full flex items-center justify-center text-4xl shadow-xl">
        🌫️
      </div>
      <h2 className="text-3xl font-bold text-leather-accent">Lost in the Void?</h2>
      <p className="text-leather-500 max-w-md">
        The page you are looking for has vanished into thin air (or never existed).
      </p>
      <Link href="/">
        <Button className="bg-leather-pop text-leather-900 font-bold hover:bg-leather-popHover">
          Return to Safety
        </Button>
      </Link>
    </div>
  );
}
