'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertCircle,
  Check,
  Database,
  FileText,
  FolderOpen,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import {
  EmptyState,
  KpiBand,
  KpiCell,
  KpiOk,
  KpiWarn,
  PageHeader,
  SectionCard,
  StatusPill,
} from '@/components/layout';
import { cn } from '@/lib/utils';

interface ProjectDocument {
  id: string;
  name: string;
  status: string;
  created_at: string;
  updated_at: string;
  size_bytes?: number;
  indexName: string;
  indexId: string;
  file_type?: string;
}

interface ProjectIndex {
  id: string;
  name: string;
}

interface ProjectDocumentsProps {
  projectId: string;
  refreshKey?: number;
}

interface LlamaCloudFileRecord {
  id?: string;
  name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  file_size?: number;
  file_type?: string;
  pipelineId?: string;
  pipelineName?: string;
}

type FileTone = 'pdf' | 'docx' | 'csv' | 'txt' | 'other';

interface FileTypeStyle {
  tileBg: string;
  tileFg: string;
  label: string;
}

const FILE_TYPE_STYLES: Record<FileTone, FileTypeStyle> = {
  pdf: { tileBg: '#FCE7EB', tileFg: '#8E1625', label: 'PDF' },
  docx: { tileBg: '#E6F0FF', tileFg: '#1B4FB6', label: 'DOC' },
  csv: { tileBg: '#E4F7EF', tileFg: '#0A6A4A', label: 'CSV' },
  txt: { tileBg: '#F3F3F9', tileFg: '#160F44', label: 'TXT' },
  other: { tileBg: '#F3F3F9', tileFg: '#6B6A87', label: 'FILE' },
};

const INITIAL_DOCUMENTS_SHOWN = 6;

function resolveFileTone(fileType: string | undefined): FileTone {
  const type = (fileType || '').toLowerCase();
  if (type === 'pdf') return 'pdf';
  if (type === 'docx' || type === 'doc') return 'docx';
  if (type === 'csv') return 'csv';
  if (type === 'txt' || type === 'text') return 'txt';
  return 'other';
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
}

function relativeTime(dateString: string | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return '—';
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
}

function getFileTypeFromFilename(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const fileTypeMap: Record<string, string> = {
    pdf: 'pdf',
    doc: 'doc',
    docx: 'docx',
    csv: 'csv',
    txt: 'text',
    json: 'json',
  };
  return fileTypeMap[extension] || 'other';
}

interface DocumentCardProps {
  doc: ProjectDocument;
}

function DocumentCard({ doc }: DocumentCardProps) {
  const tone = resolveFileTone(doc.file_type);
  const style = FILE_TYPE_STYLES[tone];
  const status = (doc.status || '').toLowerCase();
  const isComplete = status === 'success' || status === 'completed';
  const isProcessing = status === 'processing' || status === 'in_progress';

  const foot = doc.size_bytes
    ? formatFileSize(doc.size_bytes)
    : isProcessing
      ? 'Ingesting…'
      : doc.file_type === 'csv'
        ? 'Dataset'
        : 'Ready';

  return (
    <article className="rounded-[12px] border border-border bg-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg grid place-items-center text-[11px] font-extrabold shrink-0"
            style={{ backgroundColor: style.tileBg, color: style.tileFg }}
            aria-hidden="true"
          >
            {style.label}
          </div>
          <div
            className="font-bold text-[13.5px] leading-[1.3] text-[color:var(--pam-blue)] truncate"
            title={doc.name}
          >
            {doc.name}
          </div>
        </div>
        {isComplete ? (
          <Badge className="bg-[color:var(--pam-green)]/15 text-[color:var(--pam-green)] border-transparent rounded-full h-5 w-5 p-0 grid place-items-center shrink-0">
            <Check className="!size-3" />
          </Badge>
        ) : isProcessing ? (
          <Badge className="bg-[color:var(--pam-amber)]/12 text-[color:var(--pam-amber)] border-transparent rounded-full px-2 h-5 text-[10px] shrink-0">
            <span className="inline-block w-[7px] h-[7px] rounded-full bg-[color:var(--pam-amber)] mr-1" />
            Processing
          </Badge>
        ) : (
          <Badge variant="outline" className="rounded-full px-2 h-5 text-[10px] shrink-0">
            {doc.status || 'Unknown'}
          </Badge>
        )}
      </div>
      <p className="text-[13px] leading-[1.55] text-muted-foreground line-clamp-2">
        {doc.indexName ? `${doc.indexName} · ` : ''}
        {tone === 'csv' ? 'Structured dataset ingested from the selected index.' : `Source file available to ground answers in this project.`}
      </p>
      <div className="flex items-center justify-between text-[12px] text-muted-foreground pt-3 border-t border-border">
        <span>{formatDate(doc.created_at)}</span>
        <span>{foot}</span>
      </div>
    </article>
  );
}

