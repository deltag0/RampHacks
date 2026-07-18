"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, MapPin, Search, SlidersHorizontal, Users, X } from "lucide-react";
import { HomeCard } from "./home-card";
import type { Home } from "@/server/data/homes";

export function SearchExperience({ initialHomes }: { initialHomes: Home[] }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("Any home");
  const [guests, setGuests] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);

  const filtered = useMemo(() => initialHomes.filter((home) => {
    const term = `${home.location} ${home.country} ${home.title}`.toLowerCase();
    return (!query || term.includes(query.toLowerCase())) &&
      (type === "Any home" || home.type === type) &&
      (!guests || home.guests >= guests) &&
      amenities.every((amenity) => home.amenities.includes(amenity));
  }), [initialHomes, query, type, guests, amenities]);

  const toggleAmenity = (amenity: string) =>
    setAmenities((current) => current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity]);

  return (
    <>
      <section className="search-hero">
        <div className="container">
          <span className="kicker">Discover your next exchange</span>
          <h1>Find a home that feels like yours</h1>
          <div className="search-bar search-page-bar">
            <label><span>Destination</span><span className="search-input"><MapPin size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Anywhere in the world" /></span></label>
            <div className="search-divider" />
            <label><span>Dates</span><span className="search-input"><CalendarDays size={18} /><input placeholder="Flexible dates" /></span></label>
            <div className="search-divider" />
            <label><span>Travelers</span><span className="search-input"><Users size={18} /><input type="number" min="0" value={guests || ""} onChange={(e) => setGuests(Number(e.target.value))} placeholder="Add travelers" /></span></label>
            <button className="search-submit" aria-label="Search"><Search size={20} /><span>Search</span></button>
          </div>
        </div>
      </section>
      <section className="results-section container">
        <div className="filter-row">
          <div className="filter-pills">
            <button onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={16} /> All filters {amenities.length > 0 && <b>{amenities.length}</b>}</button>
            <label className="select-pill">Home type <select value={type} onChange={(e) => setType(e.target.value)}><option>Any home</option><option>Apartment</option><option>House</option><option>Cottage</option><option>Villa</option><option>Loft</option><option>Townhouse</option></select><ChevronDown size={15} /></label>
            <button onClick={() => setGuests(guests ? 0 : 4)}>4+ travelers</button>
            <button onClick={() => toggleAmenity("Workspace")} className={amenities.includes("Workspace") ? "active" : ""}>Remote-work ready</button>
            <button onClick={() => toggleAmenity("Pool")} className={amenities.includes("Pool") ? "active" : ""}>Pool</button>
          </div>
        </div>
        <div className="results-heading">
          <div><span>{filtered.length} homes</span><h2>{query ? `Homes around “${query}”` : "Homes ready for an exchange"}</h2></div>
          <label>Sort by <select><option>Recommended</option><option>Top rated</option><option>Most exchanges</option></select></label>
        </div>
        {filtered.length ? <div className="card-grid results-grid">{filtered.map((home) => <HomeCard home={home} key={home.id} />)}</div> :
          <div className="empty-state"><Search size={32} /><h3>No exact matches yet</h3><p>Try a broader destination or clear one of your filters.</p><button className="button" onClick={() => { setQuery(""); setType("Any home"); setGuests(0); setAmenities([]); }}>Clear filters</button></div>}
      </section>
      {filtersOpen && <div className="modal-backdrop" onMouseDown={() => setFiltersOpen(false)}>
        <div className="filter-modal" role="dialog" aria-modal="true" aria-label="Search filters" onMouseDown={(e) => e.stopPropagation()}>
          <div className="modal-header"><h2>All filters</h2><button onClick={() => setFiltersOpen(false)} aria-label="Close filters"><X /></button></div>
          <div className="modal-content"><h3>Home type</h3><div className="choice-grid">{["Any home", "Apartment", "House", "Cottage", "Villa", "Loft"].map((item) => <button className={type === item ? "selected" : ""} onClick={() => setType(item)} key={item}>{item}</button>)}</div><h3>Amenities</h3><div className="check-grid">{["Workspace", "Pool", "Garden", "Parking", "Washer", "Bikes"].map((item) => <label key={item}><input type="checkbox" checked={amenities.includes(item)} onChange={() => toggleAmenity(item)} /> {item}</label>)}</div></div>
          <div className="modal-footer"><button className="clear-button" onClick={() => { setType("Any home"); setAmenities([]); setGuests(0); }}>Clear all</button><button className="button" onClick={() => setFiltersOpen(false)}>Show {filtered.length} homes</button></div>
        </div>
      </div>}
    </>
  );
}
