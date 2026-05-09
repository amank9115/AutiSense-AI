import { useState } from "react"

type AccordionItem = {
  title: string
  content: string
}

type AccordionProps = {
  items: AccordionItem[]
  defaultIndex?: number
  className?: string
}

const Accordion = ({ items, defaultIndex = 0, className }: AccordionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultIndex)

  return (
    <div className={className}>
      {items.map((item, index) => {
        const isOpen = openIndex === index
        const contentId = `accordion-panel-${index}`

        return (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 text-left"
              aria-expanded={isOpen}
              aria-controls={contentId}
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <span className="text-sm font-semibold text-slate-900">
                {item.title}
              </span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-xs font-semibold text-slate-700 transition ${
                  isOpen ? "bg-slate-900 text-white" : "bg-white"
                }`}
                aria-hidden="true"
              >
                {isOpen ? "-" : "+"}
              </span>
            </button>
            <div
              id={contentId}
              className={`grid overflow-hidden text-sm text-slate-600 transition-all duration-300 ${
                isOpen ? "mt-3 max-h-40 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <p className="pr-4 leading-relaxed">{item.content}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Accordion
