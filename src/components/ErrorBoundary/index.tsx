import { useQueryClient } from '@tanstack/react-query';
import { Component, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { translations } from '@/locales/translations';

import styles from './index.module.css';

interface ErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ErrorBoundaryState {
  readonly hasError: boolean;
}

function ErrorFallback() {
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  function handleReloadPage(): void {
    queryClient.clear();
    window.location.reload();
  }

  return (
    <main
      className={`${styles.page} app-canvas relative isolate flex min-h-dvh flex-col overflow-hidden px-5 py-6 text-foreground sm:px-8 sm:py-8 lg:px-12`}
    >
      <div aria-hidden="true" className={styles.glow} />

      <a
        className="relative z-10 inline-flex w-fit items-center gap-3 rounded-2xl pr-3 font-extrabold"
        href="/"
      >
        <img
          className="size-11 rounded-2xl shadow-control"
          src="/assets/brand/taskory-hub-logo.png"
          alt=""
        />
        <span className="text-lg tracking-tight">Taskory Hub</span>
      </a>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 py-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14 lg:py-4">
        <div
          className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left"
          role="alert"
        >
          <p className="mb-4 inline-flex rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-extrabold tracking-[0.18em] text-primary shadow-control backdrop-blur-sm">
            {t(translations.errors.application.label)}
          </p>
          <h1 className="text-4xl font-black tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl">
            {t(translations.errors.application.title)}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
            {t(translations.errors.application.description)}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <button
              className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-control transition-transform duration-200 hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
              onClick={handleReloadPage}
              type="button"
            >
              {t(translations.errors.application.reload)}
              <span aria-hidden="true" className="ml-2">
                ↻
              </span>
            </button>
            <a
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-border bg-card/80 px-6 py-3 font-bold shadow-control backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:bg-card active:translate-y-0"
              href="/"
            >
              {t(translations.errors.application.home)}
            </a>
          </div>
        </div>

        <div className={styles.artStage}>
          <img
            className={styles.mascot}
            src="/assets/brand/taskory-hub-logo.png"
            alt={t(translations.errors.application.alt)}
          />
        </div>
      </section>
    </main>
  );
}

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public readonly state: ErrorBoundaryState = { hasError: false };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
