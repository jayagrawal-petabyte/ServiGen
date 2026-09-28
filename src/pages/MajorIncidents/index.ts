// Barrel file — import from here, not from deep paths

export { default as SCR021_MajorIncidentsDesign } from './SCR021_MajorIncidentsDesign';
export { default as SCR022_MajorIncidentsLive } from './SCR022_MajorIncidentsLive';

export type {
  MajorIncident,
  ActivityFeedEntry,
  Priority,
  LifecycleStage,
  SidebarGroup,
  SidebarListItem,
} from './types/majorIncident.types';
