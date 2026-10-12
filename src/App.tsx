import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'

// Auth
import { AuthPage, AuthProvider } from './pages/Auth'

// Dashboard
import Dashboard from './pages/Dashboard/Dashboard'

// Incidents
import Incidents from './pages/Incidents'

// Major Incidents
import {
  SCR021_MajorIncidentsDesign,
  SCR022_MajorIncidentsLive,
  SCR023_MajorIncidentsWithFeed,
  SCR025_MajorIncidentsListMockup,
} from './pages/MajorIncidents'

// Projects & Calendar
import ProjectsPage from './pages/Projects/ProjectsPage'
import CalendarPage from './pages/Calendar/CalendarPage'

// Services Catalogue
import ServiceCatalogue from './pages/ServicesCatalogue/ServiceCatalogue'

// Approvals
import ApprovalsPage from './pages/Approvals/ApprovalsPage'

// Article Drafts
import ArticleDraftsPage from './pages/ArticleDrafts/ArticleDraftsPage'

// My Work
import MyWork from './pages/MyWork/MyWork'

// On Hold Tickets
import OnHoldTicketScreen from './pages/OnHoldTicket/TicketScreen/OnHoldTicketScreen'

// Custom Lists
import CustomLists from './pages/CustomLists/CustomLists'

// Team Incidents
import FirstLineLive from './pages/TeamIncidents/FirstLineLive'
import FirstLineDesign from './pages/TeamIncidents/FirstLineDesign'
import SecondLineLive from './pages/TeamIncidents/SecondLineLive'
import SecondLineDesign from './pages/TeamIncidents/SecondLineDesign'

// CMDB
import { CmdbPage } from './pages/CMDB/CmdbPage'
import { ServiceCisPage } from './pages/CMDB/ServiceCisPage'

// Change Requests
import { ChangeRequestsPage } from './pages/ChangeRequests/ChangeRequestsPage'
import { ChangeRequestDetailModal } from './pages/ChangeRequests/ChangeRequestDetailModal'
import { CreateChangeModal } from './pages/ChangeRequests/CreateChangeModal'
import { mockChangeRequests } from './data/mockCmdbData'
import type { ChangeRequest } from './types/cmdb'
import { usePersistentState } from './utils/persistentState'

// Change Requests wrapper (manages modal state locally)
function ChangeRequestsWrapper() {
  const [changeRequests, setChangeRequests] = usePersistentState<ChangeRequest[]>(
    'servigen_change_requests_v1',
    mockChangeRequests
  )
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const handleToggleSubtask = (subtaskId: string) => {
    if (!selectedCR) return
    const updatedSubtasks = selectedCR.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )
    const completedCount = updatedSubtasks.filter((st) => st.completed).length
    const completionPercent = Math.round((completedCount / (updatedSubtasks.length || 1)) * 100)
    const updatedCR: ChangeRequest = {
      ...selectedCR,
      subtasks: updatedSubtasks,
      completionPercent,
    }
    setSelectedCR(updatedCR)
    setChangeRequests((prev) => prev.map((cr) => (cr.id === updatedCR.id ? updatedCR : cr)))
  }

  return (
    <>
      <ChangeRequestsPage
        changeRequests={changeRequests}
        onSelectChangeRequest={(cr) => setSelectedCR(cr)}
        onOpenCreateModal={() => setCreateOpen(true)}
      />
      <ChangeRequestDetailModal
        changeRequest={selectedCR}
        onClose={() => setSelectedCR(null)}
        onToggleSubtask={handleToggleSubtask}
      />
      <CreateChangeModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(newChange) => {
          setChangeRequests((prev) => [newChange, ...prev])
          setCreateOpen(false)
        }}
      />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth (Standalone screen - No sidebar) */}
          <Route path="/auth" element={<AuthPage />} />

          {/* All App Screens (Inside Figma Left Sidebar Shell) */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/my-work" element={<MyWork />} />
            <Route path="/major-incidents/design" element={<SCR021_MajorIncidentsDesign />} />
            <Route path="/major-incidents/live" element={<SCR022_MajorIncidentsLive />} />
            <Route path="/major-incidents/feed" element={<SCR023_MajorIncidentsWithFeed />} />
            <Route path="/major-incidents/list" element={<SCR025_MajorIncidentsListMockup />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/services-catalogue" element={<ServiceCatalogue />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/article-drafts" element={<ArticleDraftsPage />} />
            <Route path="/on-hold" element={<OnHoldTicketScreen />} />
            <Route path="/custom-lists" element={<CustomLists />} />
            <Route path="/team/1st-line-live" element={<FirstLineLive />} />
            <Route path="/team/1st-line-design" element={<FirstLineDesign />} />
            <Route path="/team/2nd-line-live" element={<SecondLineLive />} />
            <Route path="/team/2nd-line-design" element={<SecondLineDesign />} />
            <Route path="/cmdb" element={<CmdbPage />} />
            <Route path="/cmdb/services" element={<ServiceCisPage />} />
            <Route path="/change-requests" element={<ChangeRequestsWrapper />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

