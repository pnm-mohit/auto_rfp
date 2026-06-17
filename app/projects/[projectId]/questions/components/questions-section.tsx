"use client"

import React, { Suspense, useMemo, useState } from "react"
import { Toaster } from "@/components/ui/toaster"
import { FooterNote, KpiBand, KpiCell, KpiOf, KpiOk, KpiWarn } from "@/components/layout"

import { QuestionsProvider, useQuestions } from "./questions-provider"
import { QuestionsHeader } from "./questions-header"
import { NoQuestionsAvailable } from "./no-questions-available"
import { SourceDetailsDialog } from "./source-details-dialog"
import { QuestionsFilterTabs } from "./questions-filter-tabs"
import { QuestionsLoadingState, QuestionsErrorState } from "./questions-states"
import { MultiStepResponseHandler } from "./multi-step-response-handler"
import { IndexSelector } from "./index-selector"
import { UploadDialog } from "./upload-dialog"

interface QuestionsSectionProps {
  projectId: string
}

function QuestionsSectionInner({ projectId }: QuestionsSectionProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)

  const {
    isLoading,
    error,
    rfpDocument,
    answers,
    unsavedQuestions,
    savingQuestions,
    searchQuery,
    setSearchQuery,
    selectedSource,
    isSourceModalOpen,
    setIsSourceModalOpen,
    saveAllAnswers,
    handleExportAnswers,
    selectedIndexes,
    availableIndexes,
    orgAvailableIndexes,
    organizationConnected,
    attachIndex,
    refreshQuestions,
    getCounts,
  } = useQuestions()

  const handleUploadComplete = () => {
    refreshQuestions()
  }

  const hasNoQuestions =
    !rfpDocument ||
    rfpDocument.sections.length === 0 ||
    rfpDocument.sections.every((section) => section.questions.length === 0)

  const totals = useMemo(() => {
    if (!rfpDocument) {
      return {
        totalQuestions: 0,
        totalSections: 0,
        answered: 0,
        unanswered: 0,
        review: 0,
        completion: 0,
        avgConfidence: 0,
      }
    }
    const counts = getCounts()
    const totalQuestions = counts.all
    const answered = counts.answered
    const unanswered = counts.unanswered
    const totalSections = rfpDocument.sections.length

    const review = Object.entries(answers).filter(
      ([, data]) => data?.text && data.text.trim() !== "" && (data.sources?.length ?? 0) === 0,
    ).length

    const completion = totalQuestions > 0 ? Math.round((answered / totalQuestions) * 100) : 0

    const relevances = Object.values(answers)
      .flatMap((data) => data?.sources ?? [])
      .map((source) => source?.relevance)
      .filter((value): value is number => typeof value === "number")

    const avgConfidence =
      relevances.length > 0
        ? Math.round(
            (relevances.reduce((sum, value) => sum + value, 0) / relevances.length) * 100,
          )
        : 0

    return {
      totalQuestions,
      totalSections,
      answered,
      unanswered,
      review,
      completion,
      avgConfidence,
    }
  }, [rfpDocument, answers, getCounts])

  return (
    <div className="min-h-screen px-6 py-8 md:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto w-full max-w-[1280px] space-y-0">
        {isLoading ? <QuestionsLoadingState /> : null}
        {error ? <QuestionsErrorState error={error} /> : null}

        {!isLoading && !error && hasNoQuestions ? (
          <NoQuestionsAvailable
            projectId={projectId}
            onUploadClick={() => setIsUploadDialogOpen(true)}
          />
        ) : null}

        {!isLoading && !error && rfpDocument && !hasNoQuestions ? (
          <>
            <QuestionsHeader
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSaveAll={saveAllAnswers}
              onExport={handleExportAnswers}
              unsavedCount={unsavedQuestions.size}
              isSaving={savingQuestions.size > 0}
              totalQuestions={totals.totalQuestions}
              totalSections={totals.totalSections}
            />

            <KpiBand>
              <KpiCell
                label="Completion"
                value={
                  <>
                    {totals.completion}
                    <KpiOf>%</KpiOf>
                  </>
                }
                progress={totals.completion}
                foot={`${totals.answered} of ${totals.totalQuestions} answered`}
              />
              <KpiCell
                label="Answered"
                value={
                  <>
                    {totals.answered}
                    <KpiOf>/ {totals.totalQuestions}</KpiOf>
                  </>
                }
                progress={totals.completion}
                foot={
                  unsavedQuestions.size > 0 ? (
                    <KpiOk>+{unsavedQuestions.size} pending save</KpiOk>
                  ) : (
                    "All saved"
                  )
                }
              />
              <KpiCell
                label="Unanswered"
                value={totals.unanswered}
                progress={
                  totals.totalQuestions > 0
                    ? Math.round((totals.unanswered / totals.totalQuestions) * 100)
                    : 0
                }
                foot={
                  totals.review > 0 ? (
                    <KpiWarn>{totals.review} need review</KpiWarn>
                  ) : (
                    "No drafts pending"
                  )
                }
              />
              <KpiCell
                label="Avg. confidence"
                value={
                  <>
                    {totals.avgConfidence}
                    <KpiOf>%</KpiOf>
                  </>
                }
                progress={totals.avgConfidence}
                foot={
                  totals.avgConfidence >= 80
                    ? "High — across saved answers"
                    : totals.avgConfidence > 0
                      ? "Mixed — review low-confidence drafts"
                      : "No confidence data yet"
                }
              />
            </KpiBand>

            <IndexSelector
              availableIndexes={availableIndexes}
              orgAvailableIndexes={orgAvailableIndexes}
              selectedIndexes={selectedIndexes}
              organizationConnected={organizationConnected}
              projectId={projectId}
              onRefresh={refreshQuestions}
              onAttachIndex={attachIndex}
            />

            <QuestionsFilterTabs rfpDocument={rfpDocument} />
          </>
        ) : null}

        <FooterNote />
      </div>

      <SourceDetailsDialog
        isOpen={isSourceModalOpen}
        onClose={() => setIsSourceModalOpen(false)}
        source={selectedSource}
      />

      <MultiStepResponseHandler />

      <UploadDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        projectId={projectId}
        onUploadComplete={handleUploadComplete}
      />

      <Toaster />
    </div>
  )
}

export function QuestionsSection({ projectId }: QuestionsSectionProps) {
  return (
    <QuestionsProvider projectId={projectId}>
      <Suspense
        fallback={
          <div className="min-h-screen px-6 py-8 md:px-10 lg:px-14 lg:py-10">
            <div className="mx-auto w-full max-w-[1280px] space-y-6">
              <div className="h-10 w-64 animate-pulse rounded bg-muted" />
              <div className="h-32 animate-pulse rounded-[14px] bg-muted" />
              <div className="h-12 animate-pulse rounded-[10px] bg-muted" />
              <div className="h-[420px] animate-pulse rounded-[12px] bg-muted" />
            </div>
          </div>
        }
      >
        <QuestionsSectionInner projectId={projectId} />
      </Suspense>
    </QuestionsProvider>
  )
}
