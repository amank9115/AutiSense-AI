"use client";
import { useEffect, useState } from "react"
import { assistantApi } from "../../services/api/assistantApi"

const GlobalSearch = () => {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [answer, setAnswer] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (query.trim().length < 2) {
      setAnswer("")
      setError("")
      setLoading(false)
      return
    }

    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError("")
      try {
        const result = await assistantApi.search(query.trim())
        setAnswer(result.answer)
      } catch (requestError) {
        setAnswer("")
        setError(requestError instanceof Error ? requestError.message : "Search failed")
      } finally {
        setLoading(false)
      }
    }, 350)

    return () => window.clearTimeout(timer)
  }, [query])

  return (
    <div className="relative w-full" data-cursor="interactive">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-base text-on-surface-muted pointer-events-none">
        search
      </span>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search..."
        className="w-full rounded-2xl border border-outline-variant/20 bg-surface-container-high px-4 py-2.5 pl-10 text-sm text-on-surface placeholder:text-on-surface-muted outline-none focus:ring-2 focus:ring-primary/20 transition-all"
      />
      {query.trim().length >= 2 && (
        <div className="absolute top-12 left-0 z-30 w-full rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-2 shadow-(--shadow-card)">
          {loading ? (
            <p className="px-2 py-1.5 text-xs text-on-surface-muted">Searching...</p>
          ) : error ? (
            <p className="px-2 py-1.5 text-xs text-error">{error}</p>
          ) : answer ? (
            <p className="px-2 py-1.5 text-xs text-on-surface">{answer}</p>
          ) : (
            <p className="px-2 py-1.5 text-xs text-on-surface-muted">No results found</p>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
