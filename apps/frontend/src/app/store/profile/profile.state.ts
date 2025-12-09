import { createAction, createReducer, on, props } from '@ngrx/store';
import { UserProfile } from '../../services/profile.service';

// State
export interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export const initialProfileState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
};

// Actions
export const loadProfile = createAction('[Profile] Load Profile');

export const loadProfileSuccess = createAction(
  '[Profile] Load Profile Success',
  props<{ profile: UserProfile }>()
);

export const loadProfileFailure = createAction(
  '[Profile] Load Profile Failure',
  props<{ error: string }>()
);

export const updateProfile = createAction(
  '[Profile] Update Profile',
  props<{ profile: Partial<UserProfile> }>()
);

export const updateProfileSuccess = createAction(
  '[Profile] Update Profile Success',
  props<{ profile: UserProfile }>()
);

export const updateProfileFailure = createAction(
  '[Profile] Update Profile Failure',
  props<{ error: string }>()
);

export const changePassword = createAction(
  '[Profile] Change Password',
  props<{ currentPassword: string; newPassword: string }>()
);

export const changePasswordSuccess = createAction(
  '[Profile] Change Password Success',
  props<{ message: string }>()
);

export const changePasswordFailure = createAction(
  '[Profile] Change Password Failure',
  props<{ error: string }>()
);

export const uploadAvatar = createAction(
  '[Profile] Upload Avatar',
  props<{ avatar: File }>()
);

export const uploadAvatarSuccess = createAction(
  '[Profile] Upload Avatar Success',
  props<{ profile: UserProfile }>()
);

export const uploadAvatarFailure = createAction(
  '[Profile] Upload Avatar Failure',
  props<{ error: string }>()
);

export const deleteAccount = createAction('[Profile] Delete Account');

export const deleteAccountSuccess = createAction(
  '[Profile] Delete Account Success',
  props<{ message: string }>()
);

export const deleteAccountFailure = createAction(
  '[Profile] Delete Account Failure',
  props<{ error: string }>()
);

export const clearError = createAction('[Profile] Clear Error');

// Reducer
export const profileReducer = createReducer(
  initialProfileState,

  on(loadProfile, (state: ProfileState) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(loadProfileSuccess, (state: ProfileState, { profile }: { profile: UserProfile }) => ({
    ...state,
    profile,
    loading: false,
  })),

  on(loadProfileFailure, (state: ProfileState, { error }: { error: string }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(updateProfile, (state: ProfileState) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(updateProfileSuccess, (state: ProfileState, { profile }: { profile: UserProfile }) => ({
    ...state,
    profile,
    loading: false,
  })),

  on(updateProfileFailure, (state: ProfileState, { error }: { error: string }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(changePassword, (state: ProfileState) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(changePasswordSuccess, (state: ProfileState) => ({
    ...state,
    loading: false,
  })),

  on(changePasswordFailure, (state: ProfileState, { error }: { error: string }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(uploadAvatar, (state: ProfileState) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(uploadAvatarSuccess, (state: ProfileState, { profile }: { profile: UserProfile }) => ({
    ...state,
    profile,
    loading: false,
  })),

  on(uploadAvatarFailure, (state: ProfileState, { error }: { error: string }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(deleteAccount, (state: ProfileState) => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(deleteAccountSuccess, (state: ProfileState) => ({
    ...state,
    loading: false,
  })),

  on(deleteAccountFailure, (state: ProfileState, { error }: { error: string }) => ({
    ...state,
    loading: false,
    error,
  })),

  on(clearError, (state: ProfileState) => ({
    ...state,
    error: null,
  }))
);
