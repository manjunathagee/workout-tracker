import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { WorkoutPlanner } from './WorkoutPlanner';
import { db } from '../../services/database';
import { useAuthStore } from '../../stores/authStore';
import type { Workout, ExerciseType } from '../../types/workout';
import toast from 'react-hot-toast';

export const WorkoutTemplates: React.FC = () => {
  const { user } = useAuthStore();
  const [templates, setTemplates] = useState<Workout[]>([]);
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanner, setShowPlanner] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Workout | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [templatesData, exerciseTypesData] = await Promise.all([
        db.workouts.where('userId').equals(user.id).and(w => w.isTemplate).toArray(),
        db.exerciseTypes.toArray()
      ]);

      setTemplates(templatesData);
      setExerciseTypes(exerciseTypesData);
    } catch (error) {
      console.error('Failed to load templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(undefined);
    setShowPlanner(true);
  };

  const handleEditTemplate = (template: Workout) => {
    setEditingTemplate(template);
    setShowPlanner(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await db.workouts.delete(templateId);
      setTemplates(templates.filter(t => t.id !== templateId));
      toast.success('Template deleted');
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicateTemplate = async (template: Workout) => {
    try {
      const duplicatedTemplate: Workout = {
        ...template,
        id: crypto.randomUUID(),
        templateName: `${template.templateName} (Copy)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        exercises: template.exercises.map(ex => ({
          ...ex,
          id: crypto.randomUUID(),
          workoutId: crypto.randomUUID(),
          sets: ex.sets.map(set => ({
            ...set,
            id: crypto.randomUUID(),
            exerciseId: crypto.randomUUID()
          }))
        }))
      };

      await db.workouts.add(duplicatedTemplate);
      await loadData();
      toast.success('Template duplicated');
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleStartWorkout = async (template: Workout) => {
    try {
      const workoutSession: Workout = {
        ...template,
        id: crypto.randomUUID(),
        isTemplate: false,
        templateName: undefined,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        exercises: template.exercises.map(ex => ({
          ...ex,
          id: crypto.randomUUID(),
          workoutId: crypto.randomUUID(),
          sets: ex.sets.map(set => ({
            ...set,
            id: crypto.randomUUID(),
            exerciseId: crypto.randomUUID(),
            completed: false,
            actualReps: undefined,
            actualWeight: undefined
          }))
        }))
      };

      await db.workouts.add(workoutSession);
      toast.success('Workout started! Navigate to execution page.');
      // Here you would typically navigate to the workout execution page
    } catch (error) {
      console.error('Failed to start workout:', error);
      toast.error('Failed to start workout');
    }
  };

  const getExerciseTypeName = (exerciseTypeId: string) => {
    const exerciseType = exerciseTypes.find(et => et.id === exerciseTypeId);
    return exerciseType?.name || 'Unknown Exercise';
  };

  const getTemplateCategories = () => {
    const categories = new Set<string>();
    templates.forEach(template => {
      template.exercises.forEach(exercise => {
        const exerciseType = exerciseTypes.find(et => et.id === exercise.exerciseType);
        if (exerciseType) {
          categories.add(exerciseType.category);
        }
      });
    });
    return Array.from(categories).sort();
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => 
        template.exercises.some(exercise => {
          const exerciseType = exerciseTypes.find(et => et.id === exercise.exerciseType);
          return exerciseType?.category === selectedCategory;
        })
      );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workout Templates
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Create and manage your workout templates
          </p>
        </div>
        <Button onClick={handleCreateTemplate}>
          Create Template
        </Button>
      </div>

      {/* Category Filter */}
      {templates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All Templates
          </button>
          {getTemplateCategories().map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors capitalize ${
                selectedCategory === category
                  ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {selectedCategory === 'all' 
              ? "Get started by creating your first workout template"
              : `No templates found for ${selectedCategory} category`
            }
          </p>
          <Button onClick={handleCreateTemplate}>
            Create Your First Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {template.templateName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {template.exercises.length} exercise{template.exercises.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="relative">
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {template.exercises.slice(0, 3).map(exercise => (
                  <div
                    key={exercise.id}
                    className="text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between"
                  >
                    <span>{getExerciseTypeName(exercise.exerciseType)}</span>
                    <span>{exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}</span>
                  </div>
                ))}
                {template.exercises.length > 3 && (
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    +{template.exercises.length - 3} more exercises
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleStartWorkout(template)}
                  className="flex-1"
                >
                  Start Workout
                </Button>
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDuplicateTemplate(template)}
                  className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                  title="Duplicate"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  title="Delete"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPlanner && (
        <WorkoutPlanner
          existingTemplate={editingTemplate}
          onClose={() => {
            setShowPlanner(false);
            setEditingTemplate(undefined);
            loadData();
          }}
        />
      )}
    </div>
  );
};