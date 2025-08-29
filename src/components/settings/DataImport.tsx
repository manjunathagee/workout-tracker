import React, { useState, useRef } from 'react';
import { Button } from '../common/Button';
import { DataExportService } from '../../services/dataExport';
import type { ImportResult } from '../../types/export';
import toast from 'react-hot-toast';

export const DataImport: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [conflictResolution, setConflictResolution] = useState<'skip' | 'replace' | 'merge'>('skip');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setImportResult(null);

      const content = await file.text();
      const format = file.name.endsWith('.csv') ? 'csv' : 'json';
      
      const result = await DataExportService.importData(content, format, conflictResolution);
      setImportResult(result);

      if (result.success) {
        toast.success('Data imported successfully!');
      } else {
        toast.error('Import completed with errors. Check details below.');
      }

    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import data. Please check the file format.');
      setImportResult({
        success: false,
        errors: [`Import failed: ${error}`],
        warnings: [],
        imported: { workouts: 0, templates: 0, goals: 0, exerciseTypes: 0 },
        skipped: { workouts: 0, templates: 0, goals: 0, exerciseTypes: 0 }
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRestore = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm('This will replace ALL your current data. Are you sure you want to continue?')) {
      return;
    }

    try {
      setIsImporting(true);
      setImportResult(null);

      const content = await file.text();
      const result = await DataExportService.restoreBackup(content);
      setImportResult(result);

      if (result.success) {
        toast.success('Backup restored successfully!');
        // Optionally reload the page to reflect changes
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error('Restore completed with errors. Check details below.');
      }

    } catch (error) {
      console.error('Restore failed:', error);
      toast.error('Failed to restore backup. Please check the file format.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Import Data
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Import workout data from JSON or CSV files, or restore from a full backup.
        </p>
      </div>

      {/* Import Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h4 className="font-medium text-gray-900 dark:text-white mb-4">Import Settings</h4>
        
        <div className="space-y-4">
          {/* Conflict Resolution */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              When Data Conflicts Occur
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="conflictResolution"
                  value="skip"
                  checked={conflictResolution === 'skip'}
                  onChange={(e) => setConflictResolution(e.target.value as 'skip' | 'replace' | 'merge')}
                  className="form-radio text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Skip - Keep existing data, ignore imports
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="conflictResolution"
                  value="replace"
                  checked={conflictResolution === 'replace'}
                  onChange={(e) => setConflictResolution(e.target.value as 'skip' | 'replace' | 'merge')}
                  className="form-radio text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Replace - Overwrite existing data with imported
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="conflictResolution"
                  value="merge"
                  checked={conflictResolution === 'merge'}
                  onChange={(e) => setConflictResolution(e.target.value as 'skip' | 'replace' | 'merge')}
                  className="form-radio text-primary-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Merge - Combine data intelligently (recommended)
                </span>
              </label>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select File to Import
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileSelect}
              disabled={isImporting}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100
                dark:file:bg-primary-900 dark:file:text-primary-200
                dark:hover:file:bg-primary-800"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Supports JSON and CSV files up to 10MB
            </p>
          </div>
        </div>
      </div>

      {/* Full Restore Section */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-6">
        <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-4">
          Full Backup Restore
        </h4>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
          Restore from a complete backup file. This will replace ALL your current data.
        </p>
        
        <input
          type="file"
          accept=".json"
          onChange={handleRestore}
          disabled={isImporting}
          className="block w-full text-sm text-yellow-700 dark:text-yellow-300
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-medium
            file:bg-yellow-100 file:text-yellow-800
            hover:file:bg-yellow-200
            dark:file:bg-yellow-900 dark:file:text-yellow-200
            dark:hover:file:bg-yellow-800"
        />
        
        <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/40 rounded border border-yellow-300 dark:border-yellow-700">
          <p className="text-xs text-yellow-800 dark:text-yellow-200 font-medium">
            ⚠️ WARNING: This action cannot be undone. Please ensure you have a current backup before proceeding.
          </p>
        </div>
      </div>

      {/* Import Results */}
      {importResult && (
        <div className={`rounded-lg border p-6 ${
          importResult.success 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        }`}>
          <h4 className={`font-medium mb-4 ${
            importResult.success
              ? 'text-green-800 dark:text-green-200'
              : 'text-red-800 dark:text-red-200'
          }`}>
            Import {importResult.success ? 'Successful' : 'Results'}
          </h4>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h5 className={`text-sm font-medium mb-2 ${
                importResult.success
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                Imported
              </h5>
              <ul className={`text-sm space-y-1 ${
                importResult.success
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <li>Workouts: {importResult.imported.workouts}</li>
                <li>Templates: {importResult.imported.templates}</li>
                <li>Goals: {importResult.imported.goals}</li>
                <li>Exercise Types: {importResult.imported.exerciseTypes}</li>
              </ul>
            </div>
            
            <div>
              <h5 className={`text-sm font-medium mb-2 ${
                importResult.success
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                Skipped
              </h5>
              <ul className={`text-sm space-y-1 ${
                importResult.success
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                <li>Workouts: {importResult.skipped.workouts}</li>
                <li>Templates: {importResult.skipped.templates}</li>
                <li>Goals: {importResult.skipped.goals}</li>
                <li>Exercise Types: {importResult.skipped.exerciseTypes}</li>
              </ul>
            </div>
          </div>

          {/* Errors */}
          {importResult.errors.length > 0 && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                Errors ({importResult.errors.length})
              </h5>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1 max-h-32 overflow-y-auto">
                {importResult.errors.map((error, index) => (
                  <li key={index} className="break-words">• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {importResult.warnings.length > 0 && (
            <div>
              <h5 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                Warnings ({importResult.warnings.length})
              </h5>
              <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1 max-h-32 overflow-y-auto">
                {importResult.warnings.map((warning, index) => (
                  <li key={index} className="break-words">• {warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Import Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Import Information
        </h4>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• JSON files must match the export format from this application</li>
          <li>• CSV imports have limited data structure support</li>
          <li>• All imported data will be associated with your current user account</li>
          <li>• Large files may take several minutes to process</li>
          <li>• Backup restore will completely replace your current data</li>
        </ul>
      </div>
    </div>
  );
};