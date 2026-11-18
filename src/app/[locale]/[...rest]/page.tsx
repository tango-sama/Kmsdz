import { notFound } from "next/navigation";

/** Catch-all so that unknown URLs render the localized 404 page (with the right status code). */
export default function CatchAll() {
  notFound();
}
