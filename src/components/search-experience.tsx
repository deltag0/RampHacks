"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import {
  DEFAULT_HOME_SEARCH_FILTERS,
  HOME_AMENITIES,
  HOME_TYPES,
  parseHomeSearchFilters,
  serializeHomeSearchFilters,
  type HomeSearchFilters,
} from "@/domain/homes/search-filters";
import type { Home } from "@/server/data/homes";
import { HomeCard } from "./home-card";

export function SearchExperience({ initialHomes }: { initialHomes: Home[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlFilters = useMemo(
    () => parseHomeSearchFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const [filters, setFilters] = useState(urlFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      const query = serializeHomeSearchFilters(filters).toString();
      const current = searchParams.toString();
      if (query !== current) {
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [filters, pathname, router, searchParams]);

  useEffect(() => {
    if (!filtersOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [filtersOpen]);

  const filtered = useMemo(() => {
    const results = initialHomes.filter((home) => {
      const term =
        `${home.location} ${home.country} ${home.title}`.toLowerCase();
      return (
        (!filters.destination ||
          term.includes(filters.destination.toLowerCase())) &&
        (!filters.type || home.type === filters.type) &&
        (!filters.travelers || home.guests >= filters.travelers) &&
        filters.amenities.every((amenity) => home.amenities.includes(amenity))
      );
    });

    return results;
  }, [initialHomes, filters]);

  const update = (patch: Partial<HomeSearchFilters>) =>
    setFilters((current) => ({ ...current, ...patch }));
  const submitSearch = () => {
    const query = serializeHomeSearchFilters(filters).toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  const toggleAmenity = (amenity: string) =>
    update({
      amenities: filters.amenities.includes(amenity)
        ? filters.amenities.filter((item) => item !== amenity)
        : [...filters.amenities, amenity],
    });
  const activeFilterCount =
    Number(Boolean(filters.type)) +
    filters.amenities.length +
    Number(filters.travelers > 0) +
    Number(Boolean(filters.from || filters.to));

  return (
    <>
      <section className="search-hero">
        <div className="container">
          <span className="kicker">Discover your next exchange</span>
          <h1>Find a home that feels like yours</h1>
          <form
            className="search-bar search-page-bar"
            role="search"
            onSubmit={(event) => {
              event.preventDefault();
              submitSearch();
            }}
          >
            <label>
              <span>Destination</span>
              <span className="search-input">
                <MapPin size={18} aria-hidden="true" />
                <input
                  value={filters.destination}
                  onChange={(event) =>
                    update({ destination: event.target.value })
                  }
                  placeholder="Anywhere in the world"
                />
              </span>
            </label>
            <div className="search-divider" />
            <fieldset className="date-fields">
              <legend>Dates</legend>
              <CalendarDays size={18} aria-hidden="true" />
              <label>
                <span className="sr-only">From</span>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(event) => update({ from: event.target.value })}
                />
              </label>
              <span aria-hidden="true">–</span>
              <label>
                <span className="sr-only">To</span>
                <input
                  type="date"
                  min={filters.from || undefined}
                  value={filters.to}
                  onChange={(event) => update({ to: event.target.value })}
                />
              </label>
            </fieldset>
            <div className="search-divider" />
            <label>
              <span>Travelers</span>
              <span className="search-input">
                <Users size={18} aria-hidden="true" />
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={filters.travelers || ""}
                  onChange={(event) =>
                    update({
                      travelers: Math.min(
                        Math.max(Number(event.target.value), 0),
                        20,
                      ),
                    })
                  }
                  placeholder="Add travelers"
                />
              </span>
            </label>
            <button className="search-submit" type="submit">
              <Search size={20} aria-hidden="true" />
              <span>Search</span>
            </button>
          </form>
        </div>
      </section>

      <section className="results-section container">
        <div className="filter-row">
          <div className="filter-pills">
            <button type="button" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal size={16} /> All filters
              {activeFilterCount > 0 && <b>{activeFilterCount}</b>}
            </button>
            <label className="select-pill">
              Home type
              <select
                value={filters.type}
                onChange={(event) => update({ type: event.target.value })}
              >
                <option value="">Any home</option>
                {HOME_TYPES.map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </label>
            <button
              type="button"
              className={filters.travelers >= 4 ? "active" : ""}
              onClick={() =>
                update({ travelers: filters.travelers >= 4 ? 0 : 4 })
              }
            >
              4+ travelers
            </button>
            <button
              type="button"
              onClick={() => toggleAmenity("Workspace")}
              className={
                filters.amenities.includes("Workspace") ? "active" : ""
              }
            >
              Remote-work ready
            </button>
            <button
              type="button"
              onClick={() => toggleAmenity("Pool")}
              className={filters.amenities.includes("Pool") ? "active" : ""}
            >
              Pool
            </button>
          </div>
        </div>

        <div className="results-heading">
          <div>
            <span aria-live="polite">{filtered.length} homes</span>
            <h2>
              {filters.destination
                ? `Homes around “${filters.destination}”`
                : "Homes ready for an exchange"}
            </h2>
          </div>
        </div>

        {filtered.length ? (
          <div className="card-grid results-grid">
            {filtered.map((home) => (
              <HomeCard home={home} key={home.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={32} aria-hidden="true" />
            <h3>No exact matches yet</h3>
            <p>Try a broader destination or clear one of your filters.</p>
            <button
              className="button"
              type="button"
              onClick={() => setFilters(DEFAULT_HOME_SEARCH_FILTERS)}
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      {filtersOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setFiltersOpen(false)}
        >
          <div
            className="filter-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filters-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h2 id="filters-title">All filters</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                aria-label="Close filters"
                autoFocus
              >
                <X />
              </button>
            </div>
            <div className="modal-content">
              <h3>Home type</h3>
              <div className="choice-grid">
                {["", ...HOME_TYPES].map((type) => (
                  <button
                    type="button"
                    className={filters.type === type ? "selected" : ""}
                    onClick={() => update({ type })}
                    key={type || "any"}
                  >
                    {type || "Any home"}
                  </button>
                ))}
              </div>
              <h3>Amenities</h3>
              <div className="check-grid">
                {HOME_AMENITIES.map((amenity) => (
                  <label key={amenity}>
                    <input
                      type="checkbox"
                      checked={filters.amenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                    />{" "}
                    {amenity}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="clear-button"
                type="button"
                onClick={() => setFilters(DEFAULT_HOME_SEARCH_FILTERS)}
              >
                Clear all
              </button>
              <button
                className="button"
                type="button"
                onClick={() => setFiltersOpen(false)}
              >
                Show {filtered.length} homes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
