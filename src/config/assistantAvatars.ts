import { Image, ImageSourcePropType } from 'react-native';

export type AssistantAvatar = {
  id: string;
  image: ImageSourcePropType;
  enabled: boolean;
  defaultName?: string;
  tier?: 'free' | 'premium';
};

// Keep this as the single launch catalogue. Future portraits only need one entry
// here after their PNG has been added to assets/assistants.
export const assistantAvatars: AssistantAvatar[] = [
  { id: 'assistant_01', image: require('../assets/assistants/assistant_01.png'), enabled: true, tier: 'free' },
  { id: 'assistant_02', image: require('../assets/assistants/assistant_02.png'), enabled: true, tier: 'free' },
  { id: 'assistant_03', image: require('../assets/assistants/assistant_03.png'), enabled: true, tier: 'free' },
  { id: 'assistant_04', image: require('../assets/assistants/assistant_04.png'), enabled: true, tier: 'free' },
  { id: 'assistant_05', image: require('../assets/assistants/assistant_05.png'), enabled: true, tier: 'free' },
];

export const enabledAssistantAvatars = assistantAvatars.filter(avatar => avatar.enabled);

export function getAssistantAvatar(avatarId?: string | null): ImageSourcePropType {
  return assistantAvatars.find(avatar => avatar.enabled && avatar.id === avatarId)?.image
    ?? assistantAvatars[0].image;
}

export async function preloadAssistantAvatars() {
  await Promise.all(enabledAssistantAvatars.map(avatar => {
    const uri = Image.resolveAssetSource(avatar.image)?.uri;
    return uri ? Image.prefetch(uri).catch(() => false) : Promise.resolve(false);
  }));
}
