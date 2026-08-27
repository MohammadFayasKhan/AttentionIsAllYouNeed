/**
 * oneeEvents.ts
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * OneeEventBridge is a decoupled Publish-Subscribe event bus that connects user actions
 * across any component (chapter scroll, difficulty toggle, quiz answer, flashcard flip,
 * slider interaction, token selection) to Onee's live procedural avatar reactions.
 *
 * Event Flow:
 *   1. An interactive component emits an event:
 *        `oneeBridge.emit('token_select', '“Inspecting attention weights for token!”');`
 *   2. The bridge translates the event type into an `AnimationKey` and `ExpressionKey`,
 *      assigns a dynamic caption, and sets an auto-idle restoration timer for one-shot events.
 *   3. All subscribed avatar stages (`LivingOneeStage`, `SpatialScene`, `FullOneeOverlay`)
 *      receive the reaction and update their 3D avatars with smooth transitions.
 */

import { ExpressionKey, AnimationKey } from '../types/avatar';

export type OneeEventType =
  | 'chapter_change'
  | 'difficulty_change'
  | 'assistant_open'
  | 'assistant_close'
  | 'chat_thinking'
  | 'chat_responding'
  | 'chat_complete'
  | 'flashcard_open'
  | 'flashcard_flip'
  | 'quiz_open'
  | 'quiz_correct'
  | 'quiz_incorrect'
  | 'quiz_complete'
  | 'notebook_open'
  | 'notebook_plate_change'
  | 'notebook_drag'
  | 'token_select'
  | 'head_select'
  | 'slider_change'
  | 'avatar_hover'
  | 'avatar_tap'
  | 'idle';

export interface OneeReaction {
  animation: AnimationKey;
  expression: ExpressionKey;
  caption?: string;
  autoIdleDelayMs?: number;
}

type OneeEventListener = (reaction: OneeReaction, eventType: OneeEventType) => void;

class OneeEventBridge {
  private listeners: Set<OneeEventListener> = new Set();

  public subscribe(listener: OneeEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public emit(eventType: OneeEventType, customCaption?: string, customAnim?: AnimationKey, customExpr?: ExpressionKey) {
    const reaction = this.getReactionForEvent(eventType, customCaption, customAnim, customExpr);
    this.listeners.forEach((listener) => listener(reaction, eventType));
  }

  private getReactionForEvent(
    eventType: OneeEventType,
    customCaption?: string,
    customAnim?: AnimationKey,
    customExpr?: ExpressionKey
  ): OneeReaction {
    if (customAnim) {
      return {
        animation: customAnim,
        expression: customExpr || (customAnim === 'thinking' ? 'upward-side-glance' : customAnim === 'working' ? 'attentive-left' : 'curious-left'),
        caption: customCaption,
        autoIdleDelayMs: (customAnim === 'thinking' || customAnim === 'working' || customAnim === 'listening') ? 0 : 3500
      };
    }

    switch (eventType) {
      case 'assistant_open':
        return {
          animation: 'listening',
          expression: 'attentive-left',
          caption: customCaption || '“Ask me anything about Attention Is All You Need!”',
          autoIdleDelayMs: 0
        };
      case 'assistant_close':
        return {
          animation: 'idle',
          expression: 'neutral',
          caption: customCaption || '“Returning to paper overview.”',
          autoIdleDelayMs: 0
        };
      case 'chat_thinking':
        return {
          animation: 'thinking',
          expression: customExpr || 'upward-side-glance',
          caption: customCaption || '“Formulating paper explanation...”',
          autoIdleDelayMs: 0 // Continuous thinking state until streaming begins
        };
      case 'chat_responding':
        return {
          animation: 'working',
          expression: customExpr || 'attentive-left',
          caption: customCaption || '“Streaming grounded response...”',
          autoIdleDelayMs: 0 // Continuous working state until streaming completes
        };
      case 'chat_complete':
        return {
          animation: 'happy',
          expression: 'joyful-wide',
          caption: customCaption || '“Hope that clarifies the equation!”',
          autoIdleDelayMs: 4000
        };
      case 'difficulty_change':
        return {
          animation: 'curious',
          expression: 'curious-left',
          caption: customCaption || '“Explanation depth updated!”',
          autoIdleDelayMs: 3500
        };
      case 'chapter_change':
        return {
          animation: 'curious',
          expression: 'curious-left',
          caption: customCaption || '“New chapter loaded!”',
          autoIdleDelayMs: 4000
        };
      case 'flashcard_open':
        return {
          animation: 'searching',
          expression: 'attentive-left',
          caption: customCaption || '“3D Flashcards active: test your memory!”',
          autoIdleDelayMs: 4000
        };
      case 'flashcard_flip':
        return {
          animation: 'playful',
          expression: 'attentive-left',
          caption: customCaption || '“Card flipped! Inspecting concept definition.”',
          autoIdleDelayMs: 3000
        };
      case 'quiz_open':
        return {
          animation: 'listening',
          expression: 'attentive-left',
          caption: customCaption || '“Paper comprehension quiz initiated!”',
          autoIdleDelayMs: 4000
        };
      case 'quiz_correct':
        return {
          animation: 'celebrate',
          expression: 'joyful-wide',
          caption: customCaption || '“Spot on! Correct answer 🎉”',
          autoIdleDelayMs: 3500
        };
      case 'quiz_incorrect':
        return {
          animation: 'confused',
          expression: 'skeptical-left',
          caption: customCaption || '“Not quite! Check the explanation below.”',
          autoIdleDelayMs: 3500
        };
      case 'quiz_complete':
        return {
          animation: 'celebrate',
          expression: 'joyful-wide',
          caption: customCaption || '“Quiz completed! Great job reviewing the paper!”',
          autoIdleDelayMs: 5000
        };
      case 'notebook_open':
      case 'notebook_plate_change':
        return {
          animation: 'searching',
          expression: 'surprised-left',
          caption: customCaption || '“Inspecting 3D research paper plate!”',
          autoIdleDelayMs: 3500
        };
      case 'notebook_drag':
        return {
          animation: 'working',
          expression: 'small-attentive',
          caption: customCaption || '“Rotating 3D perspective notebook!”',
          autoIdleDelayMs: 2500
        };
      case 'token_select':
        return {
          animation: 'listening',
          expression: 'attentive-left',
          caption: customCaption || '“Inspecting attention weights for token!”',
          autoIdleDelayMs: 3000
        };
      case 'head_select':
        return {
          animation: 'thinking',
          expression: 'upward-side-glance',
          caption: customCaption || '“Isolating 64-dimensional subspace!”',
          autoIdleDelayMs: 3000
        };
      case 'slider_change':
        return {
          animation: 'working',
          expression: 'small-attentive',
          caption: customCaption || '“Recalculating sinusoidal wave frequency!”',
          autoIdleDelayMs: 2000
        };
      case 'avatar_hover':
        return {
          animation: 'playful',
          expression: 'joyful-wide',
          caption: customCaption || '“Tap to open research assistant!”',
          autoIdleDelayMs: 2500
        };
      case 'avatar_tap':
        return {
          animation: 'excited',
          expression: 'joyful-wide',
          caption: customCaption || '“Let’s explore the Transformer architecture!”',
          autoIdleDelayMs: 3000
        };
      case 'idle':
      default:
        return {
          animation: 'idle',
          expression: 'neutral',
          caption: undefined,
          autoIdleDelayMs: 0
        };
    }
  }
}

export const oneeBridge = new OneeEventBridge();
