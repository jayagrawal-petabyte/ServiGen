// Canonical live implementation of Major Incidents
export { default as MajorIncidentsPage, default as MajorIncidentsLive, default as SCR022_MajorIncidentsLive } from './SCR022_MajorIncidentsLive';

// Aliases for legacy design and mock imports to ensure zero breakage while routing to the live canonical component
export { default as MajorIncidentsDesign, default as SCR021_MajorIncidentsDesign } from './SCR022_MajorIncidentsLive';
export { default as MajorIncidentsWithFeed, default as SCR023_MajorIncidentsWithFeed } from './SCR022_MajorIncidentsLive';
export { default as MajorIncidentsListMockup, default as SCR025_MajorIncidentsListMockup } from './SCR022_MajorIncidentsLive';

export { default } from './SCR022_MajorIncidentsLive';

export type {
  MajorIncident,
  ActivityFeedEntry,
  Priority,
  LifecycleStage,
  SidebarGroup,
  SidebarListItem,
} from './types/majorIncident.types';

