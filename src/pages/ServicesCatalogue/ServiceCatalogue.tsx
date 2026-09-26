import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import "./ServiceCatalogue.css";

type Category =
  | "Business Applications"
  | "End-User Catalogue"
  | "Services";

type Service = {
  name: string;
  description: string;
  icon: string;
  category: Category;
};

type RequestState = "idle" | "success" | "error";

type ServiceCardProps = {
  service: Service;
  onViewDetails: (service: Service) => void;
  onRequest: (service: Service) => void;
};

const getCategoryClass = (category: Category): string => {
  if (category === "Business Applications") {
    return "business-applications";
  }

  if (category === "End-User Catalogue") {
    return "end-user-catalogue";
  }

  return "services";
};

const services: Service[] = [
  {
    name: "Absence Management",
    description:
      "Click here to raise an absence management request.",
    icon: "📅",
    category: "End-User Catalogue",
  },
  {
    name: "Administrator Rights",
    description:
      "Click here if you require administrator rights.",
    icon: "⚙️",
    category: "End-User Catalogue",
  },
  {
    name: "Air Con",
    description:
      "Click here to raise an issue with the air conditioning.",
    icon: "❄️",
    category: "Services",
  },
  {
    name: "Benefit Change",
    description:
      "Click here to raise a benefit change request.",
    icon: "🎁",
    category: "End-User Catalogue",
  },
  {
    name: "Building Fabric",
    description:
      "Click here to raise an issue with the building fabric.",
    icon: "🏢",
    category: "Services",
  },
  {
    name: "CRM",
    description:
      "Manage customer and sales relationships and pipelines.",
    icon: "👥",
    category: "Business Applications",
  },
  {
    name: "Data Integration",
    description:
      "Coordinate and integrate data, applications, and workflows.",
    icon: "🧩",
    category: "Business Applications",
  },
  {
    name: "Database Administration",
    description:
      "Provides secure and reliable database storage and management.",
    icon: "🗄️",
    category: "Business Applications",
  },
  {
    name: "Desk Booking",
    description:
      "Click here to reserve a desk.",
    icon: "🪑",
    category: "End-User Catalogue",
  },
  {
    name: "Desktop",
    description:
      "Click here to request a new desktop.",
    icon: "🖥️",
    category: "End-User Catalogue",
  },
  {
    name: "Dynamics CRM",
    description:
      "Manages sales, marketing, and customer service processes.",
    icon: "📊",
    category: "Business Applications",
  },
  {
    name: "Electrical",
    description:
      "Click here to raise an issue with electrical services.",
    icon: "🔌",
    category: "Services",
  },
];

const categories: Array<"All Services" | Category> = [
  "All Services",
  "Business Applications",
  "End-User Catalogue",
  "Services",
];

function ServiceCard({
  service,
  onViewDetails,
  onRequest,
}: ServiceCardProps) {
  return (
    <article className="service-card">
      <div className="service-card-top">
        <div
          className={`service-icon service-icon-${getCategoryClass(
            service.category
          )}`}
        >
          <span>{service.icon}</span>
        </div>

        <span className="service-category">
          {service.category}
        </span>
      </div>

      <h3>{service.name}</h3>

      <p>{service.description}</p>

      <div className="service-card-actions">
        <button
          type="button"
          className="details-button"
          onClick={() => onViewDetails(service)}
        >
          View details
        </button>

        <button
          type="button"
          className="request-button"
          onClick={() => onRequest(service)}
        >
          Request
        </button>
      </div>
    </article>
  );
}

