import { useState } from 'react';

type Rules<T> = { [K in keyof T]?: (value: T[K], all: T) => string };

/**
 * Small form helper: errors are worked out on every change, but a field only shows its error
 * after the user has typed in it (or pressed submit). That keeps validation live without shouting.
 */
export function useForm<T extends Record<string, unknown>>(initial: T, rules: Rules<T>) {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const errorOf = (k: keyof T) => rules[k]?.(values[k], values) || '';
  const set = <K extends keyof T>(k: K, v: T[K]) => {
    setValues((p) => ({ ...p, [k]: v }));
    setTouched((t) => ({ ...t, [k]: true }));
  };
  const error = (k: keyof T) => (touched[k] ? errorOf(k) : '');
  const isValid = (k: keyof T) => !errorOf(k);

  const validate = () => {
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])) as Record<keyof T, boolean>);
    return (Object.keys(rules) as (keyof T)[]).every((k) => !errorOf(k));
  };
  const reset = (next: T = initial) => {
    setValues(next);
    setTouched({});
  };

  return { values, set, error, isValid, validate, reset };
}
