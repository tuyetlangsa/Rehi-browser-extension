interface GenericResponse<T = any> {
  isSuccess: boolean;
  message: string;
  data: T | null;
  errorCode: number | null;
  extensions: Record<string, any> | null;
}

export type BaseResponse<T = any> = SuccessResponse<T> | ErrorResponse | ValidationErrorResponse;

interface SuccessResponse<T = any> extends GenericResponse<T> {
  isSuccess: true;
  data: T;
  errorCode: null;
}

interface ErrorResponse extends GenericResponse<null> {
  isSuccess: false;
  data: null;
  errorCode: number;
}

export interface ValidationErrorResponse extends GenericResponse<null> {
  isSuccess: false;
  message: string;
  data: null;
  errorCode: number;
  extensions: {
    errors: {
      code: number;
      description: string;
    }[];
  };
}

export interface PagedResponse<T = any> extends GenericResponse<{ items: T }> {
  isSuccess: true;
  message: string;
  data: {
    items: T;
  };
  errorCode: null;
  extensions: {
    pageNumber: number;
    totalItems: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}
