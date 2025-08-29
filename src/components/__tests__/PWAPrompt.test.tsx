import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PWAPrompt, OfflineIndicator } from '../common/PWAPrompt';

// Mock the PWA hook
const mockPWAHook = {
  isInstallable: false,
  isInstalled: false,
  isOnline: true,
  promptInstall: vi.fn(),
  updateAvailable: false,
  refreshApp: vi.fn()
};

vi.mock('../../hooks/usePWA', () => ({
  usePWA: () => mockPWAHook
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('PWAPrompt Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should not render when app is not installable', () => {
    mockPWAHook.isInstallable = false;
    const { container } = render(<PWAPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when app is already installed', () => {
    mockPWAHook.isInstallable = true;
    mockPWAHook.isInstalled = true;
    const { container } = render(<PWAPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('should render update prompt when update is available', () => {
    mockPWAHook.updateAvailable = true;
    render(<PWAPrompt />);
    
    expect(screen.getByText('Update Available')).toBeInTheDocument();
    expect(screen.getByText('A new version is ready to install')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Update' })).toBeInTheDocument();
  });

  it('should call refreshApp when update button is clicked', () => {
    mockPWAHook.updateAvailable = true;
    render(<PWAPrompt />);
    
    const updateButton = screen.getByRole('button', { name: 'Update' });
    fireEvent.click(updateButton);
    
    expect(mockPWAHook.refreshApp).toHaveBeenCalled();
  });

  it('should not render install prompt when recently dismissed', () => {
    const recentTimestamp = Date.now() - 1000; // 1 second ago
    localStorageMock.getItem.mockReturnValue(recentTimestamp.toString());
    
    mockPWAHook.isInstallable = true;
    mockPWAHook.isInstalled = false;
    
    const { container } = render(<PWAPrompt />);
    expect(container.firstChild).toBeNull();
  });
});

describe('OfflineIndicator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    });
  });

  it('should not render when online', () => {
    Object.defineProperty(navigator, 'onLine', { value: true });
    const { container } = render(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when offline', () => {
    Object.defineProperty(navigator, 'onLine', { value: false });
    render(<OfflineIndicator />);
    
    expect(screen.getByText("You're currently offline. Some features may be limited.")).toBeInTheDocument();
  });

  it('should respond to online/offline events', () => {
    Object.defineProperty(navigator, 'onLine', { value: true });
    const { rerender } = render(<OfflineIndicator />);
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false });
    fireEvent(window, new Event('offline'));
    
    rerender(<OfflineIndicator />);
    expect(screen.getByText("You're currently offline. Some features may be limited.")).toBeInTheDocument();
    
    // Simulate going back online
    Object.defineProperty(navigator, 'onLine', { value: true });
    fireEvent(window, new Event('online'));
    
    rerender(<OfflineIndicator />);
    expect(screen.queryByText("You're currently offline. Some features may be limited.")).not.toBeInTheDocument();
  });
});