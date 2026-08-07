import assert from 'node:assert/strict';
import test from 'node:test';
import { assistantPersonalities, buildAssistantStylePrompt } from '../assistantStyle.js';

test('buildAssistantStylePrompt includes every selected style and invariant safeguards', () => {
  for (const personality of assistantPersonalities) {
    const prompt = buildAssistantStylePrompt({ assistant_personality: personality, response_length: 'short' });
    assert.match(prompt, new RegExp(`Assistant personality: ${personality.toUpperCase()}`));
    assert.match(prompt, /Response length: SHORT/);
    assert.match(prompt, /Do not alter facts, calculations/);
    assert.match(prompt, /high-stakes topics/);
    assert.match(prompt, /Never invent/);
  }
});

test('playful style prohibits humor for sensitive and high-stakes topics', () => {
  const prompt = buildAssistantStylePrompt({ assistant_personality: 'playful', response_length: 'normal' });
  assert.match(prompt, /Never joke about sensitive topics, finances, health, legal matters, safety, or emergencies/);
});
