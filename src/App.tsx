import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'

// Auth
import { AuthPage, AuthProvider, OrganisationUsersScreen } from './pages/Auth'

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
import { mockChangeRequests } from './data/mockCmdbData'
import type { ChangeRequest } from './types/cmdb'
import { changeRequestsService } from './services/changeRequestsService'
import { useSearchParams } from 'react-router-dom'

// Change Requests wrapper (connects to live API and handles modal states)
function ChangeRequestsWrapper() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>(mockChangeRequests)
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [fromRequestData, setFromRequestData] = useState<{ id: string; summary: string; category?: string; requester?: string } | null>(null)

  // Fetch change requests on mount from backend and local cache
  React.useEffect(() => {
    let mounted = true
    changeRequestsService.getAll().then((crs) => {
      if (mounted) {
        setChangeRequests(crs)
        const targetId = searchParams.get('id')
        if (targetId) {
          const match = crs.find((c) => c.id.toLowerCase() === targetId.toLowerCase() || c.id.replace('#', '').toLowerCase() === targetId.toLowerCase())
          if (match) setSelectedCR(match)
        }
      }
    })
    return () => { mounted = false }
  }, [searchParams])

  // Handle URL parameters for fromRequestId or openCreate
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
    const updatedList = changeRequests.map((cr) => (cr.id === updatedCR.id ? updatedCR : cr))
    setChangeRequests(updatedList)
    changeRequestsService.persistAll(updatedList)
  }

  const handleCreateNewChange = async (newChange: ChangeRequest) => {
    const created = await changeRequestsService.create({
      title: newChange.title,
      description: newChange.description,
      type: newChange.type,
      risk: newChange.risk,
      linkedCiName: newChange.linkedCiName,
      agentName: newChange.agentName,
      scheduledStart: newChange.scheduledStart,
      scheduledEnd: newChange.scheduledEnd,
      targetHours: newChange.targetHours,
      linkedRequestId: newChange.linkedRequestId,
      linkedRequestSummary: newChange.linkedRequestSummary,
    })
    setChangeRequests((prev) => [created, ...prev])
    setCreateOpen(false)
    setFromRequestData(null)
    // Clear URL params if present
    if (searchParams.get('fromRequestId') || searchParams.get('openCreate')) {
      setSearchParams({})
    }
  }

  return (
    <>
      <ChangeRequestsPage
        changeRequests={changeRequests}
        onSelectChangeRequest={(cr) => setSelectedCR(cr)}
        onOpenCreateModal={() => {
          setFromRequestData(null)
          setCreateOpen(true)
        }}
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
      />
      <CreateChangeModal
        isOpen={createOpen}
        fromRequest={fromRequestData}
        onClose={() => {
          setCreateOpen(false)
          setFromRequestData(null)
          if (searchParams.get('fromRequestId') || searchParams.get('openCreate')) {
            setSearchParams({})
          }
        }}
        onCreate={handleCreateNewChange}
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

