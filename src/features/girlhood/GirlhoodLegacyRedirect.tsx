import { Navigate, useLocation, useParams } from 'react-router-dom';
import NotFound from '../../pages/NotFound';
import { isGirlhoodSubPath } from '../../../shared/girlhoodRoutes';

export default function GirlhoodLegacyRedirect() {
  const subPath = useParams()['*'] ?? '';
  const { search, hash } = useLocation();
  if (!isGirlhoodSubPath(subPath)) return <NotFound />;
  return <Navigate replace to={`/programs/girlhood${subPath ? '/' + subPath : ''}${search}${hash}`} />;
}
