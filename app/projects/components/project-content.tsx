"use client"

import React, { useEffect, useMemo, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { format, formatDistanceToNow } from "date-fns"
import {
  Calendar,
  Clock,
  User,
  Box,
  RefreshCw,
  Plus,
  Trash2,
  Share2,
  FileText,
  Send,
  RotateCcw,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog"
import { useOrganization } from "@/context/organization-context"
import type { RfpDocument } from "@/types/api"

import {
  PageHeader,
  StatusPill,
  KpiBand,
  KpiCell,
  KpiOf,
  KpiOk,
  MetaRibbon,
  MetaItem,
  MetaSync,
  SectionCard,
  EmptyState,
  StepList,
  StepItem,
  InsightStrip,
  FooterNote,
} from "@/components/layout"

import { QuestionsSection } from "../[projectId]/questions/components"
import { DocumentsSection } from "./documents-section"
import { TeamSection } from "./team-section"

interface ProjectSummary {
  id: string
  name: string
  description?: string | null
  summary?: string | null
  createdAt: string
  updatedAt: string
}

function ProjectContentInner({ projectId }: { projectId: string }) {
  const [activeSection] = useState("overview")
  const searchParams = useSearchParams()
  const orgId = searchParams.get("orgId")

  switch (activeSection) {
    case "questions":
      return (
        <div className="container py-6">
          <QuestionsSection projectId={projectId} />
        </div>
      )
    case "documents":
      return (
        <div className="container py-6">
          <DocumentsSection />
        </div>
      )
    case "team":
      return (
        <div className="container py-6">
          <TeamSection />
        </div>
      )
    case "overview":
    default:
      return <ProjectOverviewShell projectId={projectId} orgId={orgId} />
  }
}

export function ProjectContent({ projectId }: { projectId: string }) {
  return (
    <Suspense fallback={<ProjectContentFallback />}>
      <ProjectContentInner projectId={projectId} />
    </Suspense>
  )
}

function ProjectContentFallback() {
  return (
    <div className="mx-auto max-w-[1240px] px-10 py-8">
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse bg-muted rounded" />
        <div className="h-32 animate-pulse bg-muted rounded" />
        <div className="h-64 animate-pulse bg-muted rounded" />
      </div>
    </div>
  )
}

interface ShellProps {
  projectId: string
  orgId: string | null
}

function ProjectOverviewShell({ projectId, orgId }: ShellProps) {
  const { project, rfpDocument, loading, error } = useProjectData(projectId)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const { refreshData } = useOrganization()

  const metrics = useMemo(() => deriveMetrics(rfpDocument), [rfpDocument])

  const handleDeleteProject = async () => {
    if (!project) return
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/projects/${projectId}`, { method: "DELETE" })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete project")
      }
      toast({
        title: "Success",
        description: `Project "${project.name}" has been deleted successfully.`,
      })
      setShowDeleteDialog(false)
      await refreshData()
      router.push(orgId ? `/organizations/${orgId}` : "/organizations")
    } catch (err) {
      console.error("Error deleting project:", err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to delete project",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return <ProjectContentFallback />
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-[1240px] px-10 py-8">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          {error ?? "The requested project could not be found."}
        </div>
      </div>
    )
  }

  const updatedRelative = formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })
  const createdFormatted = format(new Date(project.createdAt), "MMM d, yyyy")

  return (
    <div className="mx-auto w-full max-w-[1240px] px-10 py-8">
      <PageHeader
        eyebrow="Project"
        title={project.name}
        sub={
          project.description ||
          "Intelligent project workspace. Upload source material and let Panamoure draft, match, and refine RFP responses in your brand voice."
        }
        pills={
          <>
            <StatusPill dot={metrics.unanswered === 0 && metrics.totalQuestions > 0 ? "green" : "muted"}>
              {metrics.totalQuestions === 0
                ? "Awaiting input"
                : metrics.unanswered === 0
                  ? "All complete"
                  : `${metrics.answeredQuestions}/${metrics.totalQuestions} answered`}
            </StatusPill>
            <StatusPill
              variant="ghost"
              dot="none"
              icon={<Clock className="w-3.5 h-3.5" strokeWidth={2} />}
            >
              Updated {updatedRelative}
            </StatusPill>
          </>
        }
        actions={
          <>
            <Button variant="outline" size="sm">
              <Share2 className="w-3.5 h-3.5" strokeWidth={2} />
              Share
            </Button>
            <Button
              size="sm"
              className="bg-[color:var(--pam-blue)] text-white hover:bg-[color:var(--pam-blue-2)]"
              onClick={() =>
                router.push(
                  `/projects/${projectId}/questions/create${orgId ? `?orgId=${orgId}` : ""}`,
                )
              }
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2.2} />
              New question
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="text-muted-foreground hover:text-[color:var(--pam-pink-ink)] hover:bg-[color:var(--pam-pink-soft)]"
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
              Delete
            </Button>
          </>
        }
      />

      <KpiBand>
        <KpiCell
          label="Completion"
          value={
            <>
              {metrics.completionPercentage}
              <KpiOf>%</KpiOf>
            </>
          }
          progress={metrics.completionPercentage}
          foot={
            metrics.totalQuestions === 0 ? (
              <>Nothing outstanding yet</>
            ) : metrics.unanswered === 0 ? (
              <>
                <KpiOk>All complete</KpiOk> · nothing outstanding
              </>
            ) : (
              <>{metrics.unanswered} still to answer</>
            )
          }
        />
        <KpiCell
          label="Questions"
          value={
            <>
              {metrics.answeredQuestions}
              <KpiOf>/ {metrics.totalQuestions}</KpiOf>
            </>
          }
          progress={metrics.completionPercentage}
          foot={metrics.totalQuestions === 0 ? "No questions yet" : "Answered so far"}
        />
        <KpiCell
          label="Sections"
          value={metrics.totalSections}
          progress={metrics.totalSections > 0 ? 100 : 0}
          foot={metrics.totalSections === 0 ? "Ready for structure" : "Structured"}
        />
        <KpiCell
          label="Documents"
          value={metrics.totalDocuments}
          progress={metrics.totalDocuments > 0 ? 100 : 0}
          foot={metrics.totalDocuments === 0 ? "Upload to begin" : "In library"}
        />
      </KpiBand>

      <MetaRibbon>
        <MetaItem icon={<Calendar className="w-[15px] h-[15px]" />} label="Created" value={createdFormatted} />
        <MetaItem icon={<Clock className="w-[15px] h-[15px]" />} label="Updated" value={updatedRelative} />
        <MetaItem icon={<User className="w-[15px] h-[15px]" />} label="Owner" value={ownerLabel(project)} />
        <MetaItem
          icon={<Box className="w-[15px] h-[15px]" />}
          label="ID"
          value={`${project.id.slice(0, 12)}…`}
          mono
        />
        <MetaSync>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
            Sync
          </Button>
        </MetaSync>
      </MetaRibbon>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr] items-start">
        <SectionCard
          title="Recent activity"
          actions={
            <>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                <Send className="w-[15px] h-[15px]" strokeWidth={2} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground">
                <RotateCcw className="w-[15px] h-[15px]" strokeWidth={2} />
              </Button>
            </>
          }
          padded={false}
        >
          <EmptyState
            icon={<FileText />}
            title="No activity yet"
            description="Questions answered and documents processed will appear here with timestamps, authors, and confidence scores."
            actions={
              <>
                <Button
                  size="sm"
                  className="bg-[color:var(--pam-blue)] text-white hover:bg-[color:var(--pam-blue-2)]"
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/documents${orgId ? `?orgId=${orgId}` : ""}`,
                    )
                  }
                >
                  Upload documents
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/projects/${projectId}/questions/create${orgId ? `?orgId=${orgId}` : ""}`,
                    )
                  }
                >
                  Add question
                </Button>
              </>
            }
          />
        </SectionCard>

        <SectionCard
          title="Get started"
          actions={
            <span className="text-[12px] font-semibold text-muted-foreground">4 steps</span>
          }
          padded={false}
        >
          <div className="px-3 py-2">
            <StepList>
              <StepItem
                number={1}
                title="Upload RFP document"
                description="Drop in a PDF or Word file — Panamoure will extract questions automatically."
                href={`/projects/${projectId}/documents${orgId ? `?orgId=${orgId}` : ""}`}
              />
              <StepItem
                number={2}
                title="Connect knowledge base"
                description="Pair this project with your answer library for instant drafting."
                href={orgId ? `/organizations/${orgId}/knowledge-base` : "/organizations"}
              />
              <StepItem
                number={3}
                title="Build question set"
                description="Add sections and questions manually, or import from CSV."
                href={`/projects/${projectId}/questions${orgId ? `?orgId=${orgId}` : ""}`}
              />
              <StepItem
                number={4}
                title="Invite collaborators"
                description="Assign reviewers and SMEs to keep responses accurate."
                href={orgId ? `/organizations/${orgId}/team` : "/organizations"}
              />
            </StepList>
          </div>
          <div className="px-7 pb-7">
            <InsightStrip title="Panamoure AI ready">
              Once a document is uploaded, AI will auto-detect sections, extract questions and
              surface the three most-confident answers per question — drafted in your brand voice.
            </InsightStrip>
          </div>
        </SectionCard>
      </div>

      <FooterNote />

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        description="This will permanently delete the project and all its associated data."
        itemName={project.name}
        isLoading={isDeleting}
      />
    </div>
  )
}

interface ProjectDataState {
  project: ProjectSummary | null
  rfpDocument: RfpDocument | null
  loading: boolean
  error: string | null
}

function useProjectData(projectId: string): ProjectDataState {
  const [state, setState] = useState<ProjectDataState>({
    project: null,
    rfpDocument: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setState((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const projectResponse = await fetch(`/api/projects/${projectId}`)
        if (!projectResponse.ok) throw new Error("Failed to fetch project details")
        const projectData = (await projectResponse.json()) as ProjectSummary

        const rfpResponse = await fetch(`/api/questions/${projectId}`)
        if (!rfpResponse.ok) throw new Error("Failed to fetch RFP questions")
        const rfpData = (await rfpResponse.json()) as RfpDocument

        if (!cancelled) {
          setState({ project: projectData, rfpDocument: rfpData, loading: false, error: null })
        }
      } catch (err) {
        console.error("Error fetching project data:", err)
        if (!cancelled) {
          setState({
            project: null,
            rfpDocument: null,
            loading: false,
            error: "Failed to load project data",
          })
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [projectId])

  return state
}

interface Metrics {
  totalQuestions: number
  answeredQuestions: number
  unanswered: number
  completionPercentage: number
  totalSections: number
  totalDocuments: number
}

function deriveMetrics(rfpDocument: RfpDocument | null): Metrics {
  if (!rfpDocument) {
    return {
      totalQuestions: 0,
      answeredQuestions: 0,
      unanswered: 0,
      completionPercentage: 0,
      totalSections: 0,
      totalDocuments: 0,
    }
  }
  const totalQuestions = rfpDocument.sections.reduce((sum, s) => sum + s.questions.length, 0)
  const answeredQuestions = rfpDocument.sections.reduce(
    (sum, s) => sum + s.questions.filter((q) => q.answer).length,
    0,
  )
  const completionPercentage =
    totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  const documentsField = (rfpDocument as unknown as { documents?: unknown[] }).documents
  const totalDocuments = Array.isArray(documentsField) ? documentsField.length : 0
  return {
    totalQuestions,
    answeredQuestions,
    unanswered: totalQuestions - answeredQuestions,
    completionPercentage,
    totalSections: rfpDocument.sections.length,
    totalDocuments,
  }
}

function ownerLabel(project: ProjectSummary): string {
  const owner = (project as unknown as { owner?: { name?: string; email?: string } }).owner
  if (owner?.name) return owner.name
  if (owner?.email) return owner.email.split("@")[0] ?? owner.email
  return "—"
}

