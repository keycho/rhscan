import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="mono text-3xl font-bold text-text">404</div>
      <p className="mt-2 text-sm text-muted">
        nothing here. that hash, address, block or token did not resolve.
      </p>
      <div className="mt-6">
        <SearchBox big />
      </div>
      <Link href="/" className="mt-6 inline-block text-xs text-muted hover:text-accent">
        back to home
      </Link>
    </div>
  );
}
