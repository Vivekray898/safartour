import { CRM_STATUSES, getStatusColor } from '@/config/crm';
import { CRM_QUOTATION_STATUSES } from '@/config/crm';
import { CRM_TASK_STATUSES, CRM_FOLLOWUP_TYPES, CRM_PRIORITIES } from '@/config/crm';
import { CRM_PAYMENT_METHODS } from '@/config/crm';
import { CRM_LEAD_SOURCES } from '@/config/crm';

interface CRMStatusBadgeProps {
  status: string;
  type?: 'trip' | 'quotation' | 'payment' | 'task' | 'followup' | 'source';
  size?: 'sm' | 'default';
}

export function CRMStatusBadge({ status, type = 'trip', size = 'default' }: CRMStatusBadgeProps) {
  const statusConfig = CRM_STATUSES.find(s => s.value === status);
  const label = statusConfig?.label || status;

  const colorClasses: Record<string, string> = {
    neutral: size === 'sm' ? 'bg-gray-100 text-gray-600 text-xs px-2 py-0.5' : 'bg-gray-100 text-gray-700 px-2.5 py-1',
    blue: size === 'sm' ? 'bg-blue-100 text-blue-700 text-xs px-2 py-0.5' : 'bg-blue-100 text-blue-700 px-2.5 py-1',
    amber: size === 'sm' ? 'bg-amber-100 text-amber-700 text-xs px-2 py-0.5' : 'bg-amber-100 text-amber-700 px-2.5 py-1',
    purple: size === 'sm' ? 'bg-purple-100 text-purple-700 text-xs px-2 py-0.5' : 'bg-purple-100 text-purple-700 px-2.5 py-1',
    green: size === 'sm' ? 'bg-green-100 text-green-700 text-xs px-2 py-0.5' : 'bg-green-100 text-green-700 px-2.5 py-1',
    red: size === 'sm' ? 'bg-red-100 text-red-700 text-xs px-2 py-0.5' : 'bg-red-100 text-red-700 px-2.5 py-1',
    gray: size === 'sm' ? 'bg-gray-100 text-gray-500 text-xs px-2 py-0.5' : 'bg-gray-100 text-gray-500 px-2.5 py-1',
  };

  if (type === 'quotation') {
    const quotationStatus = CRM_QUOTATION_STATUSES.find(s => s.value === status);
    const colors: Record<string, string> = {
      neutral: size === 'sm' ? 'bg-gray-100 text-gray-600 text-xs px-2 py-0.5' : 'bg-gray-100 text-gray-700 px-2.5 py-1',
      blue: size === 'sm' ? 'bg-blue-100 text-blue-700 text-xs px-2 py-0.5' : 'bg-blue-100 text-blue-700 px-2.5 py-1',
      amber: size === 'sm' ? 'bg-amber-100 text-amber-700 text-xs px-2 py-0.5' : 'bg-amber-100 text-amber-700 px-2.5 py-1',
      green: size === 'sm' ? 'bg-green-100 text-green-700 text-xs px-2 py-0.5' : 'bg-green-100 text-green-700 px-2.5 py-1',
      red: size === 'sm' ? 'bg-red-100 text-red-700 text-xs px-2 py-0.5' : 'bg-red-100 text-red-700 px-2.5 py-1',
    };
    const label = quotationStatus?.label || status;
    return (
      <span className={`inline-flex items-center font-medium rounded-full ${colors[quotationStatus?.color || 'neutral'] || colors.neutral}`}>
        {label}
      </span>
    );
  }

  if (type === 'task') {
    const taskStatus = CRM_TASK_STATUSES.find(s => s.value === status);
    const colors: Record<string, string> = {
      neutral: size === 'sm' ? 'bg-gray-100 text-gray-600 text-xs px-2 py-0.5' : 'bg-gray-100 text-gray-700 px-2.5 py-1',
      green: size === 'sm' ? 'bg-green-100 text-green-700 text-xs px-2 py-0.5' : 'bg-green-100 text-green-700 px-2.5 py-1',
      amber: size === 'sm' ? 'bg-amber-100 text-amber-700 text-xs px-2 py-0.5' : 'bg-amber-100 text-amber-700 px-2.5 py-1',
    };
    const label = taskStatus?.label || status;
    return (
      <span className={`inline-flex items-center font-medium rounded-full ${colors[taskStatus?.value || 'neutral'] || colors.neutral}`}>
        {label}
      </span>
    );
  }

  if (type === 'followup') {
    const followupType = CRM_FOLLOWUP_TYPES.find(s => s.value === status);
    const colors: Record<string, string> = {
      neutral: size === 'sm' ? 'bg-gray-100 text-gray-600 text-xs px-2 py-0.5' : 'bg-gray-100 text-gray-700 px-2.5 py-1',
      green: size === 'sm' ? 'bg-green-100 text-green-700 text-xs px-2 py-0.5' : 'bg-green-100 text-green-700 px-2.5 py-1',
      red: size === 'sm' ? 'bg-red-100 text-red-700 text-xs px-2 py-0.5' : 'bg-red-100 text-red-700 px-2.5 py-1',
    };
    if (['pending', 'completed', 'missed'].includes(status)) {
      const label = status === 'pending' ? 'Pending' : status === 'completed' ? 'Completed' : 'Missed';
      return (
        <span className={`inline-flex items-center font-medium rounded-full ${colors[status] || colors.neutral}`}>
          {label}
        </span>
      );
    }
    const label = followupType?.label || status;
    return (
      <span className={`inline-flex items-center font-medium rounded-full ${colors.green}`}>
        {label}
      </span>
    );
  }

  if (type === 'source') {
    const source = CRM_LEAD_SOURCES.find(s => s.value === status);
    return (
      <span className="inline-flex items-center font-medium bg-gray-50 text-gray-600 px-2.5 py-1 rounded-full text-xs border border-gray-200">
        {source?.label || status}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colorClasses[getStatusColor(status)]}`}>
      {label}
    </span>
  );
}

interface CRMPriorityBadgeProps {
  priority: string;
  size?: 'sm' | 'default';
}

export function CRMPriorityBadge({ priority, size = 'default' }: CRMPriorityBadgeProps) {
  const priorityConfig = CRM_PRIORITIES.find(p => p.value === priority);
  const colorClasses: Record<string, string> = {
    low: size === 'sm' ? 'bg-gray-100 text-gray-600 text-xs px-2 py-0.5' : 'bg-gray-100 text-gray-600 px-2.5 py-1',
    medium: size === 'sm' ? 'bg-blue-100 text-blue-700 text-xs px-2 py-0.5' : 'bg-blue-100 text-blue-700 px-2.5 py-1',
    high: size === 'sm' ? 'bg-amber-100 text-amber-700 text-xs px-2 py-0.5' : 'bg-amber-100 text-amber-700 px-2.5 py-1',
    urgent: size === 'sm' ? 'bg-red-100 text-red-700 text-xs px-2 py-0.5' : 'bg-red-100 text-red-700 px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colorClasses[priority] || colorClasses.medium}`}>
      {priorityConfig?.label || priority}
    </span>
  );
}

export function CRMTripTypeBadge({ tripType }: { tripType: string }) {
  if (!tripType) return null;
  return (
    <span className="inline-flex items-center font-medium bg-gray-50 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200">
      {tripType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
}

export function CRMLeadSourceBadge({ source }: { source: string }) {
  if (!source) return null;
  const sourceConfig = CRM_LEAD_SOURCES.find(s => s.value === source);
  return (
    <span className="inline-flex items-center font-medium bg-gray-50 text-gray-500 px-2 py-0.5 rounded text-xs border border-gray-100">
      {sourceConfig?.label || source}
    </span>
  );
}

export function CRMPaymentMethodBadge({ method }: { method: string }) {
  if (!method) return null;
  const methodConfig = CRM_PAYMENT_METHODS.find(m => m.value === method);
  return (
    <span className="inline-flex items-center font-medium bg-gray-50 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-100">
      {methodConfig?.label || method}
    </span>
  );
}
