import { redirect } from 'next/navigation';

export default function SuperAdminMaintenanceRedirect() {
  redirect('/super-admin/features');
}
