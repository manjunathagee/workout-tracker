import React, { useState } from 'react';
import { Button } from '../common/Button';
import { DataExportService } from '../../services/dataExport';
import type { ExportConfig } from '../../types/export';
import toast from 'react-hot-toast';

export const DataExport: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    format: 'json',
    dateRange: {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
      end: new Date()
    },
    includePersonalRecords: true,
    includeGoals: true,
    includeTemplates: true,
    includeUserData: false
  });

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const exportData = await DataExportService.exportData(config);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `workout-data-${timestamp}.${config.format}`;
      const mimeType = config.format === 'json' ? 'application/json' : 'text/csv';
      
      DataExportService.downloadData(exportData, filename, mimeType);
      toast.success('Data exported successfully!');
      
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFullBackup = async () => {
    try {
      setIsExporting(true);
      const backupData = await DataExportService.createBackup();
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `workout-backup-${timestamp}.json`;
      
      DataExportService.downloadData(backupData, filename, 'application/json');
      toast.success('Full backup created successfully!');
      
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Failed to create backup. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Export Data
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Export your workout data in JSON or CSV format for backup or analysis.
        </p>
      </div>

      {/* Export Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Export Settings</h4>
        
        <div className="space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Export Format
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={config.format === 'json'}
                  onChange={(e) => setConfig({ ...config, format: e.target.value as 'json' | 'csv' })}
                  className="form-radio text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  JSON (recommended for backup)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={config.format === 'csv'}
                  onChange={(e) => setConfig({ ...config, format: e.target.value as 'json' | 'csv' })}
                  className="form-radio text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  CSV (for spreadsheet analysis)
                </span>
              </label>
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={config.dateRange.start.toISOString().split('T')[0]}
                onChange={(e) => setConfig({
                  ...config,
                  dateRange: { ...config.dateRange, start: new Date(e.target.value) }
                })}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={config.dateRange.end.toISOString().split('T')[0]}
                onChange={(e) => setConfig({
                  ...config,
                  dateRange: { ...config.dateRange, end: new Date(e.target.value) }
                })}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Include Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Include Data
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeTemplates}
                  onChange={(e) => setConfig({ ...config, includeTemplates: e.target.checked })}
                  className="form-checkbox text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Workout Templates
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeGoals}
                  onChange={(e) => setConfig({ ...config, includeGoals: e.target.checked })}
                  className="form-checkbox text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Goals and Targets
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includePersonalRecords}
                  onChange={(e) => setConfig({ ...config, includePersonalRecords: e.target.checked })}
                  className="form-checkbox text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Personal Records
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.includeUserData}
                  onChange={(e) => setConfig({ ...config, includeUserData: e.target.checked })}
                  className="form-checkbox text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  User Profile Information
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1"
          >
            {isExporting ? 'Exporting...' : 'Export Data'}
          </Button>
          <Button
            variant="outline"
            onClick={handleFullBackup}
            disabled={isExporting}
            className="flex-1"
          >
            {isExporting ? 'Creating...' : 'Full Backup'}
          </Button>
        </div>
      </div>

      {/* Export Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Export Information
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• JSON format preserves all data structure and is recommended for backups</li>
          <li>• CSV format is ideal for importing into spreadsheet applications</li>
          <li>• Full backup includes all your data regardless of date range</li>
          <li>• Personal records are calculated from your workout history</li>
        </ul>
      </div>
    </div>
  );
};