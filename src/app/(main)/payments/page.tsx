import { PageHeader } from '@/components/page-header';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { payments, students } from '@/lib/data';
import { Payment, Student } from '@/types';
import { Badge } from '@/components/ui/badge';

export default function PaymentsPage() {
  const getStudentName = (studentId: string): string => {
    return students.find(s => s.id === studentId)?.name || 'Unknown Student';
  };

  const getBadgeVariant = (status: Payment['status']) => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div>
      <PageHeader title="Payments" description="Track student payments and manage outstanding balances." />
      
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{getStudentName(payment.studentId)}</TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>{payment.date.toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={getBadgeVariant(payment.status)}>{payment.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
