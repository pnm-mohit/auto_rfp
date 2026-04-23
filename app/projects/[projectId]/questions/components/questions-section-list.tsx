"use client"

import type { ReactNode } from "react"
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  Pencil,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnswerSource, RfpDocument, RfpQuestion, RfpSection } from "@/types/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SectionCard } from "@/components/layout"

interface AnswerData {
  text: string
  sources?: AnswerSource[]
}

type QuestionStatus = "answered" | "review" | "unanswered"

type FilterKey = "all" | "answered" | "unanswered" | "review"

interface Props {
  rfpDocument: RfpDocument
  filterType: FilterKey
  searchQuery: string
  answers: Record<string, AnswerData>
  unsavedQuestions: Set<string>
  savingQuestions: Set<string>
  selectedQuestion: string | null
  openSections: Record<string, boolean>
  activeIndexName?: string
  indexNameById: Map<string, string>
  onToggleSection: (sectionId: string) => void
  onSelectQuestion: (questionId: string) => void
  onGenerateAnswer: (questionId: string) => void
  isGenerating: Record<string, boolean>
  isMultiStepGenerating: boolean
  editorSlot?: (questionId: string) => ReactNode
}

function getQuestionStatus(
  questionId: string,
  answers: Record<string, AnswerData>,
): QuestionStatus {
  const data = answers[questionId]
  const hasText = Boolean(data?.text && data.text.trim() !== "")
  if (!hasText) return "unanswered"
  const hasSources = (data?.sources?.length ?? 0) > 0
  return hasSources ? "answered" : "review"
}

function matchesFilter(status: QuestionStatus, filter: FilterKey): boolean {
  if (filter === "all") return true
  if (filter === "answered") return status === "answered"
  if (filter === "unanswered") return status === "unanswered"
  return status === "review"
}

function matchesSearch(question: RfpQuestion, section: RfpSection, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    question.question.toLowerCase().includes(q) ||
    section.title.toLowerCase().includes(q)
  )
}

function getPreview(question: RfpQuestion, answer: AnswerData | undefined, status: QuestionStatus) {
  if (status === "unanswered") return "Not yet answered."
  if (status === "review") {
    return "Draft in progress — confidence below threshold. Review recommended."
  }
  const text = (answer?.text ?? "").replace(/\s+/g, " ").trim()
  if (!text) return "Answer saved."
  return text.length > 180 ? `${text.slice(0, 180)}…` : text
}

function StatusIcon({ status }: { status: QuestionStatus }) {
  if (status === "answered") {
    return (
      <div className="shrink-0 mt-0.5 grid h-7 w-7 place-items-center rounded-lg bg-[#E4F7EF] text-[#0A6A4A]">
        <Check className="h-[15px] w-[15px]" strokeWidth={2.4} />
      </div>
    )
  }
  if (status === "review") {
    return (
      <div className="shrink-0 mt-0.5 grid h-7 w-7 place-items-center rounded-lg bg-[color:var(--pam-pink-soft)] text-[color:var(--pam-pink-ink)]">
        <AlertTriangle className="h-[14px] w-[14px]" strokeWidth={2.4} />
      </div>
    )
  }
  return (
    <div className="shrink-0 mt-0.5 grid h-7 w-7 place-items-center rounded-lg bg-[color:var(--pam-grey)] text-muted-foreground">
      <Circle className="h-[14px] w-[14px]" strokeWidth={2.4} />
    </div>
  )
}

function buildQuestionNumber(sectionIndex: number, questionIndex: number) {
  return `${sectionIndex + 1}.${questionIndex + 1}`
}

