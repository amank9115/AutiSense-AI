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
    <div className="relative hidden lg:block" data-cursor="interactive">
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search doctors, reports, help"
        className="w-64 rounded-xl border border-slate-300/45 bg-white/55 px-4 py-2 text-sm text-slate-700 outline-none backdrop-blur-xl placeholder:text-slate-500 dark:border-slate-600/65 dark:bg-slate-900/50 dark:text-slate-100 dark:placeholder:text-slate-400"
      />
      {query.trim().length >= 2 && (
        <div className="absolute top-12 left-0 z-30 w-full rounded-xl border border-slate-200/70 bg-white/95 p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900/95">
          {loading ? (
            <p className="px-2 py-1 text-xs text-slate-500">Searching...</p>
          ) : error ? (
            <p className="px-2 py-1 text-xs text-rose-500">{error}</p>
          ) : answer ? (
            <p className="px-2 py-1 text-xs text-slate-700 dark:text-slate-200">{answer}</p>
          ) : (
            <p className="px-2 py-1 text-xs text-slate-500">No response</p>
          )}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
