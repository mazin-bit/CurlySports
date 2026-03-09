// @ts-nocheck
/**
 * Tests for SuperAdminDashboard: User Management and Streak Leaderboard
 * refresh (Refresh button triggers loadUsers and clears error on success),
 * and permission error (message + Sync button + auto-sync).
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SuperAdminDashboard, USERS_PERMISSION_ERROR_MESSAGE } from './SuperAdminDashboard';

const mockListUsers = jest.fn();
const mockListUsersFromCache = jest.fn();
const mockSetAppConfig = jest.fn();

jest.mock('./firebase', () => ({
  listUsersForAdmin: (...args) => mockListUsers(...args),
  listUsersForAdminFromCache: () => mockListUsersFromCache().then(() => []),
  setUserData: jest.fn(() => Promise.resolve()),
  subscribeAppConfig: jest.fn(() => {
    const noop = () => {};
    return noop;
  }),
  setAppConfig: (...args) => mockSetAppConfig(...args),
  pushAuditLog: jest.fn(() => Promise.resolve()),
  auth: { currentUser: { uid: 'test-uid', email: 'admin@test.com' } },
  buildSuperAdminEmailsMap: jest.fn(() => ({})),
}));

describe('SuperAdminDashboard – User Management & Streak Leaderboard refresh', () => {
  const defaultUser = { email: 'admin@test.com', uid: 'test-uid', role: 'super_admin' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockListUsers.mockResolvedValue([]);
    mockListUsersFromCache.mockResolvedValue([]);
    mockSetAppConfig.mockResolvedValue(undefined);
  });

  it('calls listUsersForAdmin when User Management tab is selected', async () => {
    render(
      <SuperAdminDashboard
        user={defaultUser}
        onLogout={() => {}}
      />
    );
    const userManagementTab = screen.getByRole('button', { name: /user management/i });
    await userEvent.click(userManagementTab);
    await waitFor(() => {
      expect(mockListUsers).toHaveBeenCalled();
    });
  });

  it('Refresh button on User Management triggers listUsersForAdmin again', async () => {
    render(
      <SuperAdminDashboard
        user={defaultUser}
        onLogout={() => {}}
      />
    );
    const userManagementTab = screen.getByRole('button', { name: /user management/i });
    await userEvent.click(userManagementTab);
    await waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledTimes(1);
    });

    const refreshBtn = screen.getByRole('button', { name: /^Refresh$/i });
    await userEvent.click(refreshBtn);

    await waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledTimes(2);
    });
  });

  it('Refresh button on Streak Leaderboard triggers listUsersForAdmin', async () => {
    render(
      <SuperAdminDashboard
        user={defaultUser}
        onLogout={() => {}}
      />
    );
    const leaderboardTab = screen.getByRole('button', { name: /streak leaderboard/i });
    await userEvent.click(leaderboardTab);
    await waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledTimes(1);
    });

    const refreshBtn = screen.getByRole('button', { name: /^Refresh$/i });
    await userEvent.click(refreshBtn);

    await waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledTimes(2);
    });
  });

  it('shows permission error message and Sync button when listUsersForAdmin fails with permission error', async () => {
    mockListUsers.mockRejectedValue(new Error('Missing or insufficient permissions'));
    render(
      <SuperAdminDashboard
        user={defaultUser}
        onLogout={() => {}}
      />
    );
    const userManagementTab = screen.getByRole('button', { name: /user management/i });
    await userEvent.click(userManagementTab);

    await waitFor(() => {
      expect(screen.getByText(USERS_PERMISSION_ERROR_MESSAGE)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /sync my access & retry/i })).toBeInTheDocument();
  });

  it('auto-runs Sync once when permission error appears (so setAppConfig is called)', async () => {
    mockListUsers.mockRejectedValue(new Error('Missing or insufficient permissions'));
    mockSetAppConfig.mockResolvedValue(undefined);
    render(
      <SuperAdminDashboard
        user={defaultUser}
        onLogout={() => {}}
      />
    );
    const userManagementTab = screen.getByRole('button', { name: /user management/i });
    await userEvent.click(userManagementTab);

    await waitFor(() => {
      expect(mockSetAppConfig).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
