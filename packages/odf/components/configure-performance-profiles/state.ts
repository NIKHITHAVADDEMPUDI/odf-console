import { ResourceProfile, ValidationType } from '@odf/core/types';

export type ConfigurePerformanceProfileFormState = {
  inProgress: boolean;
  errorMessage: string | null;
  resourceProfile: ResourceProfile | null;
  validation: ValidationType | null;
};

export const initialConfigurePerformanceProfileState: ConfigurePerformanceProfileFormState =
  {
    inProgress: false,
    errorMessage: null,
    resourceProfile: null,
    validation: null,
  };

export enum ConfigurePerformanceProfileActionType {
  SET_INPROGRESS = 'SET_INPROGRESS',
  SET_ERROR_MESSAGE = 'SET_ERROR_MESSAGE',
  SET_RESOURCE_PROFILE = 'SET_RESOURCE_PROFILE',
  SET_VALIDATION = 'SET_VALIDATION',
}

export type ConfigurePerformanceProfileAction =
  | {
      type: ConfigurePerformanceProfileActionType.SET_INPROGRESS;
      payload: boolean;
    }
  | {
      type: ConfigurePerformanceProfileActionType.SET_ERROR_MESSAGE;
      payload: string | null;
    }
  | {
      type: ConfigurePerformanceProfileActionType.SET_RESOURCE_PROFILE;
      payload: ResourceProfile | null;
    }
  | {
      type: ConfigurePerformanceProfileActionType.SET_VALIDATION;
      payload: ValidationType | null;
    };

export const configurePerformanceProfileReducer = (
  state: ConfigurePerformanceProfileFormState,
  action: ConfigurePerformanceProfileAction
): ConfigurePerformanceProfileFormState => {
  switch (action.type) {
    case ConfigurePerformanceProfileActionType.SET_INPROGRESS:
      return { ...state, inProgress: action.payload };
    case ConfigurePerformanceProfileActionType.SET_ERROR_MESSAGE:
      return { ...state, errorMessage: action.payload };
    case ConfigurePerformanceProfileActionType.SET_RESOURCE_PROFILE:
      return { ...state, resourceProfile: action.payload };
    case ConfigurePerformanceProfileActionType.SET_VALIDATION:
      return { ...state, validation: action.payload };
    default:
      return state;
  }
};
