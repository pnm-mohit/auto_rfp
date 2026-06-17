"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Download, MessageSquare, Save, Search } from "lucide-react"
import { PageHeader, StatusPill } from "@/components/layout"

interface QuestionsHeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onSaveAll: () => void
  onExport: () => void
  unsavedCount: number
  isSaving: boolean
  totalQuestions?: number
  totalSections?: number
}

export function QuestionsHeader({
  searchQuery,
  onSearchChange,
  onSaveAll,
  onExport,
  unsavedCount,
  isSaving,
  totalQuestions,
  totalSections,
}: QuestionsHeaderProps) {
  const pills = (
    <>
      {unsavedCount > 0 ? (
        <StatusPill variant="ghost" dot="amber">
          {unsavedCount} unsaved change{unsavedCount === 1 ? "" : "s"}
        </StatusPill>
      ) : null}
      {typeof totalQuestions === "number" ? (
        <StatusPill
          variant="ghost"
          dot="none"
          icon={<MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />}
        >
          {totalQuestions} question{totalQuestions === 1 ? "" : "s"}
          {typeof totalSections === "number" ? ` · ${totalSections} section${totalSections === 1 ? "" : "s"}` : null}
        </StatusPill>
      ) : null}
    </>
  )

  const actions = (
    <>
      <div className="relative min-w-[260px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search questions…"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-9 pl-9"
        />
      </div>
      <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
        <Download className="h-4 w-4" />
        Export
      </Button>
      <Button
        size="sm"
        onClick={onSaveAll}
        disabled={unsavedCount === 0 || isSaving}
        className="gap-1.5"
      >
        {isSaving ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {isSaving ? "Saving…" : `Save All${unsavedCount > 0 ? ` (${unsavedCount})` : ""}`}
      </Button>
    </>
  )

  return (
    <PageHeader
      eyebrow="Project · RFP"
      title="RFP Questions"
      sub="Browse, answer, and export every question in this project. Panamoure RFP agent drafts from your selected knowledge index and highlights responses that need review."
      pills={pills}
      actions={actions}
    />
  )
}
