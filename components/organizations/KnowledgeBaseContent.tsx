'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  PageHeader,
  StatusPill,
  KpiBand,
  KpiCell,
  KpiOk,
  SectionCard,
  EmptyState,
  FooterNote,
} from '@/components/layout';
import {
  BookOpen,
  ShieldCheck,
  DollarSign,
  Building2,
  Plus,
  Pencil,
  MoreVertical,
  Search,
  Upload,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    questions: number;
  };
}

interface KnowledgeBaseQuestion {
  id: string;
  text: string;
  topic?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  answer?: {
    id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface OrganizationSummary {
  id: string;
  name: string;
}

interface KnowledgeBaseContentProps {
  params: Promise<{
    orgId: string;
  }>;
}

type IconPaletteKey = 'navy' | 'pink' | 'green' | 'amber';

const ICON_PALETTES: Record<IconPaletteKey, { tile: string; icon: string }> = {
  navy: { tile: 'bg-[color:var(--pam-blue)]', icon: 'text-white' },
  pink: { tile: 'bg-[#FCE7EB]', icon: 'text-[#8E1625]' },
  green: { tile: 'bg-[#E4F7EF]', icon: 'text-[#0A6A4A]' },
  amber: { tile: 'bg-[#FDF3E1]', icon: 'text-[#8A5808]' },
};

const PALETTE_ORDER: readonly IconPaletteKey[] = ['navy', 'pink', 'green', 'amber'];

function hashStringToIndex(value: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % modulo;
}

function resolveKbVisual(kb: KnowledgeBase): { palette: IconPaletteKey; Icon: typeof BookOpen } {
  const name = kb.name.toLowerCase();
  if (name.includes('complian') || name.includes('security') || name.includes('legal risk')) {
    return { palette: 'pink', Icon: ShieldCheck };
  }
  if (name.includes('pric') || name.includes('commercial') || name.includes('cost')) {
    return { palette: 'green', Icon: DollarSign };
  }
  if (name.includes('company') || name.includes('corporate') || name.includes('about')) {
    return { palette: 'amber', Icon: Building2 };
  }
  if (name.includes('tech') || name.includes('architect') || name.includes('engineer')) {
    return { palette: 'navy', Icon: BookOpen };
  }
  const palette = PALETTE_ORDER[hashStringToIndex(kb.id || kb.name, PALETTE_ORDER.length)];
  return { palette, Icon: BookOpen };
}

function formatShortDate(value: string | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
}

function formatRelative(value: string | undefined): string {
  if (!value) return 'just now';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return 'just now';
  const diffMs = Date.now() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? '' : 's'} ago`;
}

export function KnowledgeBaseContent({ params }: KnowledgeBaseContentProps) {
  void params;
  const { orgId } = useParams() as { orgId: string };
  const { toast } = useToast();

  const [organization, setOrganization] = useState<OrganizationSummary | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState<KnowledgeBase | null>(null);
  const [questions, setQuestions] = useState<KnowledgeBaseQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [baseSearch, setBaseSearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');

  const [isCreateKBOpen, setIsCreateKBOpen] = useState(false);
  const [isCreateQuestionOpen, setIsCreateQuestionOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<KnowledgeBaseQuestion | null>(null);

  const [kbForm, setKbForm] = useState({ name: '', description: '' });
  const [questionForm, setQuestionForm] = useState({
    text: '',
    topic: '',
    tags: '',
    answer: '',
  });

  const fetchOrganization = useCallback(async () => {
    try {
      const response = await fetch(`/api/organizations/${orgId}`);
      if (response.ok) {
        const data = await response.json();
        setOrganization({ id: data.id, name: data.name });
      }
    } catch (error) {
      console.error('Failed to load organization', error);
    }
  }, [orgId]);

  const fetchKnowledgeBases = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/organizations/${orgId}/knowledge-bases`);
      if (response.ok) {
        const data: KnowledgeBase[] = await response.json();
        setKnowledgeBases(data);
        setSelectedKnowledgeBase((current) => {
          if (current && data.some((kb) => kb.id === current.id)) {
            return current;
          }
          return data[0] ?? null;
        });
      }
    } catch (error) {
      console.error('Failed to load knowledge bases', error);
      toast({
        title: 'Error',
        description: 'Failed to load knowledge bases',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [orgId, toast]);

  const fetchQuestions = useCallback(
    async (kbId: string) => {
      try {
        const response = await fetch(`/api/organizations/${orgId}/knowledge-bases/${kbId}/questions`);
        if (response.ok) {
          const data = await response.json();
          setQuestions(data);
        }
      } catch (error) {
        console.error('Failed to load questions', error);
        toast({
          title: 'Error',
          description: 'Failed to load questions',
          variant: 'destructive',
        });
      }
    },
    [orgId, toast],
  );

  useEffect(() => {
    fetchOrganization();
    fetchKnowledgeBases();
  }, [fetchOrganization, fetchKnowledgeBases]);

  useEffect(() => {
    if (selectedKnowledgeBase) {
      fetchQuestions(selectedKnowledgeBase.id);
    } else {
      setQuestions([]);
    }
  }, [selectedKnowledgeBase, fetchQuestions]);

  const handleCreateKB = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/organizations/${orgId}/knowledge-bases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kbForm),
      });

      if (response.ok) {
        toast({ title: 'Success', description: 'Knowledge base created successfully' });
        setKbForm({ name: '', description: '' });
        setIsCreateKBOpen(false);
        fetchKnowledgeBases();
      }
    } catch (error) {
      console.error('Failed to create knowledge base', error);
      toast({
        title: 'Error',
        description: 'Failed to create knowledge base',
        variant: 'destructive',
      });
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKnowledgeBase) return;

    try {
      const url = editingQuestion
        ? `/api/organizations/${orgId}/knowledge-bases/${selectedKnowledgeBase.id}/questions/${editingQuestion.id}`
        : `/api/organizations/${orgId}/knowledge-bases/${selectedKnowledgeBase.id}/questions`;

      const method = editingQuestion ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...questionForm,
          tags: questionForm.tags.split(',').map((t) => t.trim()).filter((t) => t),
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: editingQuestion ? 'Question updated successfully' : 'Question created successfully',
        });
        setQuestionForm({ text: '', topic: '', tags: '', answer: '' });
        setIsCreateQuestionOpen(false);
        setEditingQuestion(null);
        fetchQuestions(selectedKnowledgeBase.id);
      }
    } catch (error) {
      console.error('Failed to save question', error);
      toast({
        title: 'Error',
        description: 'Failed to save question',
        variant: 'destructive',
      });
    }
  };

  const filteredBases = useMemo(() => {
    const q = baseSearch.trim().toLowerCase();
    if (!q) return knowledgeBases;
    return knowledgeBases.filter(
      (kb) =>
        kb.name.toLowerCase().includes(q) ||
        kb.description?.toLowerCase().includes(q),
    );
  }, [baseSearch, knowledgeBases]);

  const filteredQuestions = useMemo(() => {
    const q = questionSearch.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter(
      (question) =>
        question.text.toLowerCase().includes(q) ||
        question.topic?.toLowerCase().includes(q) ||
        question.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        question.answer?.text.toLowerCase().includes(q),
    );
  }, [questionSearch, questions]);

  const totalQuestions = useMemo(
    () => knowledgeBases.reduce((acc, kb) => acc + (kb._count?.questions ?? 0), 0),
    [knowledgeBases],
  );

  const uniqueTags = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q) => q.tags.forEach((t) => set.add(t)));
    return set.size;
  }, [questions]);

  const latestUpdateIso = useMemo(() => {
    if (knowledgeBases.length === 0) return undefined;
    return knowledgeBases
      .map((kb) => kb.updatedAt)
      .sort()
      .reverse()[0];
  }, [knowledgeBases]);

  const kbNamesSummary = useMemo(
    () => knowledgeBases.slice(0, 4).map((kb) => kb.name).join(' · '),
    [knowledgeBases],
  );

  const orgName = organization?.name ?? 'Organisation';

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1200px] px-10 py-12">
        <div className="space-y-6">
          <div className="h-8 w-1/4 animate-pulse rounded bg-[color:var(--pam-grey)]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-[color:var(--pam-grey)]" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded bg-[color:var(--pam-grey)]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasBases = knowledgeBases.length > 0;

  const headerPills = (
    <>
      <StatusPill dot="green">
        {knowledgeBases.length} {knowledgeBases.length === 1 ? 'base' : 'bases'} · {totalQuestions} Q&amp;A
      </StatusPill>
      <StatusPill variant="ghost" dot="none" icon={<Clock className="w-3.5 h-3.5" />}>
        Last updated {formatRelative(latestUpdateIso)}
      </StatusPill>
    </>
  );

  const headerActions = (
    <>
      <Button variant="outline" size="sm">
        <Upload className="h-3.5 w-3.5" />
        Import
      </Button>
      <Dialog open={isCreateKBOpen} onOpenChange={setIsCreateKBOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Plus className="h-3.5 w-3.5" />
            New knowledge base
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Knowledge Base</DialogTitle>
            <DialogDescription>
              Create a new knowledge base to organise your questions and answers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateKB} className="space-y-4">
            <div>
              <Label htmlFor="kb-name">Name</Label>
              <Input
                id="kb-name"
                value={kbForm.name}
                onChange={(e) => setKbForm({ ...kbForm, name: e.target.value })}
                placeholder="e.g., Technical, Compliance, Pricing"
                required
              />
            </div>
            <div>
              <Label htmlFor="kb-description">Description</Label>
              <Textarea
                id="kb-description"
                value={kbForm.description}
                onChange={(e) => setKbForm({ ...kbForm, description: e.target.value })}
                placeholder="Describe what kinds of questions this base contains"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateKBOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] px-10 py-12">
      <PageHeader
        eyebrow={`Organisation · ${orgName}`}
        title="Knowledge base"
        sub="Your library of reusable questions and answers. Panamoure RFP agent matches RFP questions against these to draft responses in your brand voice with source citations."
        pills={headerPills}
        actions={headerActions}
      />

      <KpiBand>
        <KpiCell
          label="Knowledge bases"
          value={knowledgeBases.length}
          progress={hasBases ? 100 : 0}
          foot={kbNamesSummary || 'No bases yet'}
        />
        <KpiCell
          label="Q&A pairs"
          value={totalQuestions}
          progress={Math.min(100, totalQuestions)}
          foot={<KpiOk>Growing library</KpiOk>}
        />
        <KpiCell
          label="Tags"
          value={uniqueTags}
          progress={Math.min(100, uniqueTags * 3)}
          foot={hasBases ? `Across ${knowledgeBases.length} topics` : 'No tags yet'}
        />
        <KpiCell
          label="Used in drafts"
          value={
            <>
              87<span className="text-[22px] text-white/45 font-semibold ml-1">%</span>
            </>
          }
          progress={87}
          foot={<KpiOk>High re-use</KpiOk>}
        />
      </KpiBand>

      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">
            Overview
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {knowledgeBases.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="questions">
            Questions &amp; answers
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {totalQuestions}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="tags">
            Tags
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {uniqueTags}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="import">Import history</TabsTrigger>
        </TabsList>
      </Tabs>

      {!hasBases ? (
        <SectionCard title="All knowledge bases">
          <EmptyState
            icon={<BookOpen />}
            title="No knowledge bases yet"
            description="Create your first knowledge base to start building your reusable question and answer library."
            actions={
              <Button onClick={() => setIsCreateKBOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Create Knowledge Base
              </Button>
            }
          />
        </SectionCard>
      ) : (
        <>
          <SectionCard
            title="All knowledge bases"
            className="mb-5"
            actions={
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={baseSearch}
                  onChange={(e) => setBaseSearch(e.target.value)}
                  placeholder="Search bases…"
                  className="h-9 w-56 pl-8"
                />
              </div>
            }
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredBases.map((kb) => {
                const { palette, Icon } = resolveKbVisual(kb);
                const tones = ICON_PALETTES[palette];
                const isSelected = selectedKnowledgeBase?.id === kb.id;
                return (
                  <button
                    key={kb.id}
                    type="button"
                    onClick={() => setSelectedKnowledgeBase(kb)}
                    className={cn(
                      'group flex min-h-[180px] flex-col rounded-[12px] border bg-card p-5 text-left transition-all',
                      'hover:border-[color:var(--pam-grey-3)] hover:shadow-sm',
                      isSelected
                        ? 'border-[color:var(--pam-blue)] ring-2 ring-[color:var(--pam-blue)]/10'
                        : 'border-[color:var(--pam-grey-2)]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            'grid h-9 w-9 place-items-center rounded-lg shrink-0',
                            tones.tile,
                          )}
                        >
                          <Icon className={cn('h-[17px] w-[17px]', tones.icon)} />
                        </span>
                        <h3 className="text-[15px] font-bold tracking-[-0.01em] text-foreground truncate">
                          {kb.name}
                        </h3>
                      </div>
                      <Badge variant="outline" className="shrink-0 rounded-md border-[color:var(--pam-grey-2)] bg-[color:var(--pam-grey)]/60 text-[11px] font-semibold">
                        {kb._count?.questions ?? 0} Q&amp;A
                      </Badge>
                    </div>
                    <p className="mt-3 text-[13px] leading-[1.55] text-muted-foreground line-clamp-3">
                      {kb.description || 'No description provided yet.'}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-4 text-[12px] text-muted-foreground">
                      <span>Updated {formatShortDate(kb.updatedAt)}</span>
                      <span>
                        {kb._count?.questions ?? 0} {kb._count?.questions === 1 ? 'tag' : 'tags'}
                      </span>
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCreateKBOpen(true)}
                className="flex min-h-[180px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[color:var(--pam-grey-3)] bg-card p-5 text-center transition-colors hover:bg-[color:var(--pam-grey)]/60"
              >
                <span className="mb-2.5 grid h-10 w-10 place-items-center rounded-[10px] bg-[color:var(--pam-grey)]">
                  <Plus className="h-4.5 w-4.5 text-[color:var(--pam-blue)]" />
                </span>
                <h3 className="text-[14px] font-bold text-foreground">New knowledge base</h3>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  Group Q&amp;A by practice or topic.
                </p>
              </button>
            </div>
          </SectionCard>

          <SectionCard
            title={`${selectedKnowledgeBase?.name ?? 'Knowledge base'} · recent questions`}
            actions={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={questionSearch}
                    onChange={(e) => setQuestionSearch(e.target.value)}
                    placeholder="Search questions…"
                    className="h-9 w-56 pl-8"
                  />
                </div>
                <Dialog open={isCreateQuestionOpen} onOpenChange={setIsCreateQuestionOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!selectedKnowledgeBase}>
                      <Plus className="h-3.5 w-3.5" />
                      Add question
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingQuestion ? 'Edit Question' : 'Add New Question'}
                      </DialogTitle>
                      <DialogDescription>
                        Add a question and its corresponding answer to the knowledge base.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveQuestion} className="space-y-4">
                      <div>
                        <Label htmlFor="question-text">Question</Label>
                        <Textarea
                          id="question-text"
                          value={questionForm.text}
                          onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                          placeholder="Enter the question"
                          required
                          rows={3}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="topic">Topic (Optional)</Label>
                          <Input
                            id="topic"
                            value={questionForm.topic}
                            onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                            placeholder="e.g., Technical, Security"
                          />
                        </div>
                        <div>
                          <Label htmlFor="tags">Tags (Optional)</Label>
                          <Input
                            id="tags"
                            value={questionForm.tags}
                            onChange={(e) => setQuestionForm({ ...questionForm, tags: e.target.value })}
                            placeholder="tag1, tag2, tag3"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="answer">Answer</Label>
                        <Textarea
                          id="answer"
                          value={questionForm.answer}
                          onChange={(e) => setQuestionForm({ ...questionForm, answer: e.target.value })}
                          placeholder="Enter the answer"
                          required
                          rows={6}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsCreateQuestionOpen(false);
                            setEditingQuestion(null);
                            setQuestionForm({ text: '', topic: '', tags: '', answer: '' });
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">{editingQuestion ? 'Update' : 'Create'}</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            }
            padded={false}
            bodyClassName="px-7"
          >
            {filteredQuestions.length === 0 ? (
              <EmptyState
                icon={<BookOpen />}
                title={questionSearch ? 'No matching questions' : 'No questions yet'}
                description={
                  questionSearch
                    ? 'Try adjusting your search terms.'
                    : 'Start building your knowledge base by adding questions and answers.'
                }
                actions={
                  !questionSearch && selectedKnowledgeBase ? (
                    <Button onClick={() => setIsCreateQuestionOpen(true)}>
                      <Plus className="h-3.5 w-3.5" />
                      Add question
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ul className="divide-y divide-[color:var(--pam-grey-2)]">
                {filteredQuestions.map((question) => (
                  <li key={question.id} className="flex gap-4 py-4">
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-bold text-[color:var(--pam-blue)]">
                        {question.text}
                      </div>
                      {question.answer?.text ? (
                        <p className="mt-1.5 text-[13px] leading-[1.55] text-muted-foreground line-clamp-3">
                          {question.answer.text}
                        </p>
                      ) : null}
                      {(question.topic || question.tags.length > 0) && (
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {question.topic ? (
                            <Badge
                              variant="outline"
                              className="rounded-md border-[color:var(--pam-grey-2)] bg-[color:var(--pam-grey)]/60 text-[11px] font-semibold"
                            >
                              {question.topic}
                            </Badge>
                          ) : null}
                          {question.tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="rounded-md border-[color:var(--pam-grey-2)] bg-[color:var(--pam-grey)]/60 text-[11px] font-semibold"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Edit question"
                        onClick={() => {
                          setEditingQuestion(question);
                          setQuestionForm({
                            text: question.text,
                            topic: question.topic || '',
                            tags: question.tags.join(', '),
                            answer: question.answer?.text || '',
                          });
                          setIsCreateQuestionOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="More options"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </>
      )}

      <FooterNote />
    </div>
  );
}
