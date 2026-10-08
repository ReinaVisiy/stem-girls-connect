import { lazy, Suspense } from 'react';
import type { SpecialProgramPageProps } from '../../pages/programs/specialProgramTemplates';
import NotFound from '../../pages/NotFound';
import { isGirlhoodSubPath } from '../../../shared/girlhoodRoutes';
import { GirlhoodBasePath } from './GirlhoodPaths';
import GirlhoodLayout from './components/GirlhoodLayout';
import './girlhood.css';
import { CampaignAvailabilityProvider } from './components/CampaignAvailability';

const pages = {
  '': lazy(() => import('./pages/GirlhoodHome')),
  'share-your-voice': lazy(() => import('./pages/GirlhoodSubmit')),
  wall: lazy(() => import('./pages/GirlhoodWall')),
  withdraw: lazy(() => import('./pages/GirlhoodWithdraw')),
  privacy: lazy(() => import('./pages/GirlhoodPrivacy')),
};

export default function GirlhoodProgram({ program, subPath }: SpecialProgramPageProps) {
  const normalized = subPath.replace(/\/$/, '');
  if (program.slug !== 'girlhood' || !isGirlhoodSubPath(normalized)) return <NotFound />;
  const Page = pages[normalized as keyof typeof pages];
  return (
    <GirlhoodBasePath.Provider value={`/programs/${encodeURIComponent(program.slug)}`}>
      <CampaignAvailabilityProvider>
      <GirlhoodLayout>
        <Suspense fallback={<p role="status" className="p-8">Loading…</p>}>
          <Page />
        </Suspense>
      </GirlhoodLayout>
      </CampaignAvailabilityProvider>
    </GirlhoodBasePath.Provider>
  );
}
