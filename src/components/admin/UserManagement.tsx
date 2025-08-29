import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { db } from '../../services/database';
import type { User } from '../../types/auth';
import { formatDate } from '../../utils/dateHelpers';
import toast from 'react-hot-toast';
import { 
  UserIcon, 
  ShieldCheckIcon, 
  TrashIcon, 
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'user' | 'admin'>('all');
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    try {
      const allUsers = await db.users.toArray();
      // Remove password field for display
      const sanitizedUsers = allUsers.map(({ password: _, ...user }) => user as User);
      setUsers(sanitizedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      await db.users.update(userId, { 
        role: newRole,
        updatedAt: new Date() 
      });
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole, updatedAt: new Date() }
          : user
      ));
      
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };
  
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      // Delete user's workouts first
      const userWorkouts = await db.workouts.where('userId').equals(userId).toArray();
      for (const workout of userWorkouts) {
        // Delete exercises and sets for each workout
        const exercises = await db.exercises.where('workoutId').equals(workout.id).toArray();
        for (const exercise of exercises) {
          await db.sets.where('exerciseId').equals(exercise.id).delete();
        }
        await db.exercises.where('workoutId').equals(workout.id).delete();
      }
      await db.workouts.where('userId').equals(userId).delete();
      
      // Delete the user
      await db.users.delete(userId);
      
      // Update local state
      setUsers(users.filter(user => user.id !== userId));
      
      toast.success('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };
  
  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });
  
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            User Management
          </h2>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {filteredUsers.length} of {users.length} users
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as 'all' | 'user' | 'admin')}
            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {user.role === 'admin' && (
                      <ShieldCheckIcon className="h-4 w-4 text-yellow-500 mr-1" />
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as 'user' | 'admin')}
                      className="text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-600 cursor-pointer"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                    
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="p-1"
                      title="Delete user"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No users found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || selectedRole !== 'all' 
                ? 'Try adjusting your search criteria.'
                : 'No users have registered yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};