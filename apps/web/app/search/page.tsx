import { Suspense } from "react";
import { SearchResultsClient } from "./search-results-client";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResultsClient />
    </Suspense>
  );
}
