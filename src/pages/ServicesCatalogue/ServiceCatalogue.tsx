import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import "./ServiceCatalogue.css";

type Category = "Business Applications" | "End-User Catalogue" | "Services";
type CategoryFilter = "All Services" | Category;

type Service = {
  name: string;
  description: string;
  icon: string;
  category: Category;
};

type RequestState = "idle" | "error" | "success";

const services: Service[] = [
  { name: "Absence Management", description: "Raise an absence management request.", icon: "📅", category: "End-User Catalogue" },
  { name: "Administrator Rights", description: "Request administrator access to your device.", icon: "⚙️", category: "End-User Catalogue" },
  { name: "Air Con", description: "Report an air conditioning issue.", icon: "❄️", category: "Services" },
  { name: "Benefit Change", description: "Raise a request to change your benefits.", icon: "🎁", category: "End-User Catalogue" },
  { name: "Building Fabric", description: "Report an issue with the building or its facilities.", icon: "🏢", category: "Services" },
  { name: "CRM", description: "Get support for customer relationship management.", icon: "👥", category: "Business Applications" },
  { name: "Data Integration", description: "Request help with data and application integration.", icon: "🧩", category: "Business Applications" },
  { name: "Database Administration", description: "Request database support and administration.", icon: "🗄️", category: "Business Applications" },
  { name: "Desk Booking", description: "Request assistance with desk booking.", icon: "🪑", category: "End-User Catalogue" },
  { name: "Desktop", description: "Request a desktop or desktop support.", icon: "🖥️", category: "End-User Catalogue" },
  { name: "Dynamics CRM", description: "Get support for Dynamics CRM.", icon: "📊", category: "Business Applications" },
  { name: "Electrical", description: "Report an electrical issue.", icon: "🔌", category: "Services" },
];

const categories: CategoryFilter[] = [
  "All Services",
  "Business Applications",
  "End-User Catalogue",
  "Services",
];

const categoryClass = (category: Category): string =>
  category === "Business Applications"
    ? "business-applications"
    : category === "End-User Catalogue"
      ? "end-user-catalogue"
      : "services";

type ServiceCardProps = {
  service: Service;
  onDetails: (service: Service) => void;
  onRequest: (service: Service) => void;
};

function ServiceCard({ service, onDetails, onRequest }: ServiceCardProps) {
  return (
    <article className="service-card">
      <div className="service-card-top">
        <div className={`service-icon service-icon-${categoryClass(service.category)}`}>
          {service.icon}
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
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All Services");
  const [searchText, setSearchText] = useState("");
  const [detailsService, setDetailsService] = useState<Service | null>(null);

  const [requestOpen, setRequestOpen] = useState(false);
  const [requestService, setRequestService] = useState<Service | null>(null);
  const [requestDetails, setRequestDetails] = useState("");
  const [requestState, setRequestState] = useState<RequestState>("idle");

  const filteredServices = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return services.filter((service) => {
      const matchesCategory =
        selectedCategory === "All Services" || service.category === selectedCategory;

      const matchesSearch =
        !search ||
        service.name.toLowerCase().includes(search) ||
        service.description.toLowerCase().includes(search) ||
        service.category.toLowerCase().includes(search);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchText]);

  const openRequest = (service?: Service) => {
    setDetailsService(null);
    setRequestService(service ?? null);
    setRequestDetails("");
    setRequestState("idle");
    setRequestOpen(true);
  };

  const closeRequest = () => {
    setRequestOpen(false);
    setRequestService(null);
    setRequestDetails("");
    setRequestState("idle");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!requestService || !requestDetails.trim()) {
      setRequestState("error");
      return;
    }

    // Frontend fallback: simulates a successful backend response.
    setRequestState("success");
  };

  const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };

  const clearFilters = () => {
    setSearchText("");
    setSelectedCategory("All Services");
  };

  return (
    <main className="services-page">
      <div className="services-container">
        <header className="services-header">
          <div className="services-heading">
            <h1>Services</h1>
            <p>Browse available services and submit requests</p>
          </div>

          <div className="header-actions">
            <div className="service-count">
              <strong>{services.length}</strong>
              <span>services</span>
            </div>
            <button type="button" className="new-button" onClick={() => openRequest()}>
              <span>+</span> New
            </button>
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
            {filteredServices.length > 0 ? (
              filteredServices.map((service) => (
                <ServiceCard
                  key={service.name}
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
              {detailsService.icon}
            </div>
            <span className="modal-category">{detailsService.category}</span>
            <h2 id="details-title">{detailsService.name}</h2>
            <p className="modal-description">{detailsService.description}</p>

            <div className="service-info">
              <div><span>Service</span><strong>{detailsService.name}</strong></div>
              <div><span>Category</span><strong>{detailsService.category}</strong></div>
              <div><span>Status</span><strong>Available</strong></div>
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
                  Your request for <strong>{requestService?.name}</strong> has been submitted successfully.
                </p>
                <p className="mock-response-note">Demo confirmation — no backend request was sent.</p>
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
                    value={requestService?.name ?? ""}
                    onChange={(event) => {
                      const chosen = services.find((service) => service.name === event.target.value);
                      setRequestService(chosen ?? null);
                      setRequestState("idle");
                    }}
                  >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                      <option key={service.name} value={service.name}>{service.name}</option>
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
                    <button type="button" className="secondary-button" onClick={closeRequest}>
                      Cancel
                    </button>
                    <button type="submit" className="primary-button">
                      Submit request
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}