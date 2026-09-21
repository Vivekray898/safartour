import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import Link from 'next/link';
import { CheckSquare } from 'lucide-react';

export default async function TasksPage() {
  const session = await requireAuth();
  const db = getDb();

  const tasks = await db.prepare(`
    SELECT t.*,
      tr.reference as trip_reference, tr.destination,
      c.name as customer_name,
      u.name as assigned_to_name
    FROM tasks t
    JOIN trips tr ON t.trip_id = tr.id
    LEFT JOIN customers c ON tr.customer_id = c.id
    LEFT JOIN users u ON t.assigned_to = u.id
    WHERE tr.archived = 0
    ORDER BY t.due_date ASC, t.created_at DESC
  `).all();

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500">{tasks.length} total tasks</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-bold text-amber-700">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-xl font-bold text-blue-700">{inProgressCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-xl font-bold text-green-700">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trip</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className="text-gray-400">
                      <CheckSquare className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-medium">No tasks found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          task.status === 'completed' ? 'bg-green-500 border-green-500' :
                          task.status === 'in_progress' ? 'bg-blue-500 border-blue-500' :
                          'border-gray-300'
                        }`}>
                          {task.status === 'completed' && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-gray-900">{task.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/crm/leads/${task.trip_id}`} className="text-sm font-medium text-green-700 hover:text-green-800">
                        {task.trip_reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{task.customer_name || 'No customer'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.destination || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{task.assigned_to_name || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        task.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                        task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        task.status === 'completed' ? 'bg-green-100 text-green-700' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
