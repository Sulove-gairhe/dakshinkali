import { Suspense } from "react";
import { SearchResultsClient } from "./search-results-client";

// Data is already fetched in the root layout and available via SearchDataContext.
// The SearchResultsClient reads it from context — no extra fetch needed here.
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResultsClient />
    </Suspense>
  );
}
