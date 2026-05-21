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
                    <div className="space-y-4">
                      {section.body.map((paragraph, i) => (
                        <p
                          key={i}
                          className="leading-relaxed text-muted-foreground"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
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
        )}

        {activeTab === 'specification' && (
          <>
            {hasSpecificationContent ? (
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
