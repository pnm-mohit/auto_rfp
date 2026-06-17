"use client"

import React, { Suspense, use, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { ArrowLeft, Plus, Save, Trash2, Upload } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"
import {
  Eyebrow,
  FooterNote,
  InsightStrip,
  StatusPill,
} from "@/components/layout"

interface Question {
  id: string
  question: string
}

interface Section {
  id: string
  title: string
  questions: Question[]
}

interface ProjectPayload {
  id?: string
  name?: string
}

interface CreateQuestionsInnerProps {
  projectId: string
}

function CreateQuestionsPageInner({ projectId }: CreateQuestionsInnerProps) {
  const router = useRouter()

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [project, setProject] = useState<ProjectPayload | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [sections, setSections] = useState<Section[]>([
    {
      id: uuidv4(),
      title: "",
      questions: [{ id: uuidv4(), question: "" }],
    },
  ])

  useEffect(() => {
    if (!projectId) {
      setError("No project ID provided")
      setIsLoading(false)
      return
    }

    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${projectId}`)
        if (!response.ok) {
          throw new Error("Failed to load project")
        }
        const data: ProjectPayload = await response.json()
        setProject(data)
        setIsLoading(false)
      } catch (fetchError) {
        console.error("Error loading project:", fetchError)
        setError("Failed to load project. Please try again.")
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  const addSection = useCallback(() => {
    setSections((prev) => [
      ...prev,
      {
        id: uuidv4(),
        title: "",
        questions: [{ id: uuidv4(), question: "" }],
      },
    ])
  }, [])

  const updateSectionTitle = useCallback((sectionId: string, title: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, title } : section,
      ),
    )
  }, [])

  const addQuestion = useCallback((sectionId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: [...section.questions, { id: uuidv4(), question: "" }],
            }
          : section,
      ),
    )
  }, [])

  const updateQuestion = useCallback(
    (sectionId: string, questionId: string, questionText: string) => {
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                questions: section.questions.map((q) =>
                  q.id === questionId ? { ...q, question: questionText } : q,
                ),
              }
            : section,
        ),
      )
    },
    [],
  )

  const removeQuestion = useCallback((sectionId: string, questionId: string) => {
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              questions: section.questions.filter((q) => q.id !== questionId),
            }
          : section,
      ),
    )
  }, [])

  const removeSection = useCallback((sectionId: string) => {
    setSections((prev) => prev.filter((section) => section.id !== sectionId))
  }, [])

  const saveQuestions = useCallback(async () => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "No project ID provided",
        variant: "destructive",
      })
      return
    }

    if (sections.some((section) => !section.title.trim())) {
      toast({
        title: "Validation Error",
        description: "All sections must have titles",
        variant: "destructive",
      })
      return
    }

    if (
      sections.some((section) =>
        section.questions.some((q) => !q.question.trim()),
      )
    ) {
      toast({
        title: "Validation Error",
        description: "All questions must have content",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const rfpDocument = {
        documentId: projectId,
        documentName: project?.name || "Manual Questions",
        sections: sections.map((section) => ({
          id: section.id,
          title: section.title,
          questions: section.questions,
        })),
        extractedAt: new Date().toISOString(),
      }

      const response = await fetch(`/api/questions/${projectId}/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rfpDocument),
      })

      if (!response.ok) {
        throw new Error("Failed to save questions")
      }

      toast({
        title: "Success",
        description: "Questions saved successfully",
      })

      router.push(`/projects/${projectId}/questions`)
    } catch (saveError) {
      console.error("Error saving questions:", saveError)
      toast({
        title: "Error",
        description: "Failed to save questions. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [projectId, sections, project, router])

  const goBack = useCallback(() => {
    router.push(`/projects/${projectId}/questions`)
  }, [projectId, router])

  const totals = useMemo(() => {
    const sectionCount = sections.length
    const questionCount = sections.reduce(
      (acc, section) => acc + section.questions.length,
      0,
    )
    return { sectionCount, questionCount }
  }, [sections])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Spinner size="lg" className="mb-4" />
          <p className="text-sm text-muted-foreground">Loading project…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-16 px-6">
        <div className="rounded-[12px] border border-border bg-card p-6">
          <h3 className="text-lg font-bold text-foreground">
            Something went wrong
          </h3>
          <p className="mt-2 text-sm text-[color:var(--pam-small)]">{error}</p>
          <Button onClick={goBack} variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Questions
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-[960px] px-6 py-8">
      <div className="flex items-center gap-2 mb-2.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={goBack}
          className="gap-1.5 text-[color:var(--pam-small)] hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Questions
        </Button>
      </div>

      <Eyebrow className="mb-4">
        Questions · {project?.name ?? "Project"}
      </Eyebrow>

      <header className="flex items-end justify-between gap-6 pb-6 border-b border-border mb-8 flex-wrap lg:flex-nowrap">
        <div className="min-w-0">
          <h1 className="text-[44px] leading-[1.05] font-extrabold tracking-[-0.03em] text-foreground">
            Create questions
          </h1>
          <p className="mt-2.5 text-[15px] leading-[1.55] text-[color:var(--pam-small)] max-w-[560px]">
            Add sections and questions manually, or import from CSV. Panamoure
            will extract structure automatically when you upload an RFP
            document.
          </p>
          <div className="flex items-center gap-2.5 mt-[18px] flex-wrap">
            <StatusPill variant="ghost" dot="muted">
              {totals.sectionCount} section
              {totals.sectionCount === 1 ? "" : "s"} · {totals.questionCount}{" "}
              question{totals.questionCount === 1 ? "" : "s"}
            </StatusPill>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" className="gap-2" disabled>
            <Upload className="h-4 w-4" />
            Import CSV
          </Button>
          <Button
            variant="default"
            onClick={saveQuestions}
            disabled={isSaving}
            className="gap-2"
          >
            {isSaving ? (
              <>
                <Spinner className="h-4 w-4" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save questions
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="space-y-5">
        {sections.map((section, sectionIndex) => (
          <section
            key={section.id}
            className="rounded-[12px] border border-border bg-card overflow-hidden"
          >
            <div className="flex items-center justify-between gap-4 px-7 pt-7 pb-4 border-b border-border">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span
                  className="w-[3px] h-[18px] bg-[color:var(--pam-pink)] rounded-sm shrink-0"
                  aria-hidden="true"
                />
                <Input
                  placeholder={`${sectionIndex + 1}. Section title`}
                  value={section.title}
                  onChange={(e) =>
                    updateSectionTitle(section.id, e.target.value)
                  }
                  className="text-[16px] font-bold tracking-[-0.01em] h-auto py-1.5 px-2.5 flex-1 min-w-0"
                />
                <Badge
                  variant="outline"
                  className="shrink-0 border-[color:var(--pam-grey-2)] bg-[color:var(--pam-grey)] text-foreground"
                >
                  {section.questions.length} question
                  {section.questions.length === 1 ? "" : "s"}
                </Badge>
              </div>
              {sections.length > 1 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSection(section.id)}
                  aria-label="Delete section"
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <div className="p-7 space-y-4">
              {section.questions.map((q, questionIndex) => (
                <div key={q.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12.5px] font-semibold text-[color:var(--pam-small)]">
                      Question {questionIndex + 1}
                    </label>
                    {section.questions.length > 1 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(section.id, q.id)}
                        className="h-7 px-2 text-[12px] font-medium text-[color:var(--pam-small)] hover:text-foreground gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </Button>
                    ) : null}
                  </div>
                  <Textarea
                    placeholder="Enter question text"
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(section.id, q.id, e.target.value)
                    }
                    className="min-h-[80px]"
                  />
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => addQuestion(section.id)}
                className="w-full justify-center border-dashed gap-2 mt-2"
              >
                <Plus className="h-4 w-4" />
                Add question
              </Button>
            </div>
          </section>
        ))}

        <Button
          variant="outline"
          size="lg"
          onClick={addSection}
          className="w-full justify-center border-dashed gap-2 text-[color:var(--pam-blue)] font-semibold py-6"
        >
          <Plus className="h-4 w-4" />
          Add new section
        </Button>
      </div>

      <InsightStrip title="Prefer to upload instead?">
        Drop in a PDF or Word version of the RFP and Panamoure RFP agent will
        extract sections and questions automatically — typically in under 30 seconds.{" "}
        <Link
          href={`/projects/${projectId}/documents`}
          className="font-semibold text-[color:var(--pam-pink)] hover:underline"
        >
          Upload document →
        </Link>
      </InsightStrip>

      <FooterNote />

      <Toaster />
    </div>
  )
}

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default function CreateQuestionsPage({ params }: PageProps) {
  const { projectId } = use(params)

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <div className="container mx-auto py-8 px-4 max-w-4xl">
            <div className="flex flex-col items-center justify-center h-64">
              <Spinner size="lg" className="mb-4" />
              <p className="text-sm text-muted-foreground">
                Loading create questions page…
              </p>
            </div>
          </div>
        </div>
      }
    >
      <CreateQuestionsPageInner projectId={projectId} />
    </Suspense>
  )
}
