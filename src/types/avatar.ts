/**
 * avatar.ts
 * ─────────────────────────────────────────────────────────────────
 * Type Definitions for Onee Avatar Animations, Expressions, and Imperative Handles
 *
 * Project: AttentionIsAllYouNeed
 * Author: Mohammad Fayas Khan (B.Tech CSE AI/ML student at LPU)
 *
 * Architecture:
 *   - `VALID_ANIMATIONS`: Procedural states (idle, listening, thinking, working, celebrate, etc.)
 *     governing bodily micro-motions and gaze patterns.
 *   - `VALID_EXPRESSIONS`: Facial expression variants mapped to SVG eye shapes and eyebrow angles.
 *   - `AvatarRefHandle`: Imperative ref interface exposing `.play()`, `.setExpression()`, `.stop()`,
 *     allowing UI events (quiz right/wrong, slider scrubbing, token click) to trigger live reactions.
 */

export const VALID_ANIMATIONS = [
  'sleeping',
  'waking',
  'idle',
  'listening',
  'thinking',
  'searching',
  'working',
  'excited',
  'bored',
  'suspicious',
  'angry',
  'drowsy',
  'happy',
  'curious',
  'confused',
  'surprised',
  'proud',
  'shy',
  'sad',
  'laughing',
  'scared',
  'playful',
  'celebrate'
] as const;

export const VALID_EXPRESSIONS = [
  'neutral',
  'upward-side-glance',
  'downward-gaze',
  'skeptical-right',
  'small-attentive',
  'wide-downward-gaze',
  'surprised-left',
  'sleepy-squint',
  'angry-right',
  'curious-left',
  'asymmetric-down-right',
  'attentive-left',
  'joyful-wide',
  'eyes-closed',
  'joyful-down-right',
  'skeptical-left',
  'far-right-glance',
  'angry-left',
  'playful-right',
  'asymmetric-up-left',
  'gentle-downward-gaze',
  'wide-down-left',
  'surprised-wide-left',
  'drowsy-closed',
  'suspicious-right',
  'shy-downward',
  'angry-brows',
  'uneasy-left'
] as const;

export type AnimationKey = typeof VALID_ANIMATIONS[number];
export type ExpressionKey = typeof VALID_EXPRESSIONS[number];

export interface AvatarRefHandle {
  play: (animation: AnimationKey | string, autoReturnIdleMs?: number) => void;
  setExpression: (expression: ExpressionKey | string) => void;
  stop: () => void;
  getState: () => any;
}
