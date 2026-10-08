import { createContext, useContext } from 'react';

export const GirlhoodBasePath = createContext('/programs/girlhood');
export const useGirlhoodBasePath = () => useContext(GirlhoodBasePath);
