import type { ExtensionAuthorizationRequest } from '../api';

export interface ExtensionAuthorization extends ExtensionAuthorizationRequest {
  readonly state: string;
}

export interface ExtensionAuthorizationResult {
  readonly authorizationCode?: string;
  readonly error?: string;
}

interface HandleFirebaseAuthenticationOptions {
  readonly authorization?: ExtensionAuthorization;
  readonly authenticateUser: () => Promise<void>;
  readonly authorizeExtension: (authorization: ExtensionAuthorization) => Promise<string>;
  readonly isAuthenticated: boolean;
  readonly redirect: (callbackUrl: string) => void;
}

export function getExtensionAuthorization(searchParams: URLSearchParams): ExtensionAuthorization | undefined {
  const clientId = searchParams.get('clientId');
  const codeChallenge = searchParams.get('codeChallenge');
  const redirectUri = searchParams.get('redirectUri');
  const state = searchParams.get('state');

  if (!clientId || !codeChallenge || !redirectUri || !state) {
    return undefined;
  }

  return { clientId, codeChallenge, redirectUri, state };
}

export function createExtensionCallbackUrl(
  authorization: ExtensionAuthorization,
  result: ExtensionAuthorizationResult,
): string | undefined {
  try {
    const callbackUrl = new URL(authorization.redirectUri);
    if (callbackUrl.protocol !== 'https:' || !callbackUrl.hostname.endsWith('.chromiumapp.org')) {
      return undefined;
    }

    callbackUrl.searchParams.set('state', authorization.state);
    if (result.authorizationCode) callbackUrl.searchParams.set('code', result.authorizationCode);
    if (result.error) callbackUrl.searchParams.set('error', result.error);

    return callbackUrl.toString();
  } catch {
    return undefined;
  }
}

export async function handleFirebaseAuthentication({
  authorization,
  authenticateUser,
  authorizeExtension,
  isAuthenticated,
  redirect,
}: HandleFirebaseAuthenticationOptions): Promise<void> {
  if (!isAuthenticated) {
    return;
  }

  if (!authorization) {
    await authenticateUser();
    return;
  }

  try {
    const authorizationCode = await authorizeExtension(authorization);
    const callbackUrl = createExtensionCallbackUrl(authorization, { authorizationCode });
    if (!callbackUrl) {
      throw new Error('Extension callback URL is invalid.');
    }
    redirect(callbackUrl);
  } catch {
    const callbackUrl = createExtensionCallbackUrl(authorization, { error: 'access_denied' });
    if (!callbackUrl) {
      throw new Error('Extension callback URL is invalid.');
    }
    redirect(callbackUrl);
  }
}
