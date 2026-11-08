import type { IconName } from "@reactive-resume/ui/components/icon";

export type ProjectLink = { href: string; label: string; icon: IconName };

/**
 * The project's own pages, under Settings on desktop and as rows on the phone's Settings root.
 *
 * Upstream lists its docs site, repository, translation project, issue tracker and donation page here. None of those
 * exist for this build, and pointing a reader at a repository or a donation page is worse than showing nothing, so the
 * list is empty until there are pages of our own. Both callers skip the section when it is empty.
 */
export const getProjectLinks = (): ProjectLink[] => [];
