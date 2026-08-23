import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { translations } from '@/locales/translations';

import styles from './index.module.css';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <main
      className={`${styles.page} app-canvas relative isolate flex min-h-dvh flex-col overflow-hidden px-5 py-6 text-foreground sm:px-8 sm:py-8 lg:px-12`}
    >
      <div aria-hidden="true" className={styles.glow} />

      <Link
        className="relative z-10 inline-flex w-fit items-center gap-3 rounded-2xl pr-3 font-extrabold"
        to="/"
      >
        <img
          className="size-11 rounded-2xl shadow-control"
          src="/assets/brand/banana-bud-logo.png"
          alt=""
        />
        <span className="text-lg tracking-tight">Banana Bud</span>
      </Link>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 py-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-14 lg:py-4">
        <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
          <p className="mb-4 inline-flex rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-extrabold tracking-[0.24em] text-primary shadow-control backdrop-blur-sm">
            404
          </p>
          <h1 className="text-4xl font-black tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl">
            {t(translations.errors.notFound.title)}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg lg:mx-0">
            {t(translations.errors.notFound.description)}
          </p>
          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-2xl bg-primary px-6 py-3 font-bold text-primary-foreground shadow-control transition-transform duration-200 hover:-translate-y-0.5 hover:opacity-95 active:translate-y-0"
            to="/"
          >
            {t(translations.errors.notFound.home)}
            <span aria-hidden="true" className="ml-2">
              &rarr;
            </span>
          </Link>
        </div>

        <div className={styles.artStage}>
          <span
            aria-hidden="true"
            className={`${styles.sparkle} ${styles.sparkleOne}`}
          >
            ✦
          </span>
          <span
            aria-hidden="true"
            className={`${styles.sparkle} ${styles.sparkleTwo}`}
          >
            ✦
          </span>
          <span
            aria-hidden="true"
            className={`${styles.sparkle} ${styles.sparkleThree}`}
          >
            ✦
          </span>
          <img
            className={styles.mascot}
            src="/assets/illustrations/not-found-mascot.png"
            alt={t(translations.errors.notFound.alt)}
          />
        </div>
      </section>
    </main>
  );
}
