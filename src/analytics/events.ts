export const AnalyticsEvents = {
  LOGIN_COMPLETE: 'login_complete',
  PLAYGROUND_RUN: 'playground_run',
  PLAYGROUND_RUN_SUCCESS: 'playground_run_success',
  CHECKOUT_START: 'checkout_start',
  CHECKOUT_COMPLETE: 'checkout_complete',
  MODEL_FAVOURITE_TOGGLE: 'model_favourite_toggle',
  API_CODE_COPY: 'api_code_copy',
  MODEL_SELECTOR_CHANGE: 'model_selector_change',
} as const

export type AnalyticsSource = 'model_detail' | 'ai_generator' | 'model_api_tab' | 'playground'
