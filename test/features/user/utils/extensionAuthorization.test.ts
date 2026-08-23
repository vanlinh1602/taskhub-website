import { describe, expect, it, vi } from 'vitest';

import {
  createExtensionCallbackUrl,
  type ExtensionAuthorization,
  getExtensionAuthorization,
  handleFirebaseAuthentication,
} from '@/features/user/utils/extensionAuthorization';

const extensionAuthorization: ExtensionAuthorization = {
  clientId: 'bananabud-extension',
  codeChallenge: 'challenge',
  redirectUri: 'https://abcdefghijklmnop.chromiumapp.org/provider',
  state: 'state-value',
};

describe('getExtensionAuthorization', () => {
  it('returns an authorization request when every PKCE parameter is present', () => {
    const result = getExtensionAuthorization(new URLSearchParams(extensionAuthorization));

    expect(result).toEqual(extensionAuthorization);
  });

  it('returns undefined when a required PKCE parameter is missing', () => {
    const result = getExtensionAuthorization(
      new URLSearchParams({
        clientId: extensionAuthorization.clientId,
        codeChallenge: extensionAuthorization.codeChallenge,
        redirectUri: extensionAuthorization.redirectUri,
      }),
    );

    expect(result).toBeUndefined();
  });
});

describe('createExtensionCallbackUrl', () => {
  it('adds the state and authorization code to an allowed callback URL', () => {
    const callbackUrl = createExtensionCallbackUrl(extensionAuthorization, {
      authorizationCode: 'authorization-code',
    });

    expect(callbackUrl).toBe(
      'https://abcdefghijklmnop.chromiumapp.org/provider?state=state-value&code=authorization-code',
    );
  });

  it('rejects an unsafe callback URL', () => {
    const callbackUrl = createExtensionCallbackUrl(
      { ...extensionAuthorization, redirectUri: 'https://example.com/callback' },
      { authorizationCode: 'authorization-code' },
    );

    expect(callbackUrl).toBeUndefined();
  });
});

describe('handleFirebaseAuthentication', () => {
  it('authenticates a web user without authorizing the extension', async () => {
    const authenticateUser = vi.fn<() => Promise<void>>().mockResolvedValue();
    const authorizeExtension = vi.fn<() => Promise<string>>();
    const redirect = vi.fn<(callbackUrl: string) => void>();

    await handleFirebaseAuthentication({
      authenticateUser,
      authorizeExtension,
      isAuthenticated: true,
      redirect,
    });

    expect(authenticateUser).toHaveBeenCalledOnce();
    expect(authorizeExtension).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('redirects an extension user with a one-time authorization code', async () => {
    const authenticateUser = vi.fn<() => Promise<void>>();
    const authorizeExtension = vi.fn<() => Promise<string>>().mockResolvedValue('authorization-code');
    const redirect = vi.fn<(callbackUrl: string) => void>();

    await handleFirebaseAuthentication({
      authorization: extensionAuthorization,
      authenticateUser,
      authorizeExtension,
      isAuthenticated: true,
      redirect,
    });

    expect(authenticateUser).not.toHaveBeenCalled();
    expect(authorizeExtension).toHaveBeenCalledWith(extensionAuthorization);
    expect(redirect).toHaveBeenCalledWith(
      'https://abcdefghijklmnop.chromiumapp.org/provider?state=state-value&code=authorization-code',
    );
  });

  it('redirects an extension user with access_denied when authorization fails', async () => {
    const authenticateUser = vi.fn<() => Promise<void>>();
    const authorizeExtension = vi.fn<() => Promise<string>>().mockRejectedValue(new Error('Rejected'));
    const redirect = vi.fn<(callbackUrl: string) => void>();

    await handleFirebaseAuthentication({
      authorization: extensionAuthorization,
      authenticateUser,
      authorizeExtension,
      isAuthenticated: true,
      redirect,
    });

    expect(redirect).toHaveBeenCalledWith(
      'https://abcdefghijklmnop.chromiumapp.org/provider?state=state-value&error=access_denied',
    );
  });

  it('does nothing when Firebase has no authenticated user', async () => {
    const authenticateUser = vi.fn<() => Promise<void>>();
    const authorizeExtension = vi.fn<() => Promise<string>>();
    const redirect = vi.fn<(callbackUrl: string) => void>();

    await handleFirebaseAuthentication({
      authorization: extensionAuthorization,
      authenticateUser,
      authorizeExtension,
      isAuthenticated: false,
      redirect,
    });

    expect(authenticateUser).not.toHaveBeenCalled();
    expect(authorizeExtension).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});
