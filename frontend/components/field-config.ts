import { type TextStyle } from 'react-native';

/**
 * Shared text-input configuration for forms.
 * Fixed height keeps Android text metrics stable while typing.
 */
export const FIELD_BASE_CLASSNAME =
  'h-12 rounded-xl border border-slate-300 bg-white px-3 font-sans text-base text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

export const STABLE_TEXT_STYLE: TextStyle = Object.freeze({
  includeFontPadding: false,
});
