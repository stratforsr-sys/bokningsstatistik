'use client';

// Dashboard client component with role-based routing
import { JWTPayload } from '@/lib/auth/jwt';
import UserDashboard from '@/components/dashboard/user-dashboard';
import AdminDashboard from '@/components/dashboard/admin-dashboard';

export default function DashboardClient({ user }: { user: JWTPayload }) {
  // Route to appropriate dashboard based on user role
  if (user.role === 'USER') {
    return <UserDashboard user={user} />;
  }

  // ADMIN and MANAGER see system-wide dashboard
  return <AdminDashboard user={user} />;
}
