type MatchRole = {
  title: string;
  roleFamily: string;
  summary: string | null;
  requirements: string[];
  responsibilities: string[];
};

type MatchProject = {
  id: string;
  name: string;
  summary: string;
  stack: string[];
  relevanceTags: string[];
  interviewStory: string;
  caveats: string[];
};

export type PortfolioMatch = {
  project: MatchProject;
  matchedTags: string[];
  pitch: string;
  technicalAngle: string;
  stakeholderAngle: string;
  objections: string[];
};

export function matchProjectsToRole(role: MatchRole, projects: MatchProject[], limit = 3): PortfolioMatch[] {
  const roleText = [role.title, role.roleFamily, role.summary ?? "", ...role.requirements, ...role.responsibilities].join(" ").toLowerCase();

  return projects
    .map((project) => {
      const matchedTags = project.relevanceTags.filter((tag) => roleText.includes(tag.toLowerCase()));
      return {
        project,
        matchedTags,
        pitch: `${project.name}: ${project.summary}`,
        technicalAngle: project.stack.length ? `Technical angle: ${project.stack.join(", ")}.` : "Technical angle: Review the project details manually.",
        stakeholderAngle: `Stakeholder angle: ${project.interviewStory}`,
        objections: project.caveats
      };
    })
    .sort((left, right) => right.matchedTags.length - left.matchedTags.length || left.project.name.localeCompare(right.project.name) || left.project.id.localeCompare(right.project.id))
    .slice(0, limit);
}
