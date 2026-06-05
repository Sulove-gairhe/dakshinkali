'use client'

import { useState } from 'react'
import Image from 'next/image'
import type {
  ProductDescriptionSection,
  ProductSpecificationGroup,
} from '@/lib/store-products'

interface DescriptionTabsProps {
  sections?: ProductDescriptionSection[]
  specifications?: ProductSpecificationGroup[]
  boxContents?: string[]
  deliveryInfo?: string[]
}

// ─── Thresholds ────────────────────────────────────────────────────────────────
// Description: collapse if total text > 400 chars OR more than 2 sections
const DESCRIPTION_CHAR_THRESHOLD = 400
const DESCRIPTION_SECTION_THRESHOLD = 2

// Specs: collapse if total spec rows > 10
const SPEC_ROW_THRESHOLD = 10

// ─── Collapsible wrapper ───────────────────────────────────────────────────────
interface CollapsibleProps {
  children: React.ReactNode
  /** Whether the content is long enough to need collapsing */
  needsToggle: boolean
  /** Collapsed height in Tailwind max-h value (e.g. "max-h-48") */
  collapsedClass?: string
}

function Collapsible({ children, needsToggle, collapsedClass = 'max-h-48' }: CollapsibleProps) {
  const [expanded, setExpanded] = useState(false)

  if (!needsToggle) return <>{children}</>

  return (
    <div className="relative">
      <div
        className={[
          'relative overflow-hidden transition-[max-height] motion-reduce:transition-none',
          expanded ? 'max-h-[4000px] duration-500 ease-in-out' : `${collapsedClass} duration-300 ease-in-out`,
        ].join(' ')}
      >
        {children}
        {!expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/85 to-background/0 backdrop-blur-[1px]" />
        )}
      </div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={[
          'mx-auto flex cursor-pointer items-center justify-center rounded-full border border-border bg-white/85 px-5 py-2 text-[13px] font-bold text-primary shadow-sm backdrop-blur-md transition-all hover:border-accent hover:bg-white hover:text-primary hover:shadow-md',
          expanded ? 'mt-4' : 'relative z-10 -mt-8',
        ].join(' ')}
      >
        {expanded ? 'View less' : 'View more'}
      </button>
    </div>
  )
}

/** Collapsible body text for a single description section. */
function CollapsibleBody({ paragraphs }: { paragraphs: string[] }) {
  const totalChars = paragraphs.join(' ').length
  const needsToggle = totalChars > 280 || paragraphs.length > 2

  return (
    <Collapsible needsToggle={needsToggle} collapsedClass="max-h-[5.5rem]">
      <div className="space-y-4">
        {paragraphs.map((paragraph, i) => (
          <p key={i} className="leading-relaxed text-muted-foreground">
            {paragraph}
          </p>
        ))}
      </div>
    </Collapsible>
  )
}

export function DescriptionTabs({
  sections = [],
  specifications = [],
  boxContents = [],
  deliveryInfo = [],
}: DescriptionTabsProps) {
  const [activeTab, setActiveTab] = useState('description')
  const specificationGroups = specifications.filter(
    (group) => group.specs.length > 0
  )
  const hasSpecificationContent =
    specificationGroups.length > 0 ||
    boxContents.length > 0 ||
    deliveryInfo.length > 0

  // Compute whether description tab needs a top-level collapse
  const totalDescriptionChars = sections.flatMap((s) => s.body ?? []).join(' ').length
  const descriptionNeedsToggle =
    totalDescriptionChars > DESCRIPTION_CHAR_THRESHOLD ||
    sections.length > DESCRIPTION_SECTION_THRESHOLD

  // Compute whether spec tab needs a top-level collapse
  const totalSpecRows = specificationGroups.reduce((sum, g) => sum + g.specs.length, 0)
    + boxContents.length + deliveryInfo.length
  const specNeedsToggle = totalSpecRows > SPEC_ROW_THRESHOLD

  return (
    <div className="mt-12">
      {/* Tab Navigation */}
      <div className="border-b border-border">
        <div className="flex gap-8">
          {['description', 'specification', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer py-4 text-sm font-medium capitalize transition-colors duration-200 ${
                activeTab === tab
                  ? 'border-b-2 border-foreground text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'description' && (
          <Collapsible needsToggle={descriptionNeedsToggle} collapsedClass="max-h-64">
            <div className="space-y-8">
              {sections.length > 0 ? (
                sections.map((section, index) => (
                  <div key={section.id}>
                    {section.title && (
                      <h3 className="mb-4 text-2xl font-bold text-foreground">
                        {section.title}
                      </h3>
                    )}
                    {section.subtitle && (
                      <h4 className="mb-3 text-lg font-semibold text-foreground">
                        {section.subtitle}
                      </h4>
                    )}
                    {section.body && (
                      <CollapsibleBody paragraphs={section.body} />
                    )}
                    {section.image && (
                      <div className="relative my-6 aspect-video w-full overflow-hidden rounded-lg">
                        <Image
                          src={section.image.src}
                          alt={section.image.alt}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    {section.bullets && (
                      <ul className="space-y-2">
                        {section.bullets.map((bullet, i) => (
                          <li
                            key={i}
                            className="flex gap-3 text-muted-foreground"
                          >
                            <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-foreground" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {index < sections.length - 1 && (
                      <div className="mt-8 border-t border-border" />
                    )}
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Product description will be updated soon.</p>
                </div>
              )}
            </div>
          </Collapsible>
        )}

        {activeTab === 'specification' && (
          <>
            {hasSpecificationContent ? (
              <Collapsible needsToggle={specNeedsToggle} collapsedClass="max-h-80">
                <div className="space-y-8">
                {specificationGroups.map((group) => (
                  <section key={group.title}>
                    <h3 className="mb-4 text-xl font-bold text-foreground">
                      {group.title}
                    </h3>
                    <dl className="overflow-hidden rounded-lg border border-border">
                      {group.specs.map((spec, index) => (
                        <div
                          key={`${group.title}-${spec.label}`}
                          className={`grid gap-3 px-4 py-3 text-sm sm:grid-cols-[minmax(10rem,16rem)_1fr] ${
                            index !== group.specs.length - 1
                              ? 'border-b border-border'
                              : ''
                          }`}
                        >
                          <dt className="font-semibold text-foreground">
                            {spec.label}
                          </dt>
                          <dd className="text-muted-foreground">
                            {spec.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}

                {boxContents.length > 0 && (
                  <section>
                    <h3 className="mb-4 text-xl font-bold text-foreground">
                      Box Contents
                    </h3>
                    <ul className="space-y-2">
                      {boxContents.map((item) => (
                        <li key={item} className="flex gap-3 text-muted-foreground">
                          <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-foreground" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {deliveryInfo.length > 0 && (
                  <section>
                    <h3 className="mb-4 text-xl font-bold text-foreground">
                      Delivery Info
                    </h3>
                    <ul className="space-y-2">
                      {deliveryInfo.map((item) => (
                        <li key={item} className="flex gap-3 text-muted-foreground">
                          <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-foreground" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
              </Collapsible>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>Specifications will be updated soon.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'reviews' && (
          <div className="py-8 text-center text-muted-foreground">
            <p>Reviews content coming soon</p>
          </div>
        )}
      </div>
    </div>
  )
}
