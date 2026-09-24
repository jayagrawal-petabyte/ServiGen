import React, { useState } from "react";
import "./ServicesCatalogue.css";

const services = [
  {
    name: "Absence Management",
    description: "Click here to raise an absence management request.",
    icon: "📅",
    type: "pink",
  },
  {
    name: "Administrator Rights",
    description: "Click here if you require administrator rights.",
    icon: "⚙️",
    type: "blue",
  },
  {
    name: "Air Con",
    description: "Click here to raise an issue with air con.",
    icon: "❄️",
    type: "cyan",
  },
  {
    name: "Benefit Change",
    description: "Click here to raise a benefit change request.",
    icon: "💰",
    type: "green",
  },
  {
    name: "Building Fabric",
    description: "Click here to raise an issue with the building fabric.",
    icon: "🏢",
    type: "blue",
  },
  {
    name: "CRM",
    description: "Manages customer relationships and sales pipelines.",
    icon: "🖥️",
    type: "yellow",
  },
  {
    name: "Data Integration",
    description:
      "Coordinates and integrates data, applications and workflows across systems.",
    icon: "🧩",
    type: "multi",
  },
  {
    name: "Database Administration",
    description:
      "Provides secure and reliable database storage and management.",
    icon: "🗄️",
    type: "cyan",
  },
  {
    name: "Desk Booking",
    description: "Click here to reserve a desk.",
    icon: "🪑",
    type: "green",
  },
  {
    name: "Desktop",
    description: "Click here to request a new desktop.",
    icon: "🖥️",
    type: "blue",
  },
  {
    name: "Dynamics CRM",
    description: "Manages sales, marketing and customer service processes.",
    icon: "◢",
    type: "navy",
  },
  {
    name: "Electrical",
    description: "Click here to raise an issue with electrical.",
    icon: "🔌",
    type: "pink",
  },
];

const categories = [
  "All Services",
  "Business Applications",
  "End-User Catalogue",
  "Services",
];

function ServiceCard({ service }) {
  return (
    <button className="service-card">
      <div className={`service-icon ${service.type}`}>
        <span>{service.icon}</span>
      </div>

      <div className="service-card-content">
        <h3>{service.name}</h3>
        <p>{service.description}</p>
      </div>
    </button>
  );
}

export default function ServicesCatalogue() {
  const [activeCategory, setActiveCategory] = useState("All Services");
  const [search, setSearch] = useState("");

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="services-page">
      {/* Page Header */}
      <header className="services-header">
        <div>
          <h1>Services</h1>
          <p>Browse available services and submit requests</p>
        </div>

        <div className="header-actions">
          <span className="service-count">67 services</span>
          <button className="new-button">+ New</button>
        </div>
      </header>

      {/* Main Content */}
      <div className="services-layout">
        {/* Category Sidebar */}
        <aside className="category-sidebar">
          <div className="category-search">
            <input
              type="text"
              placeholder="Search Major Incidents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <span>⌕</span>
          </div>

          <h2>Services by Category</h2>

          <nav className="category-list">
            {categories.map((category) => (
              <button
                key={category}
                className={
                  activeCategory === category ? "category active" : "category"
                }
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </nav>
        </aside>

        {/* Service Grid */}
        <main className="services-content">
          <div className="services-grid">
            {filteredServices.map((service) => (
              <ServiceCard key={service.name} service={service} />
            ))}
          </div>

          {filteredServices.length === 0 && (
            <div className="empty-search">
              <h3>No services found</h3>
              <p>Try searching for a different service.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}