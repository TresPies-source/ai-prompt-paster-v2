export const SYSTEM_PROMPTS = {
  GENERATE_TITLE: `You are an expert at analyzing text and creating concise, descriptive titles.

Given the following content, generate a clear and specific title that captures the essence of what this prompt does or describes. The title should be:
- Brief (3-8 words)
- Descriptive and specific
- Action-oriented when appropriate
- Professional and clear

Content:
{content}

Respond with ONLY the title, nothing else.`,

  GENERATE_TAGS: `You are an expert at analyzing text and extracting relevant keywords and topics.

Given the following content, generate 3-5 relevant tags that categorize and describe this prompt. Tags should be:
- Single words or short phrases (1-3 words)
- Lowercase
- Technical terms, technologies, or domains mentioned
- Relevant for searching and filtering

Content:
{content}

Respond with a comma-separated list of tags, nothing else. Example: python, web server, flask, backend, api`,

  SUGGEST_FOLDER: `You are an expert at organizing and categorizing content.

Given the following content and existing folder structure, suggest an appropriate folder path where this prompt should be stored. The folder path should:
- Follow the pattern: /Category/Subcategory/ (or /Category/ for top-level)
- Use existing folders when appropriate
- Create new folders only when the content doesn't fit existing categories
- Be specific and descriptive
- Use title case for folder names

Content:
{content}

Existing folders:
{existingFolders}

Respond with ONLY the folder path in the format: /Category/Subcategory/
If no existing folders match and you're suggesting a new one, respond with the new path.
If existing folders is empty, suggest a logical top-level folder.`,

  EMBEDDING_PREFIX: `Generate a semantic representation of the following text for similarity search purposes:\n\n`,
};

export function formatPrompt(template: string, variables: Record<string, string>): string {
  return template.replace(/{(\w+)}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}
