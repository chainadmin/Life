export const assistantPersonalities = ['friendly', 'calm', 'direct', 'encouraging', 'professional', 'playful'] as const;
export const responseLengths = ['short', 'normal', 'detailed'] as const;
export type AssistantPersonality = typeof assistantPersonalities[number];
export type ResponseLength = typeof responseLengths[number];
export type AssistantStyleProfile = { assistant_personality?: AssistantPersonality | null; response_length?: ResponseLength | null };

const personalityInstructions: Record<AssistantPersonality, string[]> = {
  friendly: ['Be conversational and approachable.', 'Use occasional contractions.', 'Be warm, but not overly enthusiastic.'],
  calm: ['Use a steady, neutral, and reassuring tone.', 'Avoid alarmist or pressuring wording.'],
  direct: ['Answer first with minimal preamble.', 'Use short, actionable wording.'],
  encouraging: ['Be supportive and focus on achievable next steps.', 'Avoid exaggerated praise or enthusiasm.'],
  professional: ['Use polished, structured, concise, business-appropriate language.'],
  playful: ['Use a casual tone and light humor only when appropriate.', 'Never joke about sensitive topics, finances, health, legal matters, safety, or emergencies.'],
};
const lengthInstructions: Record<ResponseLength, string> = {
  short: 'Keep the answer concise.', normal: 'Use a moderate amount of useful detail.', detailed: 'Give a thorough answer with helpful structure, without padding or repetition.',
};

/** Builds communication guidance only; safety, truth, privacy, and calculations are explicitly invariant. */
export function buildAssistantStylePrompt(profile?: AssistantStyleProfile | null) {
  const personality = profile?.assistant_personality || 'friendly';
  const responseLength = profile?.response_length || 'normal';
  const instructions = [
    'Use clear everyday language.', ...personalityInstructions[personality], lengthInstructions[responseLength],
    'Vary phrasing and avoid repetitive catchphrases.',
    'Personality controls communication style only. Do not alter facts, calculations, recommendations, privacy behavior, or safety rules based on personality.',
    'Never invent information or personal details.',
    'For financial, health, legal, safety, or other high-stakes topics, factual caution and clear uncertainty take priority over personality and response-length preferences.',
  ];
  return `Assistant personality: ${personality.toUpperCase()}\nResponse length: ${responseLength.toUpperCase()}\n\nStyle instructions:\n${instructions.map(x => `- ${x}`).join('\n')}`;
}
