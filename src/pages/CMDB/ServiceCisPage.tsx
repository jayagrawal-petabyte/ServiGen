import React from 'react';
import { CmdbPage } from './CmdbPage';
import type { ServiceCI } from '../../types/cmdb';

interface ServiceCisPageProps {
  serviceCis?: ServiceCI[];
}

export const ServiceCisPage: React.FC<ServiceCisPageProps> = () => {
  return <CmdbPage initialView="services" />;
};

export default ServiceCisPage;
