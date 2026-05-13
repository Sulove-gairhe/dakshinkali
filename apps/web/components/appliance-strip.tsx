"use client"

type ApplianceItem = {
  label: string
  href?: string
  icon: React.ReactNode
}

type ApplianceStripProps = {
  title?: string
  appliances?: ApplianceItem[]
}

const defaultAppliances: ApplianceItem[] = [
  {
    label: "Televisions",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 transition-colors duration-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
  },
  {
    label: "Washing Machines",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 transition-colors duration-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 3.75h13.5a1.5 1.5 0 011.5 1.5v13.5a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V5.25a1.5 1.5 0 011.5-1.5z" />
        <circle cx="12" cy="13" r="4" strokeWidth={1.5} />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 6.5h2" />
        <circle cx="16" cy="6.5" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Refrigerators",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 transition-colors duration-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10h14" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 6v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13v4" />
      </svg>
    ),
  },
  {
    label: "Air Conditioner",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 transition-colors duration-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V7a1 1 0 011-1z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 14v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14v3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 14v3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 14v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h16" />
      </svg>
    ),
  },
  {
    label: "Water Geyser",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 transition-colors duration-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 4h8a2 2 0 012 2v12a2 2 0 01-2 2H8a2 2 0 01-2-2V6a2 2 0 012-2z" />
        <circle cx="12" cy="12" r="3" strokeWidth={1.5} />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 20v2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 2h4" />
      </svg>
    ),
  },
  {
    label: "Water Dispenser",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 transition-colors duration-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6a1 1 0 011 1v2H8V5a1 1 0 011-1z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h10a1 1 0 011 1v12a1 1 0 01-1 1H7a1 1 0 01-1-1V8a1 1 0 011-1z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 11h4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11v3" />
      </svg>
    ),
  },
  {
    label: "Oven",
    href: "#",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8 transition-colors duration-300">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10h14v7H5v-7z" />
        <circle cx="7" cy="7.5" r="0.75" fill="currentColor" />
        <circle cx="10" cy="7.5" r="0.75" fill="currentColor" />
        <circle cx="13" cy="7.5" r="0.75" fill="currentColor" />
      </svg>
    ),
  },
]

export function ApplianceStrip({
  title = "FEATURED PRODUCTS",
  appliances = defaultAppliances,
}: ApplianceStripProps) {
  return (
    <section className="border-t border-border bg-card py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-wide text-foreground sm:mb-10 sm:text-3xl">
          {title}
        </h2>
        <div className="scrollbar-hide -mx-4 flex items-center justify-start gap-6 overflow-x-auto px-4 sm:justify-evenly sm:gap-4 sm:overflow-visible sm:px-0">
          {appliances.map((appliance) => (
            <a
              key={appliance.label}
              href={appliance.href || "#"}
              className="group flex min-w-[80px] flex-col items-center gap-3"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-foreground transition-all duration-300 group-hover:bg-primary/10 group-hover:text-primary">
                {appliance.icon}
              </div>
              <span className="whitespace-nowrap text-center text-xs font-medium text-foreground sm:text-sm">
                {appliance.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}