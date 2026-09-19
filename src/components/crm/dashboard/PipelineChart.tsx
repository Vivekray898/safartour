import { CRM_STATUSES } from '@/config/crm';

interface PipelineChartProps {
  pipeline: Array<{
    status: string;
    count: number;
    customer_name: string | null;
    reference: string;
    destination: string | null;
    start_date: string | null;
  }>;
}

const pipelineOrder = [
  'new',
  'contacted',
  'requirement_collected',
  'quotation_preparing',
  'quotation_sent',
  'negotiation',
  'booking_pending',
  'booked',
  'trip_ongoing',
  'completed',
];

const colors: Record<string, string> = {
  new: 'bg-gray-200',
  contacted: 'bg-blue-200',
  requirement_collected: 'bg-blue-300',
  quotation_preparing: 'bg-amber-200',
  quotation_sent: 'bg-purple-200',
  negotiation: 'bg-amber-300',
  booking_pending: 'bg-green-200',
  booked: 'bg-green-300',
  trip_ongoing: 'bg-green-400',
  completed: 'bg-green-500',
  lost: 'bg-red-200',
  cancelled: 'bg-gray-300',
};

export default function PipelineChart({ pipeline }: PipelineChartProps) {
  const getStatusConfig = (status: string) => {
    return CRM_STATUSES.find(s => s.value === status);
  };

  const totalLeads = pipeline.reduce((sum, s) => sum + s.count, 0);
  const maxCount = Math.max(...pipeline.map(p => p.count), 1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Pipeline</h2>

      <div className="flex items-end gap-2 h-40">
        {pipelineOrder.map(status => {
          const data = pipeline.find(p => p.status === status);
          const count = data?.count || 0;
          const height = totalLeads > 0 ? (count / maxCount) * 100 : 0;
          const config = getStatusConfig(status);

          return (
            <div key={status} className="flex-1 flex flex-col items-center gap-2">
              <div
                className={`w-full rounded-t-md ${colors[status] || 'bg-gray-200'} transition-all hover:opacity-80 ${height > 0 ? '' : 'min-h-[4px]'}`}
                style={{ height: `${Math.max(height, 4)}%` }}
                title={`${config?.label || status}: ${count}`}
              />
              <div className="text-xs text-gray-600 text-center">
                {count}
              </div>
              <div className="text-xs text-gray-500 text-center leading-tight max-w-[60px]">
                {config?.label || status}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Total:</span>
          <span className="font-semibold text-gray-900">{totalLeads} leads</span>
        </div>
        {totalLeads > 0 && (
          <div className="mt-2 flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-500">Conversion:</span>
              <span className="ml-1 font-medium text-gray-900">
                {Math.round((pipeline.find(p => p.status === 'completed')?.count || 0) / totalLeads * 100)}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Booked:</span>
              <span className="ml-1 font-medium text-gray-900">
                {pipeline.filter(p => ['booked', 'trip_ongoing', 'completed'].includes(p.status)).reduce((sum, p) => sum + p.count, 0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
