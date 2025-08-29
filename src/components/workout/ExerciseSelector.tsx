import React, { useState, useMemo } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import type { ExerciseType } from '../../types/workout';

interface ExerciseSelectorProps {
  exerciseTypes: ExerciseType[];
  onSelect: (exerciseType: ExerciseType) => void;
  onClose: () => void;
}

const categoryColors = {
  swing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  press: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  squat: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  deadlift: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  carry: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
};

const categoryLabels = {
  swing: 'Swing',
  press: 'Press',
  squat: 'Squat',
  deadlift: 'Deadlift',
  carry: 'Carry',
  other: 'Other'
};

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({
  exerciseTypes,
  onSelect,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseType | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(exerciseTypes.map(et => et.category)));
    return cats.sort();
  }, [exerciseTypes]);

  const filteredExercises = useMemo(() => {
    return exerciseTypes.filter(exercise => {
      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exerciseTypes, searchTerm, selectedCategory]);

  const handleSelect = (exerciseType: ExerciseType) => {
    if (selectedExercise?.id === exerciseType.id) {
      onSelect(exerciseType);
    } else {
      setSelectedExercise(exerciseType);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedExercise) {
      onSelect(selectedExercise);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Select Exercise
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
          <Input
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All Categories
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? categoryColors[category as keyof typeof categoryColors]
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {categoryLabels[category as keyof typeof categoryLabels] || category}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No exercises found matching your criteria.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredExercises.map(exercise => (
                <div
                  key={exercise.id}
                  onClick={() => handleSelect(exercise)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedExercise?.id === exercise.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-400'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {exercise.name}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      categoryColors[exercise.category as keyof typeof categoryColors]
                    }`}>
                      {categoryLabels[exercise.category as keyof typeof categoryLabels] || exercise.category}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {exercise.description}
                  </p>

                  <div className="space-y-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Primary Muscles:
                      </h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.muscles.map(muscle => (
                          <span
                            key={muscle}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    </div>

                    {exercise.instructions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Instructions:
                        </h4>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                          {exercise.instructions.slice(0, 2).map((instruction, index) => (
                            <li key={index} className="flex items-start">
                              <span className="text-primary-500 mr-1">•</span>
                              {instruction}
                            </li>
                          ))}
                          {exercise.instructions.length > 2 && (
                            <li className="text-gray-500 dark:text-gray-500">
                              +{exercise.instructions.length - 2} more steps...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  {selectedExercise?.id === exercise.id && (
                    <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-800">
                      <p className="text-sm text-primary-600 dark:text-primary-400 font-medium">
                        Click "Add Exercise" to add this to your workout
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSelection}
            disabled={!selectedExercise}
          >
            Add Exercise
          </Button>
        </div>
      </div>
    </div>
  );
};