import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Dashboard } from '../dashboard/Dashboard';

// Mock the auth store
const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
};

vi.mock('../../stores/authStore', () => ({
  useAuthStore: () => ({
    user: mockUser
  })
}));

// Mock the database service
vi.mock('../../services/database', () => ({
  db: {
    workouts: {
      where: () => ({
        equals: () => ({
          and: () => ({
            toArray: () => Promise.resolve([])
          })
        })
      })
    },
    exerciseTypes: {
      toArray: () => Promise.resolve([])
    },
    goals: {
      where: () => ({
        equals: () => ({
          toArray: () => Promise.resolve([])
        })
      })
    }
  }
}));

// Mock Chart.js to avoid canvas errors in tests
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => <div data-testid="line-chart">Line Chart</div>,
  Bar: ({ data, options }: any) => <div data-testid="bar-chart">Bar Chart</div>
}));

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn()
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  BarElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  Filler: vi.fn()
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
    success: vi.fn()
  }
}));

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dashboard header', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Welcome back, Test!/)).toBeInTheDocument();
    });
  });

  it('should render time range selector buttons', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('7 Days')).toBeInTheDocument();
      expect(screen.getByText('30 Days')).toBeInTheDocument();
      expect(screen.getByText('90 Days')).toBeInTheDocument();
      expect(screen.getByText('All Time')).toBeInTheDocument();
    });
  });

  it('should render stats cards', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Total Workouts')).toBeInTheDocument();
      expect(screen.getByText('Total Volume')).toBeInTheDocument();
      expect(screen.getByText('Avg Duration')).toBeInTheDocument();
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
    });
  });

  it('should render main dashboard sections', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Progress Overview')).toBeInTheDocument();
      expect(screen.getByText('Recent Workouts')).toBeInTheDocument();
      expect(screen.getByText('Personal Records')).toBeInTheDocument();
      expect(screen.getByText('Goals')).toBeInTheDocument();
    });
  });

  it('should render quick action buttons', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Start Quick Workout')).toBeInTheDocument();
      expect(screen.getByText('Create Template')).toBeInTheDocument();
      expect(screen.getByText('View Analytics')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    render(<Dashboard />);
    
    // Should show skeleton loading initially
    const skeletonElements = screen.getAllByRole('generic');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });
});