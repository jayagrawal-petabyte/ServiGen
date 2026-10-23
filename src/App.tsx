import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'

// Auth
import { AuthProvider } from './pages/Auth'
const AuthPage = React.lazy(() => import('./pages/Auth').then((m) => ({ default: m.AuthPage })))
const OrganisationUsersScreen = React.lazy(() => import('./pages/Auth').then((m) => ({ default: m.OrganisationUsersScreen })))

// Dashboard
const Dashboard = React.lazy(() => import('./pages/Dashboard/Dashboard'))

// Incidents
const Incidents = React.lazy(() => import('./pages/Incidents'))

// Major Incidents
const MajorIncidentsDesign = React.lazy(() => import('./pages/MajorIncidents').then((m) => ({ default: m.MajorIncidentsDesign })))
const MajorIncidentsLive = React.lazy(() => import('./pages/MajorIncidents').then((m) => ({ default: m.MajorIncidentsLive })))
const MajorIncidentsWithFeed = React.lazy(() => import('./pages/MajorIncidents').then((m) => ({ default: m.MajorIncidentsWithFeed })))
const MajorIncidentsListMockup = React.lazy(() => import('./pages/MajorIncidents').then((m) => ({ default: m.MajorIncidentsListMockup })))

// Projects & Calendar
const ProjectsPage = React.lazy(() => import('./pages/Projects/ProjectsPage'))
const CalendarPage = React.lazy(() => import('./pages/Calendar/CalendarPage'))

// Requests & Services Catalogue
const RequestsPage = React.lazy(() => import('./pages/Requests/RequestsPage'))
const ServiceCatalogue = React.lazy(() => import('./pages/ServicesCatalogue/ServiceCatalogue'))

// Approvals
const ApprovalsPage = React.lazy(() => import('./pages/Approvals/ApprovalsPage'))

// Article Drafts
const ArticleDraftsPage = React.lazy(() => import('./pages/ArticleDrafts/ArticleDraftsPage'))

// My Work
const MyWork = React.lazy(() => import('./pages/MyWork/MyWork'))

// On Hold Tickets
const OnHoldTicketScreen = React.lazy(() => import('./pages/OnHoldTicket/TicketScreen/OnHoldTicketScreen'))

// Custom Lists
const CustomLists = React.lazy(() => import('./pages/CustomLists/CustomLists'))

// Team Incidents
const FirstLineLive = React.lazy(() => import('./pages/TeamIncidents/FirstLineLive'))
const FirstLineDesign = React.lazy(() => import('./pages/TeamIncidents/FirstLineDesign'))
const SecondLineLive = React.lazy(() => import('./pages/TeamIncidents/SecondLineLive'))
const SecondLineDesign = React.lazy(() => import('./pages/TeamIncidents/SecondLineDesign'))

// Reporting
const IncidentsByCategoryReport = React.lazy(() => import('./pages/Reporting/IncidentsByCategoryReport'))

// CMDB
const CmdbPage = React.lazy(() => import('./pages/CMDB/CmdbPage').then((m) => ({ default: m.CmdbPage })))
const ServiceCisPage = React.lazy(() => import('./pages/CMDB/ServiceCisPage').then((m) => ({ default: m.ServiceCisPage })))

// Change Requests
const ChangeRequestsPage = React.lazy(() => import('./pages/ChangeRequests/ChangeRequestsPage').then((m) => ({ default: m.ChangeRequestsPage })))
const ChangeRequestDetailModal = React.lazy(() => import('./pages/ChangeRequests/ChangeRequestDetailModal').then((m) => ({ default: m.ChangeRequestDetailModal })))
const CreateChangeModal = React.lazy(() => import('./pages/ChangeRequests/CreateChangeModal').then((m) => ({ default: m.CreateChangeModal })))
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
        <React.Suspense
          fallback={
            <div className="flex h-screen w-screen items-center justify-center bg-[#faf6f2]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-[#eb6a47] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold text-slate-500">Loading ServiGen...</span>
              </div>
            </div>
          }
        >
          <Routes>
            {/* Auth (Standalone screen - No sidebar) */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />

            {/* All App Screens (Inside Figma Left Sidebar Shell) */}
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/incidents" element={<Incidents />} />
              <Route path="/my-work" element={<MyWork />} />
              <Route path="/major-incidents" element={<Navigate to="/major-incidents/live" replace />} />
              <Route path="/major-incidents/design" element={<MajorIncidentsDesign />} />
              <Route path="/major-incidents/live" element={<MajorIncidentsLive />} />
              <Route path="/major-incidents/feed" element={<MajorIncidentsWithFeed />} />
              <Route path="/major-incidents/list" element={<MajorIncidentsListMockup />} />
              <Route path="/problems" element={<Incidents />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/requests" element={<RequestsPage />} />
              <Route path="/services-catalogue" element={<ServiceCatalogue />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/article-drafts" element={<ArticleDraftsPage />} />
              <Route path="/on-hold" element={<OnHoldTicketScreen />} />
              <Route path="/custom-lists" element={<CustomLists />} />
              <Route path="/organisations" element={<OrganisationUsersScreen />} />
              <Route path="/contacts" element={<OrganisationUsersScreen />} />
              <Route path="/team/1st-line-live" element={<FirstLineLive />} />
              <Route path="/team/1st-line-design" element={<FirstLineDesign />} />
              <Route path="/team/2nd-line-live" element={<SecondLineLive />} />
              <Route path="/team/2nd-line-design" element={<SecondLineDesign />} />
              <Route path="/cmdb" element={<CmdbPage />} />
              <Route path="/cmdb/services" element={<ServiceCisPage />} />
              <Route path="/change-requests" element={<ChangeRequestsWrapper />} />
              <Route path="/reports/incidents-by-category" element={<IncidentsByCategoryReport />} />
              <Route path="/reporting" element={<IncidentsByCategoryReport />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
