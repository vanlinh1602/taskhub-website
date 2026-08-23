import _ from 'lodash';

import { ApiProblems } from '@/types/api';

export default (error: any) => {
  if ((error as ApiProblems).kind) {
    if (_.get(error, 'error.response.data.errors')) {
      return _.get(error, 'error.response.data.errors', [])
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
