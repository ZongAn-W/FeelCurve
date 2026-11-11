import { notFound } from "next/navigation";

// Route unmatched classic URLs into the classic 404 instead of the global one.
export default function ClassicCatchAll() {
  notFound();
}
