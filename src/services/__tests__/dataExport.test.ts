import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataExportService } from '../dataExport';
import type { ExportConfig } from '../../types/export';

// Mock the auth store
const mockUser = {
  id: 'user1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
};

vi.mock('../../stores/authStore', () => ({
  useAuthStore: {
    getState: () => ({ user: mockUser })
  }
}));

// Mock the database
const mockWorkouts = [
  {
    id: '1',
    userId: 'user1',
    date: new Date('2024-01-01'),
    duration: 45,
    exercises: [],
    isTemplate: false,
    completedAt: new Date('2024-01-01')
  }
];

vi.mock('../database', () => ({
  db: {
    workouts: {
      where: () => ({
        equals: () => ({
          and: () => ({
            toArray: () => Promise.resolve(mockWorkouts)
          })
        })
      })
    },
    goals: {
      where: () => ({
        equals: () => ({
          toArray: () => Promise.resolve([])
        })
      })
    },
    exerciseTypes: {
      toArray: () => Promise.resolve([])
    }
  }
}));

describe('DataExportService', () => {
  let exportConfig: ExportConfig;

  beforeEach(() => {
    exportConfig = {
      format: 'json',
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31')
      },
      includePersonalRecords: true,
      includeGoals: true,
      includeTemplates: true,
      includeUserData: false
    };
  });

  describe('exportData', () => {
    it('should export data in JSON format', async () => {
      const result = await DataExportService.exportData(exportConfig);
      
      expect(result).toBeTruthy();
      
      const parsedData = JSON.parse(result);
      expect(parsedData.metadata).toBeDefined();
      expect(parsedData.metadata.userInfo.email).toBe('test@example.com');
      expect(parsedData.workouts).toHaveLength(1);
    });

    it('should export data in CSV format', async () => {
      exportConfig.format = 'csv';
      const result = await DataExportService.exportData(exportConfig);
      
      expect(result).toBeTruthy();
      expect(result).toContain('WORKOUTS');
      expect(result).toContain('ID,Date,Duration');
    });

    it('should filter workouts by date range', async () => {
      exportConfig.dateRange = {
        start: new Date('2024-06-01'),
        end: new Date('2024-12-31')
      };

      const result = await DataExportService.exportData(exportConfig);
      const parsedData = JSON.parse(result);
      
      // Should have no workouts as our mock workout is from January
      expect(parsedData.workouts).toHaveLength(0);
    });

    it('should exclude templates when requested', async () => {
      exportConfig.includeTemplates = false;
      
      const result = await DataExportService.exportData(exportConfig);
      const parsedData = JSON.parse(result);
      
      expect(parsedData.templates).toHaveLength(0);
    });
  });

  describe('downloadData', () => {
    it('should create and trigger download', () => {
      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: vi.fn()
      };

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink as any);
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink as any);
      
      // Mock URL methods
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      DataExportService.downloadData('test content', 'test.json', 'application/json');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.click).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('createBackup', () => {
    it('should create full backup with all data', async () => {
      const backup = await DataExportService.createBackup();
      
      expect(backup).toBeTruthy();
      
      const parsedBackup = JSON.parse(backup);
      expect(parsedBackup.metadata).toBeDefined();
      expect(parsedBackup.workouts).toBeDefined();
      expect(parsedBackup.templates).toBeDefined();
      expect(parsedBackup.goals).toBeDefined();
    });
  });

  describe('importData', () => {
    it('should validate import data structure', async () => {
      const validData = JSON.stringify({
        metadata: {
          exportDate: new Date(),
          version: '1.0.0',
          userInfo: mockUser
        },
        workouts: [],
        templates: [],
        goals: [],
        personalRecords: [],
        exerciseTypes: []
      });

      const result = await DataExportService.importData(validData, 'json');
      expect(result.success).toBe(true);
    });

    it('should reject invalid data structure', async () => {
      const invalidData = JSON.stringify({
        invalid: 'data'
      });

      const result = await DataExportService.importData(invalidData, 'json');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle JSON parsing errors', async () => {
      const invalidJSON = 'invalid json string';

      const result = await DataExportService.importData(invalidJSON, 'json');
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});