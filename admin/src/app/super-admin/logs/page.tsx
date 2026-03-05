import { redirect } from 'next/navigation';

export default function SuperAdminLogsRedirect() {
  redirect('/super-admin/audit');
}