interface ProjectStats {
  questionCount: number;
  sectionCount: number;
  indexCount: number;
  hasSourceRfp: boolean;
  documentCount: number;
}

function SourceDocumentsCard({ projectId }: { projectId: string }) {
  const { data } = useSWR<ProjectStats>(
    `/api/projects/${projectId}/stats`,
    (url: string) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: true, dedupingInterval: 15000 },
  );

  if (!data?.hasSourceRfp) return null;

  const questionLabel = data.questionCount === 1 ? 'question' : 'questions';
  const sectionLabel = data.sectionCount === 1 ? 'section' : 'sections';

  return (
    <SectionCard title="Source RFP">
      <div className="flex flex-wrap items-center justify-between gap-4 px-1 py-1">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg grid place-items-center text-[11px] font-extrabold bg-[color:var(--pam-pink-soft)] text-[color:var(--pam-pink-ink)] shrink-0"
            aria-hidden="true"
          >
            RFP
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[14px] text-[color:var(--pam-blue)]">
              Uploaded RFP processed
            </div>
            <div className="text-[12.5px] text-muted-foreground">
              {data.questionCount} {questionLabel} extracted across {data.sectionCount}{' '}
              {sectionLabel}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/projects/${projectId}/questions`}>View questions</Link>
        </Button>
      </div>
    </SectionCard>
  );
}

export function ProjectDocuments({ projectId, refreshKey }: ProjectDocumentsProps) {
  const router = useRouter();
  const goToUpload = useCallback(() => {
    router.push(`/upload?projectId=${projectId}`);
  }, [router, projectId]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [projectIndexes, setProjectIndexes] = useState<ProjectIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationConnected, setOrganizationConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [shownDocuments, setShownDocuments] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const fetchProjectDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First get the project indexes
      const indexesResponse = await fetch(`/api/projects/${projectId}/indexes`);

      if (!indexesResponse.ok) {
        const errorData = await indexesResponse.json();
        throw new Error(errorData.error || 'Failed to fetch project indexes');
      }

      const indexesData = await indexesResponse.json();

      if (!indexesData.organizationConnected) {
        setOrganizationConnected(false);
        setProjectIndexes([]);
        setDocuments([]);
        return;
      }

      setOrganizationConnected(true);
      setProjectIndexes(indexesData.currentIndexes || []);

      // If no indexes are selected, show empty state
      if (!indexesData.currentIndexes || indexesData.currentIndexes.length === 0) {
        setDocuments([]);
        return;
      }

      // Get organization ID from project
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error('Failed to fetch project details');
      }
      const projectData = await projectResponse.json();

      // Fetch all organization documents
      const documentsResponse = await fetch(
        `/api/llamacloud/documents?organizationId=${projectData.organizationId}`,
      );

      if (!documentsResponse.ok) {
        const errorData = await documentsResponse.json();
        throw new Error(errorData.error || 'Failed to fetch documents');
      }

      const documentsData = await documentsResponse.json();

      // Filter documents to only include those from selected indexes
      const selectedIndexIds = new Set(
        indexesData.currentIndexes.map((index: ProjectIndex) => index.id),
      );
      const filteredDocuments: ProjectDocument[] = (documentsData.documents || [])
        .filter((doc: LlamaCloudFileRecord) => doc.pipelineId && selectedIndexIds.has(doc.pipelineId))
        .map((doc: LlamaCloudFileRecord) => ({
          id: doc.id ?? `${doc.pipelineId ?? 'doc'}-${doc.name ?? Math.random().toString(36).slice(2)}`,
          indexName: doc.pipelineName ?? 'Unknown index',
          indexId: doc.pipelineId ?? '',
          name: doc.name || 'Unknown',
          status: doc.status || 'unknown',
          created_at: doc.created_at ?? '',
          updated_at: doc.updated_at ?? '',
          size_bytes: doc.file_size,
          file_type: doc.file_type || getFileTypeFromFilename(doc.name || ''),
        }));

      setDocuments(filteredDocuments);

      // Initialize shown documents per index
      if (filteredDocuments.length > 0) {
        const indexNames: string[] = Array.from(
          new Set(filteredDocuments.map((doc: ProjectDocument) => doc.indexName)),
        );
        const initialShown: Record<string, number> = {};
        indexNames.forEach(indexName => {
          initialShown[indexName] = INITIAL_DOCUMENTS_SHOWN;
        });
        setShownDocuments(initialShown);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project documents';
      setError(errorMessage);
      console.error('Error fetching project documents:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDocuments();
  }, [projectId, refreshKey, fetchProjectDocuments]);

  const handleRefresh = () => {
    fetchProjectDocuments();
    toast({
      title: 'Refreshing',
      description: 'Fetching latest documents...',
    });
  };

  const showMoreDocuments = (indexName: string) => {
    setShownDocuments(prev => ({
      ...prev,
      [indexName]: (prev[indexName] || INITIAL_DOCUMENTS_SHOWN) + INITIAL_DOCUMENTS_SHOWN,
    }));
  };

  const showAllDocuments = (indexName: string, totalCount: number) => {
    setShownDocuments(prev => ({
      ...prev,
      [indexName]: totalCount,
    }));
  };

  // Normalise a doc's file type for tab filtering
  const normalizedType = (doc: ProjectDocument): FileTone => resolveFileTone(doc.file_type);

  // Filter documents based on search term and active tab
  const filteredDocuments = useMemo(
    () =>
      documents.filter(doc => {
        const matchesSearch =
          doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.indexName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'all' || normalizedType(doc) === activeTab;
        return matchesSearch && matchesTab;
      }),
    [documents, searchTerm, activeTab],
  );

  // KPI metrics
  const metrics = useMemo(() => {
    const total = documents.length;
    const processing = documents.filter(
      d => (d.status || '').toLowerCase() === 'processing' || (d.status || '').toLowerCase() === 'in_progress',
    );
    const ready = documents.filter(
      d => (d.status || '').toLowerCase() === 'success' || (d.status || '').toLowerCase() === 'completed',
    ).length;
    const pagesIndexed = documents.reduce((sum, d) => sum + (d.size_bytes ? Math.max(1, Math.round((d.size_bytes || 0) / 40000)) : 0), 0);
    const readyPct = total === 0 ? 0 : Math.round((ready / total) * 100);
    const latest = documents
      .map(d => (d.updated_at ? new Date(d.updated_at).getTime() : 0))
      .filter(t => t > 0)
      .sort((a, b) => b - a)[0];
    const lastIngest = latest
      ? relativeTime(new Date(latest).toISOString())
      : '—';
    const indexCount = projectIndexes.length;
    return {
      total,
      processing,
      pagesIndexed,
      readyPct,
      lastIngest,
      indexCount,
    };
  }, [documents, projectIndexes]);

  // File-type counts for filter tab chips
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: documents.length, pdf: 0, docx: 0, csv: 0, txt: 0 };
    documents.forEach(doc => {
      const t = normalizedType(doc);
      if (t in counts) counts[t] += 1;
    });
    return counts;
  }, [documents]);

  // Group filtered documents by index
  const documentsByIndex = useMemo(
    () =>
      filteredDocuments.reduce<Record<string, ProjectDocument[]>>((acc, doc) => {
        if (!acc[doc.indexName]) acc[doc.indexName] = [];
        acc[doc.indexName].push(doc);
        return acc;
      }, {}),
    [filteredDocuments],
  );

  // Page header (shared across all states for consistency)
  const pageHeader = (
    <PageHeader
      eyebrow="Project · Documents"
      title="Documents"
      sub="Every source file ingested into your selected knowledge indexes. Panamoure RFP agent grounds every answer in these documents with inline citations."
      pills={
        <>
          <StatusPill dot={organizationConnected ? 'green' : 'muted'}>
            {organizationConnected ? 'LlamaCloud connected' : 'LlamaCloud not connected'}
          </StatusPill>
          <StatusPill variant="ghost" dot="muted">
            Last ingest {metrics.lastIngest}
          </StatusPill>
        </>
      }
      actions={
        <>
          <div className="relative hidden md:block min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder="Search files or indexes…"
              className="pl-9 h-9"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={cn('mr-1', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button size="sm" onClick={goToUpload}>
            <Upload className="mr-1" />
            Upload
          </Button>
        </>
      }
    />
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {pageHeader}
        <SourceDocumentsCard projectId={projectId} />
        <KpiBand>
          <KpiCell label="Documents" value="—" foot="Loading…" />
          <KpiCell label="Pages indexed" value="—" />
          <KpiCell label="Processing" value="—" />
          <KpiCell label="Last ingest" value="—" />
        </KpiBand>
        <SectionCard title="Loading documents…">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="h-[138px] rounded-[12px] border border-border bg-[color:var(--pam-grey)] animate-pulse"
              />
            ))}
          </div>
        </SectionCard>
      </div>
    );
  }

  if (!organizationConnected) {
    return (
      <div className="space-y-6">
        {pageHeader}
        <SourceDocumentsCard projectId={projectId} />
        <SectionCard title="Knowledge base indexes">
          <EmptyState
            icon={<AlertCircle />}
            title="No LlamaCloud connection"
            description="Your organization needs to be connected to LlamaCloud to access documents."
          />
        </SectionCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        {pageHeader}
        <SourceDocumentsCard projectId={projectId} />
        <SectionCard title="Knowledge base indexes">
          <EmptyState
            icon={<AlertCircle />}
            title="Error loading documents"
            description={error}
            actions={
              <Button variant="outline" size="sm" onClick={fetchProjectDocuments}>
                <RefreshCw className="mr-1" />
                Try again
              </Button>
            }
          />
        </SectionCard>
      </div>
    );
  }

  if (projectIndexes.length === 0) {
    return (
      <div className="space-y-6">
        {pageHeader}
        <SourceDocumentsCard projectId={projectId} />
        <SectionCard title="Knowledge base indexes">
          <EmptyState
            icon={<Database />}
            title="No indexes selected"
            description="Select indexes below to access their documents for this project."
          />
        </SectionCard>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="space-y-6">
        {pageHeader}
        <SourceDocumentsCard projectId={projectId} />
        <KpiBand>
          <KpiCell label="Documents" value={0} foot={`Across ${metrics.indexCount} indexes`} />
          <KpiCell label="Pages indexed" value={0} />
          <KpiCell label="Processing" value={0} />
          <KpiCell
            label="Last ingest"
            value={<span className="text-[28px]">{metrics.lastIngest}</span>}
          />
        </KpiBand>
        <SectionCard title="Knowledge base indexes">
          <EmptyState
            icon={<FolderOpen />}
            title="No documents yet"
            description="No documents were found in the selected indexes. Upload a file to get started."
            actions={
              <Button size="sm" onClick={goToUpload}>
                <Upload className="mr-1" />
                Upload
              </Button>
            }
          />
        </SectionCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pageHeader}
      <SourceDocumentsCard projectId={projectId} />

      <KpiBand>
        <KpiCell
          label="Documents"
          value={metrics.total}
          progress={100}
          foot={`Across ${metrics.indexCount} ${metrics.indexCount === 1 ? 'index' : 'indexes'}`}
        />
        <KpiCell
          label="Pages indexed"
          value={metrics.pagesIndexed.toLocaleString()}
          progress={metrics.readyPct}
          foot={<KpiOk>{metrics.readyPct}% ready</KpiOk>}
        />
        <KpiCell
          label="Processing"
          value={metrics.processing.length}
          progress={metrics.processing.length > 0 ? 40 : 0}
          foot={
            metrics.processing.length > 0 ? (
              <KpiWarn>Ingesting {metrics.processing[0].name}</KpiWarn>
            ) : (
              'All caught up'
            )
          }
        />
        <KpiCell
          label="Last ingest"
          value={<span className="text-[28px]">{metrics.lastIngest}</span>}
          progress={100}
          foot={`ago · ${metrics.total} docs`}
        />
      </KpiBand>

      {/* File-type filter tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">
            All <span className="ml-1 text-muted-foreground text-[11px]">{typeCounts.all}</span>
          </TabsTrigger>
          <TabsTrigger value="pdf">
            PDF <span className="ml-1 text-muted-foreground text-[11px]">{typeCounts.pdf}</span>
          </TabsTrigger>
          <TabsTrigger value="docx">
            DOCX <span className="ml-1 text-muted-foreground text-[11px]">{typeCounts.docx}</span>
          </TabsTrigger>
          <TabsTrigger value="csv">
            CSV <span className="ml-1 text-muted-foreground text-[11px]">{typeCounts.csv}</span>
          </TabsTrigger>
          <TabsTrigger value="txt">
            TXT <span className="ml-1 text-muted-foreground text-[11px]">{typeCounts.txt}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Mobile-only search field (desktop version lives in the page header actions) */}
      <div className="relative md:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
        <Input
          placeholder="Search files or indexes…"
          className="pl-9"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* No filter results */}
      {filteredDocuments.length === 0 ? (
        <SectionCard title="Knowledge base indexes">
          <EmptyState
            icon={<FileText />}
            title="No results for this filter"
            description="Try a different file type or clear the search."
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveTab('all');
                  setSearchTerm('');
                }}
              >
                Clear filters
              </Button>
            }
          />
        </SectionCard>
      ) : (
        Object.entries(documentsByIndex).map(([indexName, indexDocs]) => {
          const shownCount = shownDocuments[indexName] || INITIAL_DOCUMENTS_SHOWN;
          const hasMore = indexDocs.length > shownCount;
          const visibleDocs = indexDocs.slice(0, shownCount);
          const hasProcessing = indexDocs.some(
            d => (d.status || '').toLowerCase() === 'processing' || (d.status || '').toLowerCase() === 'in_progress',
          );

          return (
            <SectionCard
              key={indexName}
              title={indexName}
              actions={
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                    {indexDocs.length} {indexDocs.length === 1 ? 'document' : 'documents'}
                  </Badge>
                  {hasProcessing ? (
                    <Badge className="bg-[color:var(--pam-amber)]/12 text-[color:var(--pam-amber)] border-transparent rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                      Ingesting
                    </Badge>
                  ) : (
                    <Badge className="bg-[color:var(--pam-green)]/15 text-[color:var(--pam-green)] border-transparent rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                      Active
                    </Badge>
                  )}
                </div>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleDocs.map(doc => (
                  <DocumentCard key={doc.id} doc={doc} />
                ))}
              </div>

              {hasMore ? (
                <div className="flex justify-center gap-2 mt-5 pt-5 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => showMoreDocuments(indexName)}>
                    Show {Math.min(INITIAL_DOCUMENTS_SHOWN, indexDocs.length - shownCount)} more
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => showAllDocuments(indexName, indexDocs.length)}>
                    Show all ({indexDocs.length})
                  </Button>
                </div>
              ) : null}
            </SectionCard>
          );
        })
      )}
    </div>
  );
}
