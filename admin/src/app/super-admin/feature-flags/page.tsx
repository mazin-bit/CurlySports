import { redirect } from 'next/navigation';

export default function SuperAdminFeatureFlagsRedirect() {
  redirect('/super-admin/features');
}
