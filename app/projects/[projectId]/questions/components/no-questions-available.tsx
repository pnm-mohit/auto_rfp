"use client"

import { useRouter } from "next/navigation"
import { ExternalLink, FileText, Plus, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/layout"

interface NoQuestionsAvailableProps {
  projectId: string
  onUploadClick?: () => void
}

const SAMPLE_FILE_URL =
  "https://qluspotebpidccpfbdho.supabase.co/storage/v1/object/public/sample-files//RFP%20-%20Launch%20Services%20for%20Medium-Lift%20Payloads.pdf"

export function NoQuestionsAvailable({ projectId, onUploadClick }: NoQuestionsAvailableProps) {
  const router = useRouter()

  const handleUploadClick = () => {
    if (onUploadClick) {
      onUploadClick()
    } else {
      router.push(`/upload?projectId=${projectId}`)
    }
  }

  const handleAddManuallyClick = () => {
    router.push(`/projects/${projectId}/questions/create`)
  }

  return (
    <EmptyState
      icon={<FileText />}
      title="No questions available"
      description="Upload an RFP and Panamoure RFP agent will extract questions automatically — or add them manually to get started."
      actions={
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={handleUploadClick} className="gap-1.5">
              <Upload className="h-4 w-4" />
              Upload documents
            </Button>
            <Button variant="outline" onClick={handleAddManuallyClick} className="gap-1.5">
              <Plus className="h-4 w-4" />
              Add manually
            </Button>
          </div>
          <a
            href={SAMPLE_FILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[12.5px] text-[color:var(--pam-blue)] hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            Sample RFP — Launch Services for Medium-Lift Payloads
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      }
    />
  )
}
