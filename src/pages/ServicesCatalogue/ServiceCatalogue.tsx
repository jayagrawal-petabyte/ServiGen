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
      const result = await submitServiceRequest(requestService.id, {
        details: requestDetails.trim(),
        urgency: "Medium",
        requester: user?.fullName || "Inesh Agarwal",
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
    <div className="flex-1 w-full min-h-screen flex flex-col bg-[#fffaf7]">
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
              <p>Browse available services, check SLAs, and submit service requests</p>
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
              <div className="success-state">
                <div className="success-icon">✓</div>
                <h2 id="request-title">Request submitted</h2>
                <p>
                  Your request for <strong>{requestService?.name}</strong> has been submitted to the backend API.
                </p>
                {submittedResult && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1 text-left my-3">
                    <div><strong>Request ID:</strong> #{submittedResult.id}</div>
                    <div><strong>Initial Status:</strong> {submittedResult.status}</div>
                    <div><strong>Timestamp:</strong> {new Date(submittedResult.submittedAt).toLocaleString()}</div>
                  </div>
                )}
                <button type="button" className="primary-button full-width" onClick={closeRequest}>
                  Done
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

                  <label htmlFor="request-details">Request details</label>
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