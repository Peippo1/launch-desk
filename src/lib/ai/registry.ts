export type PromptDefinition = {
  id: "application-writer";
  version: "v1";
  sourceFile: "prompts/application-writer-v1.md";
  inputContract: "application-writer-input-v1";
  outputContract: "application-draft-output-v1";
};

const promptDefinitions: Record<string, PromptDefinition> = {
  "application-writer:v1": {
    id: "application-writer",
    version: "v1",
    sourceFile: "prompts/application-writer-v1.md",
    inputContract: "application-writer-input-v1",
    outputContract: "application-draft-output-v1",
  },
};

export function getPromptDefinition(id: PromptDefinition["id"], version: PromptDefinition["version"]): PromptDefinition {
  const definition = promptDefinitions[`${id}:${version}`];
  if (!definition) {
    throw new Error(`Unknown prompt definition: ${id}:${version}`);
  }
  return definition;
}
