import { useAuthStore } from '../../store/authStore';
import ReportesDuenoPage from './ReportesDuenoPage';
import AdminReportesPage from '../administrador/reportes/ReportesPage';

export default function ReportesPage() {
  const { user } = useAuthStore();

  if (user?.rol === 'DUENO') {
    return <ReportesDuenoPage />;
  }

  return <AdminReportesPage />;
}