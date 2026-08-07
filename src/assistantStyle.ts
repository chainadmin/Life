import { AssistantPersonality, ResponseLength } from './types';

export const PERSONALITIES: { value: AssistantPersonality; label: string; description: string }[] = [
  { value: 'friendly', label: 'Friendly', description: 'Warm, casual, and easy to talk to.' },
  { value: 'calm', label: 'Calm', description: 'Measured, reassuring, and low-pressure.' },
  { value: 'direct', label: 'Direct', description: 'Straight to the point with minimal extra explanation.' },
  { value: 'encouraging', label: 'Encouraging', description: 'Positive and motivating without being overly enthusiastic.' },
  { value: 'professional', label: 'Professional', description: 'Polished, organized, and businesslike.' },
  { value: 'playful', label: 'Playful', description: 'Lighthearted and conversational, while still useful.' },
];
export const RESPONSE_LENGTHS: { value: ResponseLength; label: string }[] = [
  { value: 'short', label: 'Short' }, { value: 'normal', label: 'Normal' }, { value: 'detailed', label: 'Detailed' },
];

export function assistantStylePreview(personality: AssistantPersonality) {
  const previews: Record<AssistantPersonality, string> = {
    friendly: 'You’ve got three tasks left today. Let’s take them one at a time.',
    calm: 'You have three tasks left today. There’s still time to work through them steadily.',
    direct: 'Three tasks left today.',
    encouraging: 'You have three tasks left today. Start with one manageable next step.',
    professional: 'You have three remaining tasks scheduled for today.',
    playful: 'Three tasks left today—time to give that list a little trim.',
  };
  return previews[personality];
}
