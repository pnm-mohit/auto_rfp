"use client"

import { useState } from "react"
import Link from "next/link"
import { AlertCircle, Database, Plus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MetaItem, MetaRibbon, MetaSync, StatusPill } from "@/components/layout"

interface ProjectIndex {
  id: string
  name: string
}

interface IndexSelectorProps {
  availableIndexes: ProjectIndex[]
  orgAvailableIndexes: ProjectIndex[]
  selectedIndexes: Set<string>
  organizationConnected: boolean
  projectId: string
  onRefresh?: () => void
  onAddIndex?: () => void
  onAttachIndex?: (indexId: string) => Promise<void>
}

export function IndexSelector({
  availableIndexes,
  orgAvailableIndexes,
  selectedIndexes,
  organizationConnected,
  projectId,
  onRefresh,
  onAddIndex,
  onAttachIndex,
}: IndexSelectorProps) {
  const [attaching, setAttaching] = useState(false)
  const hasAttached = availableIndexes.length > 0

  if (!hasAttached) {
    const singleOrgIndex =
      organizationConnected && orgAvailableIndexes.length === 1
        ? orgAvailableIndexes[0]
        : null

    const attachSingle = async () => {
      if (!singleOrgIndex || !onAttachIndex) return
      try {
        setAttaching(true)
        await onAttachIndex(singleOrgIndex.id)
      } finally {
        setAttaching(false)
      }
    }

    return (
      <MetaRibbon className="border border-amber-200 bg-amber-50">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-[13px]">
              No knowledge base attached
            </p>
            <p className="text-[12.5px] text-amber-700 leading-[1.55]">
              {organizationConnected && orgAvailableIndexes.length > 0
                ? "Pick an index from your organisation below to let Panamoure RFP agent draft answers grounded in prior content."
                : "Connect your organisation to LlamaCloud and add at least one index so Panamoure RFP agent can draft answers grounded in prior content."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {singleOrgIndex && onAttachIndex ? (
            <Button
              size="sm"
              onClick={attachSingle}
              disabled={attaching}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {attaching ? "Attaching…" : `Attach ${singleOrgIndex.name}`}
            </Button>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${projectId}/documents`}>Open Documents</Link>
          </Button>
        </div>
      </MetaRibbon>
    )
  }

  return (
    <MetaRibbon>
      <MetaItem
        icon={<Database className="h-[15px] w-[15px]" />}
        label="Indexes"
        value={`${selectedIndexes.size} active`}
      />
      <div className="flex gap-2 flex-wrap">
        {availableIndexes.map((index) => {
          const isActive = selectedIndexes.has(index.id)
          return (
            <StatusPill
              key={index.id}
              variant="ghost"
              dot={isActive ? "green" : "muted"}
              className="py-1.5"
            >
              {index.name}
              {isActive ? <span className="ml-1 font-bold">· active</span> : null}
            </StatusPill>
          )
        })}
        {onAddIndex ? (
          <Button variant="ghost" size="sm" onClick={onAddIndex} className="gap-1 h-7 text-[12px]">
            <Plus className="h-3.5 w-3.5" />
            Add index
          </Button>
        ) : null}
      </div>
      <MetaSync>
        {onRefresh ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            className="gap-1 h-7 text-[12px]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        ) : null}
      </MetaSync>
    </MetaRibbon>
  )
}