export function QuestionsSectionList({
  rfpDocument,
  filterType,
  searchQuery,
  answers,
  unsavedQuestions,
  savingQuestions,
  selectedQuestion,
  openSections,
  activeIndexName,
  indexNameById,
  onToggleSection,
  onSelectQuestion,
  onGenerateAnswer,
  isGenerating,
  isMultiStepGenerating,
  editorSlot,
}: Props) {
  const filteredSections = rfpDocument.sections
    .map((section, sectionIndex) => {
      const questions = section.questions
        .map((question, questionIndex) => ({
          question,
          questionIndex,
        }))
        .filter(({ question }) => {
          const status = getQuestionStatus(question.id, answers)
          return matchesFilter(status, filterType) && matchesSearch(question, section, searchQuery)
        })
      return { section, sectionIndex, questions }
    })
    .filter(({ questions }) => questions.length > 0)

  if (filteredSections.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border bg-card px-7 py-10 text-center text-[13.5px] text-muted-foreground">
        No questions match this view.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {filteredSections.map(({ section, sectionIndex, questions }) => {
        const isOpen = openSections[section.id] ?? false
        const title = `${sectionIndex + 1}. ${section.title}`
        const total = section.questions.length

        return (
          <SectionCard
            key={section.id}
            title={title}
            padded={false}
            actions={
              <>
                <Badge variant="secondary" className="h-6 px-2 text-[11px] font-semibold">
                  {total} question{total === 1 ? "" : "s"}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onToggleSection(section.id)}
                  aria-label={isOpen ? "Collapse section" : "Expand section"}
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </>
            }
          >
            {isOpen ? (
              <div className="px-7 pb-2">
                {questions.map(({ question, questionIndex }, rowIdx) => {
                  const status = getQuestionStatus(question.id, answers)
                  const answerData = answers[question.id]
                  const isUnsaved = unsavedQuestions.has(question.id)
                  const isSaving = savingQuestions.has(question.id)
                  const isRowSelected = selectedQuestion === question.id
                  const isLast = rowIdx === questions.length - 1
                  const isDrafting = isGenerating[question.id] || isMultiStepGenerating
                  const sourceIndexName =
                    answerData?.sources?.[0]?.documentId &&
                    indexNameById.get(answerData.sources[0].documentId)
                  const resolvedIndexName = sourceIndexName || activeIndexName
                  const preview = getPreview(question, answerData, status)
                  const qNumber = buildQuestionNumber(sectionIndex, questionIndex)

                  return (
                    <div
                      key={question.id}
                      className={cn(
                        "py-[18px]",
                        !isLast && "border-b border-border",
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <StatusIcon status={status} />
                        <button
                          type="button"
                          onClick={() => onSelectQuestion(question.id)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="text-[14px] font-semibold text-[color:var(--pam-blue)]">
                            <span className="mr-2">{qNumber}</span>
                            {question.question}
                          </div>
                          <p
                            className={cn(
                              "mt-1.5 text-[13px] leading-[1.55]",
                              status === "unanswered"
                                ? "text-muted-foreground"
                                : "text-[color:var(--pam-small)]",
                            )}
                          >
                            {preview}
                          </p>
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            {status === "answered" ? (
                              <Badge className="bg-[#E4F7EF] text-[#0A6A4A] border-transparent hover:bg-[#E4F7EF]">
                                Answered
                              </Badge>
                            ) : status === "review" ? (
                              <Badge className="bg-amber-100 text-amber-900 border-transparent hover:bg-amber-100">
                                Needs review
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Unanswered</Badge>
                            )}
                            {status !== "unanswered" && resolvedIndexName ? (
                              <Badge variant="outline" className="font-medium">
                                {resolvedIndexName}
                              </Badge>
                            ) : null}
                            {isUnsaved ? (
                              <Badge className="bg-[color:var(--pam-pink-soft)] text-[color:var(--pam-pink-ink)] border-transparent hover:bg-[color:var(--pam-pink-soft)]">
                                Unsaved
                              </Badge>
                            ) : null}
                            {isSaving ? (
                              <Badge variant="outline" className="font-medium">
                                Saving…
                              </Badge>
                            ) : null}
                          </div>
                        </button>
                        {status === "unanswered" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-[12.5px]"
                            disabled={isDrafting}
                            onClick={() => onGenerateAnswer(question.id)}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {isDrafting ? "Drafting…" : "Draft with AI"}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            aria-label="Edit question"
                            onClick={() => onSelectQuestion(question.id)}
                          >
                            <Pencil className="h-[15px] w-[15px]" />
                          </Button>
                        )}
                      </div>
                      {editorSlot && isRowSelected ? editorSlot(question.id) : null}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-7 py-4 text-[13px] text-muted-foreground">
                Expand to review {questions.length} question{questions.length === 1 ? "" : "s"} in this section.
              </div>
            )}
          </SectionCard>
        )
      })}
    </div>
  )
}
