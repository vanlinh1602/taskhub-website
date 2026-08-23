import { getAuth } from 'firebase/auth';

import { backendService } from '@/services';
import formatError from '@/utils/formatError';

import { User } from '../type';

export interface ExtensionAuthorizationRequest {
  readonly clientId: string;
  readonly codeChallenge: string;
  readonly redirectUri: string;
}

interface UserAuthenticationResponse {
  readonly authorizationCode?: string;
  readonly user: User;
}

export const authUser = async (): Promise<User> => {
  const user = getAuth().currentUser;
  if (!user) {
    return Promise.reject('User not found');
  }

  const idToken = await user.getIdToken();

  const response = await backendService.post<UserAuthenticationResponse>('api/users/auth', {
    grantType: 'firebase',
    idToken,
  });

  if (response.kind === 'ok') {
    return response.data.user;
  }

  throw new Error(formatError(response));
};

export const authorizeExtension = async (
  authorization: ExtensionAuthorizationRequest,
): Promise<string> => {
  const user = getAuth().currentUser;
  if (!user) {
    return Promise.reject('User not found');
  }

  const idToken = await user.getIdToken();
  const response = await backendService.post<UserAuthenticationResponse>('api/users/auth', {
    grantType: 'firebase',
    idToken,
    ...authorization,
  });

  if (response.kind !== 'ok') {
    throw new Error(formatError(response));
  }
  if (!response.data.authorizationCode) {
    throw new Error('Authorization code was not returned.');
  }

  return response.data.authorizationCode;
};

export const logoutUser = async (): Promise<void> => {
  const response = await backendService.post<void>('api/users/logout');
  if (response.kind === 'ok') {
    return;
  }

  throw new Error(formatError(response));
};
