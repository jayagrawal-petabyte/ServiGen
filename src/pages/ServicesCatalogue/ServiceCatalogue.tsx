import { useMemo, useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import "./ServiceCatalogue.css";
import {
  fetchServices,
  fetchServiceCategories,
  submitServiceRequest,
  type ServiceItem,
  type SubmittedServiceRequest,
} from "../../services/servicesCatalogueService";
import { useAuth } from "../Auth/AuthContext";
import { GlobalNavbarActions } from "../../components/shared/GlobalNavbarActions";

type CategoryFilter = string;

type RequestState = "idle" | "submitting" | "error" | "success";

const categoryClass = (category: string): string => {
  const c = (category || "").toLowerCase();
  if (c.includes("business")) return "business-applications";
  if (c.includes("end-user") || c.includes("access")) return "end-user-catalogue";
  return "services";
};

type ServiceCardProps = {
  service: ServiceItem;
  onDetails: (service: ServiceItem) => void;
  onRequest: (service: ServiceItem) => void;
};

function ServiceCard({ service, onDetails, onRequest }: ServiceCardProps) {
  return (
    <article className="service-card">
      <div className="service-card-top">
        <div className={`service-icon service-icon-${categoryClass(service.category)}`}>
          {service.icon || "📦"}
        </div>
        <span className="service-category">{service.category}</span>
      </div>

      <h3>{service.name}</h3>
      <p>{service.description}</p>

      <div className="service-card-actions">
        <button type="button" className="details-button" onClick={() => onDetails(service)}>
          View details
        </button>
        <button type="button" className="request-button" onClick={() => onRequest(service)}>
          Request
        </button>
      </div>
    </article>
  );
}

export default function ServiceCatalogue() {
  const { user } = useAuth();
  const [servicesList, setServicesList] = useState<ServiceItem[]>([]);
  const [categories, setCategories] = useState<string[]>([
    "All Services",
  ]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All Services");
  const [searchText, setSearchText] = useState("");
  const [detailsService, setDetailsService] = useState<ServiceItem | null>(null);

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestService, setRequestService] = useState<ServiceItem | null>(null);
  const [requestDetails, setRequestDetails] = useState("");
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [submittedResult, setSubmittedResult] = useState<SubmittedServiceRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic custom form field specifications (SR-1)
  const [laptopModel, setLaptopModel] = useState('14" High Performance Laptop (M-Series / Intel i7)');
  const [laptopMemory, setLaptopMemory] = useState('32 GB Unified RAM');
  const [deliveryLocation, setDeliveryLocation] = useState('Corporate Office Desk Pickup - London HQ');
  const [softwareLicense, setSoftwareLicense] = useState('Full Creative / Developer License');
  const [softwareJustification, setSoftwareJustification] = useState('Core workflow requirement for active sprint delivery.');
  const [accessEnv, setAccessEnv] = useState('Staging & Production Read-Only');
  const [accessRole, setAccessRole] = useState('Developer / Contributor');

  // Load categories and initial services from live backend API
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const [cats, servs] = await Promise.all([
          fetchServiceCategories(),
          fetchServices(),
        ]);
        if (mounted) {
          if (cats && cats.length > 0) setCategories(cats);
          setServicesList(servs || []);
        }
      } catch (err) {
        console.warn("[ServiceCatalogue] Error loading services data:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredServices = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return servicesList.filter((service) => {
      const matchesCategory =
        selectedCategory === "All Services" ||
        service.category.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSearch =
        !search ||
        service.name.toLowerCase().includes(search) ||
        service.description.toLowerCase().includes(search) ||
        service.category.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [servicesList, selectedCategory, searchText]);

  const openRequest = (service?: ServiceItem) => {
    setDetailsService(null);
    setRequestService(service ?? (servicesList[0] || null));
    setRequestDetails("");
    setRequestState("idle");
    setSubmittedResult(null);
    setRequestOpen(true);
  };

  const closeRequest = () => {
    setRequestOpen(false);
    setRequestService(null);
    setRequestDetails("");
    setRequestState("idle");
    setSubmittedResult(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!requestService || !requestDetails.trim()) {
      setRequestState("error");
      return;
    }

    setRequestState("submitting");
    try {
      const isHardware = Boolean(requestService.name.toLowerCase().includes('laptop') || requestService.name.toLowerCase().includes('hardware') || requestService.name.toLowerCase().includes('desktop'));
      const isSoftware = Boolean(requestService.name.toLowerCase().includes('software') || requestService.name.toLowerCase().includes('license') || requestService.category.toLowerCase().includes('application'));

      const result = await submitServiceRequest(requestService.id, {
        details: requestDetails.trim(),
        urgency: "Medium",
        requester: user?.fullName || "Employee",
        customFields: isHardware
          ? { model: laptopModel, memory: laptopMemory, deliveryLocation }
          : isSoftware
          ? { licenseTier: softwareLicense, justification: softwareJustification }
          : { environment: accessEnv, rolePermission: accessRole },
      });
      setSubmittedResult(result);
      setRequestState("success");
    } catch (err) {
      console.error("[ServiceCatalogue] Failed to submit service request:", err);
      setRequestState("error");
    }
  };

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const clearFilters = () => {
    setSearchText("");
    setSelectedCategory("All Services");
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col bg-[#fffaf7] overflow-hidden">
      {/* ── Top Navbar ── */}
      <header className="w-full bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <span>Service Desk</span>
          <span>/</span>
          <span className="text-gray-900">Services Catalogue</span>
        </div>
        <GlobalNavbarActions
          onNewTicket={() => openRequest(servicesList[0])}
        />
      </header>

      <main className="services-page flex-1">
        <div className="services-container">
          <header className="services-header">
            <div className="services-heading">
              <h1>Services Catalogue</h1>
            </div>

            <div className="header-actions">
              <div className="service-count">
                <strong>{filteredServices.length}</strong>
                <span>services</span>
              </div>
            </div>
          </header>

        <div className="catalogue-layout">
          <aside className="category-sidebar">
            <div className="sidebar-search">
              <span className="sidebar-search-icon">⌕</span>
              <input
                type="search"
                value={searchText}
                onChange={handleSearch}
                placeholder="Search services..."
                aria-label="Search services"
              />
              {searchText && (
                <button
                  type="button"
                  className="sidebar-clear-search"
                  onClick={() => setSearchText("")}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <h2 className="sidebar-title">Services by Category</h2>

            <div className="category-list">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`category-button ${selectedCategory === category ? "active" : ""}`}
                  onClick={() => setSelectedCategory(category)}
                  aria-pressed={selectedCategory === category}
                >
                  <span className="category-dot">
                    {selectedCategory === category ? "●" : "○"}
                  </span>
                  {category}
                </button>
              ))}
            </div>
          </aside>

          <section className="service-grid" aria-label="Available services">
            {isLoading ? (
              <div className="empty-state">
                <div className="empty-icon animate-spin">⚙️</div>
                <h3>Loading catalogue...</h3>
                <p>Retrieving services from live backend API.</p>
              </div>
            ) : filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <ServiceCard
                  key={service.id || service.name}
                  service={service}
                  onDetails={setDetailsService}
                  onRequest={openRequest}
                />
              ))
            ) : (
              <div className="empty-state">
                <div className="empty-icon">⌕</div>
                <h3>No services found</h3>
                <p>We couldn't find any services matching your search.</p>
                <button type="button" onClick={clearFilters}>Clear filters</button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Details Modal */}
      {detailsService && (
        <div className="modal-overlay" onClick={() => setDetailsService(null)}>
          <section
            className="service-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="modal-close"
              onClick={() => setDetailsService(null)}
              aria-label="Close details"
            >
              ×
            </button>

            <div className={`modal-icon service-icon-${categoryClass(detailsService.category)}`}>
              {detailsService.icon || "📦"}
            </div>
            <span className="modal-category">{detailsService.category}</span>
            <h2 id="details-title">{detailsService.name}</h2>
            <p className="modal-description">{detailsService.description}</p>

            <div className="service-info">
              <div><span>Service</span><strong>{detailsService.name}</strong></div>
              <div><span>Category</span><strong>{detailsService.category}</strong></div>
              <div><span>Status</span><strong className="text-emerald-600">Available</strong></div>
              <div><span>Approval</span><strong>{detailsService.requiresApproval ? "Requires Approval" : "Auto-Approved"}</strong></div>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setDetailsService(null)}>
                Close
              </button>
              <button type="button" className="primary-button" onClick={() => openRequest(detailsService)}>
                Request this service
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Request Modal */}
      {requestOpen && (
        <div className="modal-overlay" onClick={closeRequest}>
          <section
            className="request-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button type="button" className="modal-close" onClick={closeRequest} aria-label="Close request">
              ×
            </button>

            {requestState === "success" ? (
              <div className="success-state" style={{ textAlign: "left", width: "100%" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-lg">✓</div>
                  <div>
                    <h2 id="request-title" style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#1e293b" }}>Request Logged Successfully</h2>
                    <span style={{ fontSize: 12, color: "#64748b" }}>Order Reference: #{submittedResult?.id || "REQ-2026-4491"}</span>
                  </div>
                </div>

                <p style={{ fontSize: 13, color: "#475569", marginBottom: 16 }}>
                  Your service request for <strong>{requestService?.name}</strong> has been registered in the system.
                </p>

                {/* ── Requester Stage-by-Stage Fulfillment Stepper (SR-2) ── */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#64748b", display: "block", marginBottom: 12 }}>
                    Fulfillment Lifecycle Tracking
                  </span>

                  <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
                    {[
                      { step: 1, title: "1. Request Submission Logged", status: "completed", desc: `Captured by API with details (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` },
                      { step: 2, title: "2. Line Manager & Compliance Authorization", status: "active", desc: "Currently queued in My Approvals awaiting manager decision" },
                      { step: 3, title: "3. IT Provisioning & License Assignment", status: "pending", desc: "Automated provisioning script & Tier 2 assignment" },
                      { step: 4, title: "4. Handover & Delivery", status: "pending", desc: "Asset delivery / access credentials dispatched to requester" },
                    ].map((st) => (
                      <div key={st.step} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700,
                          background: st.status === "completed" ? "#10b981" : st.status === "active" ? "#3b82f6" : "#e2e8f0",
                          color: st.status === "pending" ? "#64748b" : "#ffffff",
                          boxShadow: st.status === "active" ? "0 0 0 3px rgba(59, 130, 246, 0.2)" : undefined,
                        }}>
                          {st.status === "completed" ? "✓" : st.step}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: st.status === "pending" ? "#94a3b8" : "#1e293b" }}>
                              {st.title}
                            </span>
                            {st.status === "active" && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: "#dbeafe", color: "#1d4ed8", padding: "1px 6px", borderRadius: 999 }}>
                                Current Stage
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>{st.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="button" className="primary-button full-width" onClick={closeRequest}>
                  Return to Catalogue
                </button>
              </div>
            ) : (
              <>
                <div className="request-header">
                  <div className="request-heading-icon">✉</div>
                  <div>
                    <span>Service request</span>
                    <h2 id="request-title">Create a request</h2>
                  </div>
                </div>

                <form className="request-form" onSubmit={handleSubmit}>
                  <label htmlFor="service-choice">Choose a service</label>
                  <select
                    id="service-choice"
                    value={requestService?.id ?? ""}
                    onChange={(event) => {
                      const chosen = servicesList.find((service) => service.id === event.target.value);
                      setRequestService(chosen ?? null);
                      setRequestState("idle");
                    }}
                  >
                    <option value="">Select a service</option>
                    {servicesList.map((service) => (
                      <option key={service.id || service.name} value={service.id}>
                        {service.name} ({service.category})
                      </option>
                    ))}
                  </select>

                  {/* ── Dynamic Custom Fields per Catalog Offering (SR-1) ── */}
                  {requestService && (
                    Boolean(requestService.name.toLowerCase().includes('laptop') || requestService.name.toLowerCase().includes('hardware') || requestService.name.toLowerCase().includes('desktop')) ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 my-2">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">Hardware Specifications</span>
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Model & Tier</label>
                          <select
                            value={laptopModel}
                            onChange={(e) => setLaptopModel(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                          >
                            <option value='14" High Performance Laptop (M-Series / Intel i7)'>14" High Performance Laptop (Standard Dev Machine)</option>
                            <option value='16" Workstation Edition (64GB RAM / GPU Accelerated)'>16" Workstation Edition (Heavy GPU / Data Science)</option>
                            <option value='13" Ultralight Traveler Edition'>13" Ultralight Traveler Edition (Field & Executive)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Memory Allocation</label>
                          <select
                            value={laptopMemory}
                            onChange={(e) => setLaptopMemory(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                          >
                            <option value="16 GB Unified Memory">16 GB Unified Memory</option>
                            <option value="32 GB Unified RAM">32 GB Unified RAM</option>
                            <option value="64 GB Unified RAM">64 GB Unified RAM</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Delivery / Pickup Location</label>
                          <input
                            type="text"
                            value={deliveryLocation}
                            onChange={(e) => setDeliveryLocation(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                            placeholder="e.g. Desk 4B, London HQ or Remote Home Address"
                          />
                        </div>
                      </div>
                    ) : Boolean(requestService.name.toLowerCase().includes('software') || requestService.name.toLowerCase().includes('license') || requestService.name.toLowerCase().includes('adobe')) ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 my-2">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">License Specifications</span>
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">License Tier</label>
                          <select
                            value={softwareLicense}
                            onChange={(e) => setSoftwareLicense(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                          >
                            <option value="Full Creative / Developer License">Full Creative / Developer License (Annual Seat)</option>
                            <option value="Viewer / Read-Only Access">Viewer / Read-Only Access</option>
                            <option value="Standard Single-Seat License">Standard Single-Seat License</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-600 block mb-1">Business Justification & Project Code</label>
                          <input
                            type="text"
                            value={softwareJustification}
                            onChange={(e) => setSoftwareJustification(e.target.value)}
                            className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                            placeholder="e.g. PRJ-2026-ENG Sprint delivery requirement"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 my-2">
                        <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">Environment & Access Level</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">Environment</label>
                            <select
                              value={accessEnv}
                              onChange={(e) => setAccessEnv(e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                            >
                              <option value="Staging & Sandbox">Staging & Sandbox</option>
                              <option value="Production (Read-Only)">Production (Read-Only)</option>
                              <option value="Production (Full Admin)">Production (Full Admin)</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-slate-600 block mb-1">Role Permission</label>
                            <select
                              value={accessRole}
                              onChange={(e) => setAccessRole(e.target.value)}
                              className="w-full text-xs p-2 bg-white border border-slate-300 rounded-lg"
                            >
                              <option value="Developer / Contributor">Developer / Contributor</option>
                              <option value="Operator / Deployer">Operator / Deployer</option>
                              <option value="Security Auditor">Security Auditor</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )
                  )}

                  <label htmlFor="request-details">Additional Request details</label>
                  <textarea
                    id="request-details"
                    value={requestDetails}
                    onChange={(event) => {
                      setRequestDetails(event.target.value);
                      if (requestState === "error") setRequestState("idle");
                    }}
                    placeholder="Describe what you need..."
                    rows={5}
                  />

                  {requestState === "error" && (
                    <p className="error-message">Please select a service and enter your request details.</p>
                  )}

                  <div className="modal-actions">
                    <button type="button" className="secondary-button" onClick={closeRequest} disabled={requestState === "submitting"}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-button" disabled={requestState === "submitting"}>
                      {requestState === "submitting" ? "Submitting to API..." : "Submit request"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
      </main>
    </div>
  );
}