import type { ApiProblems } from './api';

declare global {
  type CustomObject<Type> = {
    [key: string]: Type;
  };

  type WithApiResult<T> = { kind: 'ok'; data: T } | ApiProblems;

  namespace React.JSX {
    interface IntrinsicElements {
      'peculiar-fortify-certificates': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};
