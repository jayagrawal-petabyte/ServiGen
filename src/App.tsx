import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'

// Auth
import { AuthPage, AuthProvider, OrganisationUsersScreen } from './pages/Auth'

// Dashboard
import Dashboard from './pages/Dashboard/Dashboard'

// Incidents
import Incidents from './pages/Incidents'

// Major Incidents
import {
  MajorIncidentsDesign,
  MajorIncidentsLive,
  MajorIncidentsWithFeed,
  MajorIncidentsListMockup,
} from './pages/MajorIncidents'

// Projects & Calendar
import ProjectsPage from './pages/Projects/ProjectsPage'
import CalendarPage from './pages/Calendar/CalendarPage'

// Requests & Services Catalogue
import RequestsPage from './pages/Requests/RequestsPage'
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

// Reporting
import IncidentsByCategoryReport from './pages/Reporting/IncidentsByCategoryReport'

// CMDB
import { CmdbPage } from './pages/CMDB/CmdbPage'
import { ServiceCisPage } from './pages/CMDB/ServiceCisPage'

// Change Requests
import { ChangeRequestsPage } from './pages/ChangeRequests/ChangeRequestsPage'
import { ChangeRequestDetailModal } from './pages/ChangeRequests/ChangeRequestDetailModal'
import { CreateChangeModal } from './pages/ChangeRequests/CreateChangeModal'
import type { ChangeRequest, ChangeStatus } from './types/cmdb'
import {
  fetchChangeRequests,
  fetchChangeRequestById,
  createChangeRequest,
  updateChangeRequestStatus,
  toggleSubtaskCompletion,
} from './services/changeRequestsService'

// Change Requests wrapper (manages live data synchronization with service layer)
function ChangeRequestsWrapper() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([])
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [fromRequestData, setFromRequestData] = useState<{ id: string; summary: string; category?: string; requester?: string } | null>(null)

  const loadRequests = async () => {
    try {
      const res = await fetchChangeRequests()
      setChangeRequests(res.data)
      const targetId = searchParams.get('id')
      if (targetId) {
        const match = res.data.find((c) => c.id.toLowerCase() === targetId.toLowerCase() || c.id.replace('#', '').toLowerCase() === targetId.toLowerCase())
        if (match) setSelectedCR(match)
      }
    } catch (err) {
      console.error('[ChangeRequestsWrapper] Failed to fetch:', err)
    }
  }

  React.useEffect(() => {
    loadRequests()
  }, [searchParams])

  React.useEffect(() => {
    const fromRequestId = searchParams.get('fromRequestId')
    const summary = searchParams.get('summary')
    const category = searchParams.get('category')
    const openCreate = searchParams.get('openCreate')

    if (fromRequestId) {
      setFromRequestData({
        id: fromRequestId,
        summary: summary || `Request #${fromRequestId}`,
        category: category || undefined,
      })
      setCreateOpen(true)
    } else if (openCreate === 'true') {
      setCreateOpen(true)
    }
  }, [searchParams])

  const handleSelectCR = async (cr: ChangeRequest) => {
    try {
      const res = await fetchChangeRequestById(cr.id)
      setSelectedCR(res.data)
    } catch {
      setSelectedCR(cr)
    }
  }

  const handleCreateCR = async (newChange: Partial<ChangeRequest> & { title: string }) => {
    const res = await createChangeRequest(newChange)
    setChangeRequests((prev) => [res.data, ...prev])
    setCreateOpen(false)
    setFromRequestData(null)
    if (searchParams.get('fromRequestId') || searchParams.get('openCreate')) {
      setSearchParams({})
    }
  }

  const handleToggleSubtask = async (subtaskId: string) => {
    if (!selectedCR) return
    try {
      const res = await toggleSubtaskCompletion(selectedCR.id, subtaskId)
      setSelectedCR(res.data)
      setChangeRequests((prev) =>
        prev.map((item) => (item.id === res.data.id ? res.data : item))
      )
    } catch (err) {
      console.error('Error toggling subtask:', err)
    }
  }

  const handleStatusChange = async (newStatus: ChangeStatus) => {
    if (!selectedCR) return
    try {
      const res = await updateChangeRequestStatus(selectedCR.id, newStatus)
      setSelectedCR(res.data)
      setChangeRequests((prev) =>
        prev.map((item) => (item.id === res.data.id ? res.data : item))
      )
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  return (
    <>
      <ChangeRequestsPage
        changeRequests={changeRequests}
        onSelectChangeRequest={handleSelectCR}
        onOpenCreateModal={() => {
          setFromRequestData(null)
          setCreateOpen(true)
        }}
        onRefreshData={loadRequests}
      />
      <ChangeRequestDetailModal
        changeRequest={selectedCR}
        onClose={() => {
          setSelectedCR(null)
          if (searchParams.get('id')) {
            setSearchParams({})
          }
        }}
        onToggleSubtask={handleToggleSubtask}
        onChangeStatus={handleStatusChange}
      />
      <CreateChangeModal
        isOpen={createOpen}
        onClose={() => {
          setCreateOpen(false)
          setFromRequestData(null)
          if (searchParams.get('fromRequestId') || searchParams.get('openCreate')) {
            setSearchParams({})
          }
        }}
        onCreate={handleCreateCR}
      />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* Auth (Standalone screen - No sidebar) */}
          <Route path="/auth" element={<AuthPage />} />

          {/* All App Screens (Inside Figma Left Sidebar Shell) */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/incidents" element={<Incidents />} />
            <Route path="/my-work" element={<MyWork />} />
            <Route path="/major-incidents/design" element={<MajorIncidentsDesign />} />
            <Route path="/major-incidents/live" element={<MajorIncidentsLive />} />
            <Route path="/major-incidents/feed" element={<MajorIncidentsWithFeed />} />
            <Route path="/major-incidents/list" element={<MajorIncidentsListMockup />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/services-catalogue" element={<ServiceCatalogue />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/article-drafts" element={<ArticleDraftsPage />} />
            <Route path="/on-hold" element={<OnHoldTicketScreen />} />
            <Route path="/custom-lists" element={<CustomLists />} />
            <Route path="/organisations" element={<OrganisationUsersScreen />} />
            <Route path="/team/1st-line-live" element={<FirstLineLive />} />
            <Route path="/team/1st-line-design" element={<FirstLineDesign />} />
            <Route path="/team/2nd-line-live" element={<SecondLineLive />} />
            <Route path="/team/2nd-line-design" element={<SecondLineDesign />} />
            <Route path="/cmdb" element={<CmdbPage />} />
            <Route path="/cmdb/services" element={<ServiceCisPage />} />
            <Route path="/change-requests" element={<ChangeRequestsWrapper />} />
            <Route path="/reports/incidents-by-category" element={<IncidentsByCategoryReport />} />
            <Route path="/reporting" element={<IncidentsByCategoryReport />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
