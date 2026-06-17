"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrganizationProjectSwitcher } from "@/components/organization-project-switcher";
import { useOrganization } from "@/context/organization-context";
import {
  ArrowRight,
  BookOpen,
  Building2,
  FileText,
  FolderOpen,
  Home,
  MessageSquare,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import useSWR from "swr";

interface ProjectStats {
  questionCount: number;
  sectionCount: number;
  indexCount: number;
  hasSourceRfp: boolean;
  documentCount: number;
}

const statsFetcher = (url: string): Promise<ProjectStats> =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`stats ${res.status}`);
    return res.json();
  });

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  count?: number;
}

interface NavGroupDefinition {
  title: string;
  items: NavItem[];
}

function AppSidebar() {
  const pathname = usePathname();
  const { currentProject, currentOrganization } = useOrganization();
  const { data: projectStats } = useSWR<ProjectStats>(
    currentProject?.id ? `/api/projects/${currentProject.id}/stats` : null,
    statsFetcher,
    { revalidateOnFocus: true, dedupingInterval: 15000 },
  );

  // Determine current context based on URL and context
  const getRouteContext = () => {
    // Check if we're in a project-specific route
    if (pathname.includes('/projects/') && currentProject) {
      return {
        type: 'project',
        id: currentProject.id,
        name: currentProject.name,
      };
    }

    // Check if we're in an organization-specific route
    if ((pathname.includes('/org/') || pathname.includes('/organizations/')) && currentOrganization) {
      return {
        type: 'organization',
        id: currentOrganization.id,
        name: currentOrganization.name,
        slug: currentOrganization.slug,
      };
    }

    return { type: 'global' };
  };

  const routeContext = getRouteContext();

  // Extract orgId from URL if we're in org routes
  const getOrgIdFromPath = (): string | null => {
    const orgMatch = pathname.match(/\/org\/([^\/]+)/);
    if (orgMatch) return orgMatch[1];

    const slugMatch = pathname.match(/\/organizations\/([^\/]+)/);
    if (slugMatch) return slugMatch[1];

    return null;
  };

  // Organization-level navigation items
  const getOrganizationNavigationItems = (orgId: string): NavGroupDefinition[] => [
    {
      title: "Organisation",
      items: [
        {
          title: "Projects",
          url: `/organizations/${orgId}`,
          icon: FolderOpen,
        },
        {
          title: "Knowledge Base",
          url: `/organizations/${orgId}/knowledge-base`,
          icon: BookOpen,
        },
        {
          title: "Team",
          url: `/organizations/${orgId}/team`,
          icon: Users,
        },
        {
          title: "Settings",
          url: `/organizations/${orgId}/settings`,
          icon: Settings,
        },
      ],
    },
  ];

  // Project-scoped navigation items
  const getProjectNavigationItems = (projectId: string): NavGroupDefinition[] => [
    {
      title: "Workspace",
      items: [
        {
          title: "Dashboard",
          url: `/projects/${projectId}`,
          icon: Home,
        },
        {
          title: "Questions",
          url: `/projects/${projectId}/questions`,
          icon: MessageSquare,
          count: projectStats?.questionCount ?? 0,
        },
        {
          title: "Documents",
          url: `/projects/${projectId}/documents`,
          icon: FileText,
          count: projectStats?.documentCount ?? 0,
        },
      ],
    },
  ];

  // Get navigation items based on current context
  const getNavigationItems = (): NavGroupDefinition[] => {
    if (routeContext.type === 'project' && currentProject) {
      return getProjectNavigationItems(currentProject.id);
    } else if (routeContext.type === 'organization') {
      const orgId = getOrgIdFromPath();
      if (orgId) {
        return getOrganizationNavigationItems(orgId);
      }
    }
    return [];
  };

  const contextNavigationItems = getNavigationItems();

  const isItemActive = (url: string): boolean => {
    if (pathname === url) return true;
    if (
      url.includes('?') &&
      pathname === url.split('?')[0] &&
      typeof window !== 'undefined' &&
      window.location.search.includes(url.split('?')[1])
    ) {
      return true;
    }
    return false;
  };

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="bg-sidebar border-r border-[color:var(--pam-grey-2)] [&>[data-sidebar=sidebar]]:bg-sidebar"
      style={{ "--sidebar-width": "260px" } as React.CSSProperties}
    >
      <SidebarHeader className="px-4 pt-[22px] pb-0 bg-sidebar">
        <OrganizationProjectSwitcher />
      </SidebarHeader>

      <SidebarContent className="px-4 py-[22px] gap-[22px] overflow-y-auto bg-sidebar">
        {contextNavigationItems.map((group) => (
          <div key={group.title} className="flex flex-col">
            <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground px-3 pb-2.5 group-data-[collapsible=icon]:hidden">
              {group.title}
            </div>
            <SidebarMenu className="gap-[1px]">
              {group.items.map((item) => {
                const active = isItemActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={`relative flex items-center gap-3 px-3 py-2.5 h-auto rounded-lg text-[14px] font-medium transition-colors ${
                        active
                          ? 'bg-[color:var(--pam-grey)] text-foreground font-semibold hover:bg-[color:var(--pam-grey)] hover:text-foreground data-[active=true]:bg-[color:var(--pam-grey)] data-[active=true]:text-foreground data-[active=true]:font-semibold'
                          : 'text-[color:var(--pam-small)] hover:bg-[color:var(--pam-grey)] hover:text-foreground'
                      }`}
                    >
                      <Link href={item.url}>
                        {active && (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-[-16px] top-2 bottom-2 w-[2px] rounded-r-sm bg-[color:var(--pam-pink)] group-data-[collapsible=icon]:hidden"
                          />
                        )}
                        <item.icon
                          className={`w-[17px] h-[17px] shrink-0 ${
                            active
                              ? 'text-foreground'
                              : 'text-muted-foreground group-hover/menu-button:text-foreground'
                          }`}
                        />
                        <span className="flex-1 truncate group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                        {typeof item.count === 'number' && (
                          <span
                            className={`ml-auto text-[11.5px] font-semibold px-2 py-px rounded-full group-data-[collapsible=icon]:hidden ${
                              active
                                ? 'bg-[color:var(--pam-pink)] text-white'
                                : 'bg-[color:var(--pam-grey)] text-muted-foreground'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        ))}

        {/* Context indicator */}
        {routeContext.type === 'global' && (
          <div className="px-1 group-data-[collapsible=icon]:hidden">
            <div className="text-center text-sm text-muted-foreground bg-[color:var(--pam-grey)] rounded-lg p-3">
              <Building2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="font-medium mb-1 text-foreground">No Context Selected</p>
              <p className="text-xs">
                Choose an organization or project to access specific tools
              </p>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 pt-0 bg-sidebar">
        <div className="mt-auto p-4 rounded-[10px] bg-[color:var(--pam-grey)] group-data-[collapsible=icon]:hidden">
          <h4 className="text-[13.5px] font-bold text-foreground">Need a template?</h4>
          <p className="text-[12.5px] text-muted-foreground mt-1 leading-[1.5]">
            Start from one of 40+ Panamoure RFP templates curated by our consultants.
          </p>
          <Link
            href="/help"
            className="inline-flex items-center gap-1.5 mt-2.5 text-[13px] font-semibold text-foreground hover:text-[color:var(--pam-pink)] transition-colors"
          >
            Browse templates
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />

        {/* Main content area with independent scrolling */}
        <SidebarInset className="flex-1 flex flex-col overflow-hidden">
          {/* Compact inner header just to host the sidebar trigger */}
          <header className="flex h-10 shrink-0 items-center border-b border-border bg-background transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-10">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
            </div>
          </header>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
