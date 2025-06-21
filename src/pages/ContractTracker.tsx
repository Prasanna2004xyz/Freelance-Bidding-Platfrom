import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { contractsApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

const STATUS_COLUMNS = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export function ContractTracker() {
  const { contractId } = useParams();
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function fetchContract() {
      setLoading(true);
      try {
        const res = await contractsApi.getContractById(contractId!);
        setContract(res.data);
      } catch {
        setContract(null);
      } finally {
        setLoading(false);
      }
    }
    if (contractId) fetchContract();
  }, [contractId]);

  const handleStatusChange = async (taskId: string, status: string) => {
    setUpdating(true);
    try {
      await contractsApi.updateTaskStatus(contractId!, taskId, status);
      // Refresh contract
      const res = await contractsApi.getContractById(contractId!);
      setContract(res.data);
      toast.success('Task updated!');
    } catch {
      toast.error('Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-silver-100 mb-6">Contract Tracker</h1>
      {loading ? (
        <div className="text-silver-400">Loading contract...</div>
      ) : !contract ? (
        <div className="text-silver-400">Contract not found.</div>
      ) : (
        <>
          <Card className="mb-8">
            <div className="font-semibold text-silver-100 text-xl mb-2">{contract.jobId?.title}</div>
            <div className="text-silver-400 mb-1">Client: {contract.clientId?.name}</div>
            <div className="text-silver-400 mb-1">Freelancer: {contract.freelancerId?.name}</div>
            <div className="text-silver-400 mb-1">Amount: ${contract.amount}</div>
            <div className="text-silver-400 mb-1">Status: {contract.status}</div>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STATUS_COLUMNS.map(col => (
              <div key={col.key}>
                <h2 className="text-xl font-bold text-silver-100 mb-4">{col.label}</h2>
                <div className="space-y-4">
                  {contract.tasks?.filter((t: any) => t.status === col.key).map((task: any) => (
                    <Card key={task._id} className="p-4">
                      <div className="font-semibold text-silver-100 mb-2">{task.title}</div>
                      <div className="text-silver-400 mb-2">{task.description}</div>
                      <div className="flex gap-2">
                        {STATUS_COLUMNS.filter(s => s.key !== task.status).map(s => (
                          <Button key={s.key} size="sm" onClick={() => handleStatusChange(task._id, s.key)} loading={updating}>
                            Move to {s.label}
                          </Button>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 