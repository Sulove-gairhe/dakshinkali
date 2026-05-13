'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { ProductDetailData } from '@/types/product'

interface DescriptionTabsProps {
  sections: ProductDetailData['descriptionSections']
}

export function DescriptionTabs({ sections }: DescriptionTabsProps) {
  const [activeTab, setActiveTab] = useState('description')

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
            {sections.map((section, index) => (
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
            ))}
          </div>
        )}

        {activeTab === 'specification' && (
          <div className="py-8 text-center text-muted-foreground">
            <p>Specification content coming soon</p>
          </div>
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
