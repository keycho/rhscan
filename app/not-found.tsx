import Link from "next/link";
import { Container } from "@/components/primitives";
import { SearchBox } from "@/components/SearchBox";

export default function NotFound() {
  return (
    <Container className="py-16">
      <div className="mx-auto max-w-xl text-center">
        <div className="mono text-3xl font-bold text-text">404</div>
        <p className="mt-2 text-sm text-label">
          nothing here. that hash, address, block or token did not resolve.
        </p>
        <div className="mt-6">
          <SearchBox big />
        </div>
        <Link href="/" className="mt-6 inline-block text-xs text-label hover:text-green">
          back to home
        </Link>
      </div>
    </Container>
  );
}
