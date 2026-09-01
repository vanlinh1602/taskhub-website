import _ from 'lodash';

import { ApiProblems } from '@/types/api';

export default (error: any) => {
  if ((error as ApiProblems).kind) {
    const dataErrors = _.get(error, 'data.errors');
    if (Array.isArray(dataErrors) && dataErrors.length > 0) {
      return dataErrors
        .map((e: any) => e.detail || e.message || e)
        .join(', ');
    }
    if (_.get(error, 'data.message')) {
      return _.get(error, 'data.message');
    }
    const responseErrors = _.get(error, 'error.response.data.errors');
    if (Array.isArray(responseErrors) && responseErrors.length > 0) {
      return responseErrors
        .map((e: any) => e.detail || e.message || e)
        .join(', ');
    }
    if (_.get(error, 'error.response.data.message')) {
      return _.get(error, 'error.response.data.message');
    }
    if (_.get(error, 'error.response.data')) {
      return error?.error?.response?.data;
    }
    return error?.error?.message;
  }

  if (error.errors) {
    return Object.values(error.errors)
      .map((e: any) => e.detail || e.message || e)
      .join(', ');
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unkown error';
};
