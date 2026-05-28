"use client";

import { useState } from "react";
import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { Copy, GripVertical, Plus, Trash2 } from "lucide-react";
import { StringArrayEditor } from "./string-array-editor";
import type { BlogContentBlock } from "@/lib/admin/blog-types";

const BLOCK_LABELS: Record<BlogContentBlock["type"], string> = {
  paragraph: "Paragraph",
  heading: "Heading",
  list: "List",
  tip: "Tip / callout",
};

function newBlock(type: BlogContentBlock["type"]): BlogContentBlock {
  switch (type) {
    case "list":
      return { type: "list", items: [""] };
    case "heading":
      return { type: "heading", text: "" };
    case "tip":
      return { type: "tip", text: "" };
    default:
      return { type: "paragraph", text: "" };
  }
}

export function BlogBlockEditor({
  value,
  onChange,
}: {
  value: BlogContentBlock[];
  onChange: (blocks: BlogContentBlock[]) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const next = [...value];
    const [removed] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, removed);
    onChange(next);
  }

  function updateBlock(index: number, block: BlogContentBlock) {
    const next = [...value];
    next[index] = block;
    onChange(next);
  }

  function duplicateBlock(index: number) {
    const block = value[index];
    const copy = JSON.parse(JSON.stringify(block)) as BlogContentBlock;
    const next = [...value];
    next.splice(index + 1, 0, copy);
    onChange(next);
  }

  return (
    <div className="space-y-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="blog-blocks">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {value.map((block, index) => (
                <Draggable
                  key={`block-${index}`}
                  draggableId={`block-${index}`}
                  index={index}
                >
                  {(dragProvided) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            {...dragProvided.dragHandleProps}
                            className="cursor-grab rounded p-1 text-gray-400 hover:bg-gray-100"
                            aria-label="Drag to reorder"
                          >
                            <GripVertical className="h-4 w-4" />
                          </button>
                          <span className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                            {BLOCK_LABELS[block.type]}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => duplicateBlock(index)}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100"
                            title="Duplicate"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onChange(value.filter((_, i) => i !== index))
                            }
                            className="rounded p-1 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {block.type === "list" ? (
                        <StringArrayEditor
                          value={block.items}
                          onChange={(items) =>
                            updateBlock(index, { type: "list", items })
                          }
                          placeholder="List item"
                        />
                      ) : (
                        <textarea
                          rows={block.type === "tip" ? 3 : 4}
                          value={block.text}
                          onChange={(e) =>
                            updateBlock(index, {
                              ...block,
                              text: e.target.value,
                            } as BlogContentBlock)
                          }
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                          placeholder={
                            block.type === "heading"
                              ? "Heading text"
                              : "Write content…"
                          }
                        />
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-700 hover:border-amber-400 hover:bg-amber-50"
        >
          <Plus className="h-4 w-4" />
          Add block
        </button>
        {menuOpen ? (
          <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {(
              ["paragraph", "heading", "list", "tip"] as BlogContentBlock["type"][]
            ).map((type) => (
              <button
                key={type}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-amber-50"
                onClick={() => {
                  onChange([...value, newBlock(type)]);
                  setMenuOpen(false);
                }}
              >
                {BLOCK_LABELS[type]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