export default function ServiceCatalogue() {
  const [selectedCategory, setSelectedCategory] =
    useState<"All Services" | Category>("All Services");

  const [searchText, setSearchText] = useState("");

  const [selectedService, setSelectedService] =
    useState<Service | null>(null);

  const [requestService, setRequestService] =
    useState<Service | null>(null);

  const [requestDetails, setRequestDetails] = useState("");

  const [requestState, setRequestState] =
    useState<RequestState>("idle");

  const filteredServices = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return services.filter((service: Service) => {
      const categoryMatches =
        selectedCategory === "All Services" ||
        service.category === selectedCategory;

      const searchMatches =
        search === "" ||
        service.name.toLowerCase().includes(search) ||
        service.description.toLowerCase().includes(search) ||
        service.category.toLowerCase().includes(search);

      return categoryMatches && searchMatches;
    });
  }, [selectedCategory, searchText]);

  const handleSearch = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setSearchText(event.target.value);
  };

  const handleCategoryChange = (
    category: "All Services" | Category
  ) => {
    setSelectedCategory(category);
  };

  const handleViewDetails = (service: Service) => {
    setSelectedService(service);
  };

  const handleRequest = (service: Service) => {
    setSelectedService(null);
    setRequestService(service);
    setRequestDetails("");
    setRequestState("idle");
  };

  const closeDetails = () => {
    setSelectedService(null);
  };

  const closeRequest = () => {
    setRequestService(null);
    setRequestDetails("");
    setRequestState("idle");
  };

  const handleSubmitRequest = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!requestDetails.trim()) {
      setRequestState("error");
      return;
    }

    setRequestState("success");
  };

  const clearFilters = () => {
    setSearchText("");
    setSelectedCategory("All Services");
  };

  return (
    <main className="services-page">
      <div className="services-container">

        {/* HEADER */}
        <header className="services-header">
          <div className="services-heading">
            <h1>Services</h1>

            <p>
              Browse available services and submit requests
            </p>
          </div>

          <div className="header-actions">
            <div className="service-count">
              <strong>67</strong>
              <span>services</span>
            </div>

            <button
              type="button"
              className="new-button"
            >
              <span>+</span>
              New
            </button>
          </div>
        </header>

        {/* CATALOGUE */}
        <div className="catalogue-layout">

          {/* CATEGORY SIDEBAR */}
          <aside className="category-sidebar">

            {/* SEARCH */}
            <div className="sidebar-search">
              <span className="sidebar-search-icon">
                ⌕
              </span>

              <input
                type="text"
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

            {/* CATEGORY TITLE */}
            <h2 className="sidebar-title">
              Services by Category
            </h2>

            {/* CATEGORY LIST */}
            <div className="category-list">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category}
                  className={`category-button ${
                    selectedCategory === category
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    handleCategoryChange(category)
                  }
                >
                  <span className="category-dot">
                    {selectedCategory === category
                      ? "●"
                      : "○"}
                  </span>

                  <span>{category}</span>
                </button>
              ))}
            </div>
          </aside>

          {/* SERVICE GRID */}
          <section className="service-grid">
            {filteredServices.length > 0 ? (
              filteredServices.map(
                (service: Service) => (
                  <ServiceCard
                    key={service.name}
                    service={service}
                    onViewDetails={handleViewDetails}
                    onRequest={handleRequest}
                  />
                )
              )
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  🔍
                </div>

                <h3>No services found</h3>

                <p>
                  We couldn't find any services matching
                  your search.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* SERVICE DETAILS MODAL */}
      {selectedService && (
        <div
          className="modal-overlay"
          onClick={closeDetails}
          role="presentation"
        >
          <div
            className="service-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-details-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeDetails}
              aria-label="Close service details"
            >
              ×
            </button>

            <div
              className={`modal-icon service-icon-${getCategoryClass(
                selectedService.category
              )}`}
            >
              {selectedService.icon}
            </div>

            <span className="modal-category">
              {selectedService.category}
            </span>

            <h2 id="service-details-title">
              {selectedService.name}
            </h2>

            <p className="modal-description">
              {selectedService.description}
            </p>

            <div className="service-info">
              <div>
                <span>Service</span>
                <strong>
                  {selectedService.name}
                </strong>
              </div>

              <div>
                <span>Category</span>
                <strong>
                  {selectedService.category}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong>Available</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeDetails}
              >
                Close
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  handleRequest(selectedService)
                }
              >
                Request this service
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST MODAL */}
      {requestService && (
        <div
          className="modal-overlay"
          onClick={closeRequest}
          role="presentation"
        >
          <div
            className="request-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-title"
          >
            <button
              type="button"
              className="modal-close"
              onClick={closeRequest}
              aria-label="Close request"
            >
              ×
            </button>

            {requestState === "success" ? (
              <div className="success-state">
                <div className="success-icon">
                  ✓
                </div>

                <h2>Request submitted</h2>

                <p>
                  Your request for{" "}
                  <strong>
                    {requestService.name}
                  </strong>{" "}
                  has been submitted successfully.
                </p>

                <button
                  type="button"
                  className="primary-button full-width"
                  onClick={closeRequest}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="request-header">
                  <div
                    className={`modal-icon service-icon-${getCategoryClass(
                      requestService.category
                    )}`}
                  >
                    {requestService.icon}
                  </div>

                  <div>
                    <span>Service request</span>

                    <h2 id="request-title">
                      {requestService.name}
                    </h2>
                  </div>
                </div>

                <form
                  className="request-form"
                  onSubmit={handleSubmitRequest}
                >
                  <label htmlFor="request-details">
                    Request details
                  </label>

                  <textarea
                    id="request-details"
                    value={requestDetails}
                    onChange={(event) =>
                      setRequestDetails(
                        event.target.value
                      )
                    }
                    placeholder="Describe what you need..."
                    rows={5}
                  />

                  {requestState === "error" && (
                    <p className="error-message">
                      Please enter your request details
                      before submitting.
                    </p>
                  )}

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={closeRequest}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="primary-button"
                    >
                      Submit request
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}