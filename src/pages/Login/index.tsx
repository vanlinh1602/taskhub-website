import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { useShallow } from 'zustand/shallow';

import { LoadingScreen } from '@/components/loading-screen';
import { Button } from '@/components/ui/button';
import { getNextTheme } from '@/features/layouts/utils/theme';
import { useUserStore } from '@/features/user/hooks';
import { translations } from '@/locales/translations';
import { auth } from '@/services/firebase';

import styles from './index.module.css';

interface BenefitItemProps {
  readonly icon: string;
  readonly text: string;
}

function BenefitItem({ icon, text }: BenefitItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-white/45 bg-white/45 px-4 py-3 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-lg shadow-sm"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span>{text}</span>
    </li>
  );
}

function GoogleIcon() {
  return (
    <svg className="size-5" aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.74 2.98-4.31 2.98-7.41Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.12-1.32.32-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();
  const { resolvedTheme, setTheme } = useTheme();
  const { isLoading, user } = useUserStore(
    useShallow((state) => ({
      isLoading: state.handling,
      user: state.user,
    })),
  );
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const isDarkTheme = resolvedTheme === 'dark';
  useEffect(() => {
    if (user) {
      const next = searchParams.get('next');
      navigate(next?.startsWith('/') ? next : '/', { replace: true });
    }
  }, [navigate, searchParams, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  async function loginWithGoogle(): Promise<void> {
    setIsSigningIn(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: unknown) {
      toast.error(t(translations.errors.login), {
        description:
          error instanceof Error
            ? error.message
            : t(translations.errors.unknown),
      });
    } finally {
      setIsSigningIn(false);
    }
  }

  return (
    <main className="app-canvas relative min-h-dvh p-3 text-foreground sm:p-5 lg:p-7">
      <Button
        aria-label={t(
          isDarkTheme
            ? translations.layouts.switchToLight
            : translations.layouts.switchToDark,
        )}
        className="absolute top-5 right-5 z-20 rounded-xl border border-border/70 bg-card/75 shadow-control backdrop-blur sm:top-7 sm:right-7"
        onClick={() => setTheme(getNextTheme(resolvedTheme))}
        size="icon"
        title={t(
          isDarkTheme
            ? translations.layouts.switchToLight
            : translations.layouts.switchToDark,
        )}
        type="button"
        variant="outline"
      >
        {isDarkTheme ? (
          <Sun aria-hidden="true" />
        ) : (
          <Moon aria-hidden="true" />
        )}
      </Button>
      <div className="mx-auto grid min-h-[calc(100dvh-1.5rem)] max-w-7xl overflow-hidden rounded-4xl border border-border/70 bg-card/75 shadow-soft backdrop-blur-xl sm:min-h-[calc(100dvh-2.5rem)] lg:min-h-[calc(100dvh-3.5rem)] lg:grid-cols-[1.15fr_0.85fr]">
        <section
          className={`${styles.brandPanel} relative order-2 overflow-hidden px-5 py-7 sm:px-10 sm:py-10 lg:order-0 lg:px-14 lg:py-12`}
        >
          <div className={styles.glow} aria-hidden="true" />
          <div
            className={`${styles.leaf} ${styles.leafOne}`}
            aria-hidden="true"
          />
          <div
            className={`${styles.leaf} ${styles.leafTwo}`}
            aria-hidden="true"
          />

          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center gap-3">
              <img
                className="size-12 rounded-2xl shadow-control"
                src="/assets/brand/taskory-hub-logo.png"
                alt=""
              />
              <span className="text-lg font-extrabold tracking-tight">
                {t(translations.common.appName)}
              </span>
            </div>

            <div className="my-auto py-7 sm:py-10 lg:py-14">
              <div className="grid items-center gap-8 sm:grid-cols-[1fr_auto] lg:grid-cols-1 xl:grid-cols-[1fr_auto]">
                <div className={styles.reveal}>
                  <span className="inline-flex rounded-full border border-primary/15 bg-secondary/80 px-3 py-1.5 text-xs font-bold tracking-wider text-secondary-foreground uppercase">
                    {t(translations.auth.banner.eyebrow)}
                  </span>
                  <h1 className="mt-5 max-w-2xl text-4xl leading-tight font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
                    {t(translations.auth.banner.title)}
                  </h1>
                  <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
                    {t(translations.auth.banner.description)}
                  </p>
                </div>

                <div
                  className={`${styles.mascot} hidden sm:block`}
                  aria-hidden="true"
                >
                  <div className={styles.mascotHalo} />
                  <img
                    className="relative size-36 rounded-[2.5rem] shadow-soft xl:size-44"
                    src="/assets/brand/taskory-hub-logo.png"
                    alt=""
                  />
                </div>
              </div>

              <ul
                className={`${styles.revealDelayed} mt-6 grid gap-2.5 sm:mt-8 sm:grid-cols-2 sm:gap-3`}
              >
                <BenefitItem
                  icon="♡"
                  text={t(translations.auth.banner.benefits.listen)}
                />
                <BenefitItem
                  icon="✦"
                  text={t(translations.auth.banner.benefits.smart)}
                />
                <BenefitItem
                  icon="⌾"
                  text={t(translations.auth.banner.benefits.secure)}
                />
                <BenefitItem
                  icon="∞"
                  text={t(translations.auth.banner.benefits.companion)}
                />
              </ul>
            </div>

            <p className="relative z-10 text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
              {t(translations.auth.banner.trust)}
            </p>
          </div>
        </section>

        <section className="relative order-1 flex items-center justify-center border-b border-border/70 bg-card/85 px-5 py-8 sm:px-6 sm:py-12 lg:order-0 lg:border-t-0 lg:border-b-0 lg:border-l lg:px-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden">
              <img
                className="size-14 rounded-2xl shadow-control"
                src="/assets/brand/taskory-hub-logo.png"
                alt=""
              />
            </div>
            <p className="mt-5 text-sm font-bold tracking-[0.18em] text-primary uppercase lg:mt-0">
              {t(translations.common.appName)}
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              {t(translations.auth.title)}
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              {t(translations.auth.description)}
            </p>

            <button
              className="mt-7 flex min-h-13 w-full items-center justify-center gap-3 rounded-2xl bg-primary px-5 py-3.5 font-bold text-primary-foreground shadow-control transition-transform hover:-translate-y-0.5 hover:opacity-90 active:translate-y-0 disabled:cursor-wait disabled:opacity-60 sm:mt-8"
              disabled={isSigningIn}
              onClick={() => void loginWithGoogle()}
              type="button"
            >
              {isSigningIn ? (
                <span className={styles.spinner} aria-hidden="true" />
              ) : (
                <GoogleIcon />
              )}
              <span>
                {isSigningIn
                  ? t(translations.auth.signingIn)
                  : t(translations.auth.google)}
              </span>
            </button>

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-muted/75 p-4 text-sm leading-6 text-muted-foreground">
              <span
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground"
                aria-hidden="true"
              >
                ✓
              </span>
              <p>{t(translations.auth.privacy)}</p>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-muted-foreground sm:mt-8">
              {t(translations.auth.agreement)}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
