type DigestRole = {
  title: string;
  company: { name: string };
  scores: Array<{ overall: number; humanOverride: number | null }>;
};

type DigestApplication = {
  nextAction: string | null;
  role: { company: { name: string } };
};

export function renderDigest(input: {
  generatedAt: Date;
  roles: DigestRole[];
  applications: DigestApplication[];
}) {
  const highFit = input.roles
    .map((role) => ({ role, score: role.scores[0]?.humanOverride ?? role.scores[0]?.overall ?? 0 }))
    .filter(({ score }) => score >= 68)
    .sort((left, right) => right.score - left.score);

  const lines = [
    "# Nereid Scout Daily Digest",
    "",
    `Generated: ${input.generatedAt.toLocaleDateString("en-GB")}`,
    "",
    "## High-fit roles",
    ...highFit.slice(0, 10).map(({ role, score }) => `- **${role.title}** at ${role.company.name} (${score})`),
    "",
    "## Follow-ups due",
    ...(input.applications.length ? input.applications.map((application) => `- ${application.role.company.name}: ${application.nextAction ?? "Follow up"}`) : ["- None due."]),
    "",
    "## Top actions",
    ...highFit.slice(0, 5).map(({ role }) => `- Review ${role.title} at ${role.company.name}.`)
  ];

  return {
    content: lines.join("\n"),
    inputCounts: { roles: input.roles.length, highFit: highFit.length, followUps: input.applications.length }
  };
}
