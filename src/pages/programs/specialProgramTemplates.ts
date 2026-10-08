import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import type { ProgramDetail } from '../../lib/programs';

/**
 * Props every special program experience receives from the resolver.
 * The experience owns everything below /programs/:slug, including any
 * sub-routes (e.g. a future share-your-voice or wall page): `subPath`
 * is whatever follows the slug.
 */
export interface SpecialProgramPageProps {
  program: ProgramDetail;
  subPath: string;
}

type SpecialProgramPage = LazyExoticComponent<ComponentType<SpecialProgramPageProps>>;

/**
 * Registry of custom, coded program experiences, keyed by the
 * `page_template` value stored on the program. To add one:
 *   1. build the page component (lazy-loaded),
 *   2. add one line here.
 * Any `page_template` that is neither "standard" nor listed here is
 * handled gracefully by ProgramPageResolver.
 */
export const specialProgramTemplates: Record<string, SpecialProgramPage> = {
  girlhood: lazy(() => import('../../features/girlhood/GirlhoodProgram')),
};
