import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { organizationService } from '@/lib/organization-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const [currentUser, project] = await Promise.all([
      organizationService.getCurrentUser(),
      db.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          organizationId: true,
          summary: true,
          _count: {
            select: {
              questions: true,
              projectIndexes: true,
            },
          },
          questions: {
            select: { topic: true },
          },
        },
      }),
    ]);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const isMember = await organizationService.isUserOrganizationMember(
      currentUser.id,
      project.organizationId,
    );
    if (!isMember) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sectionCount = new Set(project.questions.map((q) => q.topic)).size;
    const hasSourceRfp = project.summary !== null && project.summary !== '';

    return NextResponse.json({
      questionCount: project._count.questions,
      sectionCount,
      indexCount: project._count.projectIndexes,
      hasSourceRfp,
      documentCount: project._count.projectIndexes + (hasSourceRfp ? 1 : 0),
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project stats' },
      { status: 500 },
    );
  }
}
