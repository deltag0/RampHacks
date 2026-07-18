"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  ImagePlus,
  Link2,
  Map,
  MousePointer2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  clampTourPoint,
  connectionsFrom,
  type HomeTour,
  removeScene,
  type TourPoint,
} from "@/domain/home-tours/model";

const emptyTour: HomeTour = {
  title: "My home tour",
  startSceneId: null,
  scenes: [],
  connections: [],
};

type DraftConnection = {
  toSceneId: string;
  label: string;
  position: TourPoint;
};

export function HomeTourBuilder() {
  const [tour, setTour] = useState<HomeTour>(emptyTour);
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [connectionDraft, setConnectionDraft] =
    useState<DraftConnection | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const objectUrls = useRef<string[]>([]);

  const activeScene = tour.scenes.find(
    (scene) => scene.id === activeSceneId,
  );
  const outgoingConnections = useMemo(
    () =>
      activeSceneId ? connectionsFrom(tour, activeSceneId) : [],
    [activeSceneId, tour],
  );

  useEffect(
    () => () => {
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    },
    [],
  );

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length === 0) return;

    const newScenes = files.map((file) => {
      const imageUrl = URL.createObjectURL(file);
      objectUrls.current.push(imageUrl);
      return {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.[^.]+$/, "") || "Untitled room",
        imageUrl,
        imageAlt: `View of ${file.name.replace(/\.[^.]+$/, "") || "a room"}`,
      };
    });

    setTour((current) => ({
      ...current,
      scenes: [...current.scenes, ...newScenes],
      startSceneId: current.startSceneId ?? newScenes[0].id,
    }));
    setActiveSceneId((current) => current ?? newScenes[0].id);
    setAnnouncement(
      `${newScenes.length} ${newScenes.length === 1 ? "scene" : "scenes"} added.`,
    );
    event.target.value = "";
  }

  function beginConnection() {
    if (!activeSceneId || tour.scenes.length < 2) return;
    const destination = tour.scenes.find(
      (scene) => scene.id !== activeSceneId,
    );
    if (!destination) return;
    setConnectionDraft({
      toSceneId: destination.id,
      label: `Go to ${destination.name}`,
      position: { x: 50, y: 55 },
    });
  }

  function placeDraft(event: MouseEvent<HTMLDivElement>) {
    if (!connectionDraft || mode !== "edit") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const position = clampTourPoint({
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
    });
    setConnectionDraft((draft) => (draft ? { ...draft, position } : draft));
  }

  function saveConnection() {
    if (!activeSceneId || !connectionDraft) return;
    const destination = tour.scenes.find(
      (scene) => scene.id === connectionDraft.toSceneId,
    );
    if (!destination) return;

    setTour((current) => ({
      ...current,
      connections: [
        ...current.connections,
        {
          id: crypto.randomUUID(),
          fromSceneId: activeSceneId,
          ...connectionDraft,
          label:
            connectionDraft.label.trim() || `Go to ${destination.name}`,
        },
      ],
    }));
    setConnectionDraft(null);
    setAnnouncement(`Connection to ${destination.name} added.`);
  }

  function deleteActiveScene() {
    if (!activeSceneId || !activeScene) return;
    const nextTour = removeScene(tour, activeSceneId);
    setTour(nextTour);
    setActiveSceneId(nextTour.startSceneId);
    setConnectionDraft(null);
    setAnnouncement(`${activeScene.name} removed.`);
  }

  function openPreview() {
    if (!tour.startSceneId) return;
    setActiveSceneId(tour.startSceneId);
    setConnectionDraft(null);
    setMode("preview");
  }

  if (tour.scenes.length === 0) {
    return (
      <div className="tour-empty">
        <div className="tour-empty-icon">
          <ImagePlus aria-hidden="true" />
        </div>
        <span className="kicker">Start with your own photos</span>
        <h2>Turn room photos into a walk-through</h2>
        <p>
          Add two or more images, then place arrows that let members move from
          one space to the next. Images stay in this browser session for now.
        </p>
        <label className="button tour-upload">
          <Plus size={18} aria-hidden="true" />
          Add room images
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={addImages}
          />
        </label>
        <p className="tour-privacy-note">
          Before uploading, remove location metadata and check that addresses,
          keys, documents, and security devices are not visible.
        </p>
      </div>
    );
  }

  return (
    <div className="tour-workspace">
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div className="tour-toolbar">
        <div>
          <span className="tour-status">
            {mode === "edit" ? <Pencil size={14} /> : <Eye size={14} />}
            {mode === "edit" ? "Editing tour" : "Visitor preview"}
          </span>
          <input
            className="tour-title-input"
            value={tour.title}
            aria-label="Tour title"
            disabled={mode === "preview"}
            onChange={(event) =>
              setTour((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
          />
        </div>
        <div className="tour-toolbar-actions">
          {mode === "edit" ? (
            <>
              <label className="tour-secondary-button">
                <ImagePlus size={17} />
                Add images
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={addImages}
                />
              </label>
              <button
                className="button"
                type="button"
                onClick={openPreview}
              >
                <Eye size={17} />
                Preview tour
              </button>
            </>
          ) : (
            <button
              className="button"
              type="button"
              onClick={() => setMode("edit")}
            >
              <ArrowLeft size={17} />
              Back to editor
            </button>
          )}
        </div>
      </div>

      <div className="tour-layout">
        <aside className="tour-scenes-panel" aria-label="Tour scenes">
          <div className="tour-panel-heading">
            <div>
              <Map size={18} />
              <strong>Scenes</strong>
            </div>
            <span>{tour.scenes.length}</span>
          </div>
          <ol className="tour-scene-list">
            {tour.scenes.map((scene, index) => {
              const isActive = scene.id === activeSceneId;
              return (
                <li key={scene.id}>
                  <button
                    type="button"
                    className={isActive ? "active" : undefined}
                    onClick={() => {
                      setActiveSceneId(scene.id);
                      setConnectionDraft(null);
                    }}
                    aria-current={isActive ? "step" : undefined}
                  >
                    <img src={scene.imageUrl} alt="" />
                    <span>
                      <small>Scene {index + 1}</small>
                      <strong>{scene.name}</strong>
                    </span>
                    {tour.startSceneId === scene.id && (
                      <em>Start</em>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
          {mode === "edit" && activeScene && (
            <div className="tour-scene-fields">
              <label>
                Room name
                <input
                  value={activeScene.name}
                  onChange={(event) => {
                    const name = event.target.value;
                    setTour((current) => ({
                      ...current,
                      scenes: current.scenes.map((scene) =>
                        scene.id === activeScene.id
                          ? { ...scene, name }
                          : scene,
                      ),
                    }));
                  }}
                />
              </label>
              <label>
                Image description
                <textarea
                  rows={3}
                  value={activeScene.imageAlt}
                  onChange={(event) => {
                    const imageAlt = event.target.value;
                    setTour((current) => ({
                      ...current,
                      scenes: current.scenes.map((scene) =>
                        scene.id === activeScene.id
                          ? { ...scene, imageAlt }
                          : scene,
                      ),
                    }));
                  }}
                />
              </label>
              <button
                type="button"
                className="tour-text-button danger"
                onClick={deleteActiveScene}
              >
                <Trash2 size={15} />
                Remove scene
              </button>
            </div>
          )}
        </aside>

        <section className="tour-canvas-panel">
          {activeScene ? (
            <>
              <div className="tour-canvas-header">
                <div>
                  <span>{mode === "edit" ? "Current scene" : tour.title}</span>
                  <h2>{activeScene.name}</h2>
                </div>
                {mode === "edit" && (
                  <button
                    type="button"
                    className="tour-secondary-button"
                    disabled={tour.scenes.length < 2 || !!connectionDraft}
                    onClick={beginConnection}
                  >
                    <Link2 size={17} />
                    Add connection
                  </button>
                )}
              </div>

              <div
                className={
                  connectionDraft
                    ? "tour-image-stage placing"
                    : "tour-image-stage"
                }
                onClick={placeDraft}
              >
                <img
                  src={activeScene.imageUrl}
                  alt={activeScene.imageAlt}
                />
                {outgoingConnections.map((connection) => (
                  <button
                    key={connection.id}
                    type="button"
                    className="tour-hotspot"
                    style={{
                      left: `${connection.position.x}%`,
                      top: `${connection.position.y}%`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (mode === "preview") {
                        setActiveSceneId(connection.toSceneId);
                        setAnnouncement(connection.label);
                      }
                    }}
                    aria-label={connection.label}
                  >
                    <ArrowRight size={20} />
                    <span>{connection.label}</span>
                  </button>
                ))}
                {connectionDraft && (
                  <span
                    className="tour-hotspot draft"
                    style={{
                      left: `${connectionDraft.position.x}%`,
                      top: `${connectionDraft.position.y}%`,
                    }}
                  >
                    <MousePointer2 size={18} />
                    <span>Place arrow here</span>
                  </span>
                )}
                {mode === "preview" && outgoingConnections.length === 0 && (
                  <div className="tour-dead-end">
                    <Map size={20} />
                    Choose another scene from the tour map.
                  </div>
                )}
              </div>

              {mode === "edit" && (
                <div className="tour-connections-list">
                  <div>
                    <strong>Connections from this scene</strong>
                    <span>
                      {outgoingConnections.length === 0
                        ? "Add an arrow to guide members to another room."
                        : `${outgoingConnections.length} navigation ${outgoingConnections.length === 1 ? "arrow" : "arrows"}`}
                    </span>
                  </div>
                  {outgoingConnections.map((connection) => {
                    const destination = tour.scenes.find(
                      (scene) => scene.id === connection.toSceneId,
                    );
                    return (
                      <span className="tour-connection-chip" key={connection.id}>
                        {destination?.name ?? "Unknown scene"}
                        <button
                          type="button"
                          aria-label={`Remove connection to ${destination?.name ?? "scene"}`}
                          onClick={() =>
                            setTour((current) => ({
                              ...current,
                              connections: current.connections.filter(
                                (item) => item.id !== connection.id,
                              ),
                            }))
                          }
                        >
                          <X size={13} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
        </section>
      </div>

      {connectionDraft && activeScene && (
        <div className="tour-dialog-backdrop">
          <section
            className="tour-connection-dialog"
            role="dialog"
            aria-labelledby="connection-title"
          >
            <div className="tour-dialog-title">
              <div>
                <span>New connection</span>
                <h2 id="connection-title">Where does this arrow lead?</h2>
              </div>
              <button
                type="button"
                aria-label="Cancel connection"
                onClick={() => setConnectionDraft(null)}
              >
                <X />
              </button>
            </div>
            <label>
              Destination scene
              <select
                value={connectionDraft.toSceneId}
                onChange={(event) => {
                  const destination = tour.scenes.find(
                    (scene) => scene.id === event.target.value,
                  );
                  setConnectionDraft((draft) =>
                    draft
                      ? {
                          ...draft,
                          toSceneId: event.target.value,
                          label: destination
                            ? `Go to ${destination.name}`
                            : draft.label,
                        }
                      : draft,
                  );
                }}
              >
                {tour.scenes
                  .filter((scene) => scene.id !== activeScene.id)
                  .map((scene) => (
                    <option value={scene.id} key={scene.id}>
                      {scene.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Arrow label
              <input
                value={connectionDraft.label}
                onChange={(event) =>
                  setConnectionDraft((draft) =>
                    draft
                      ? { ...draft, label: event.target.value }
                      : draft,
                  )
                }
              />
            </label>
            <p>
              Click the photo beside this panel to reposition the arrow, then
              save the connection.
            </p>
            <div className="tour-dialog-actions">
              <button
                type="button"
                className="tour-secondary-button"
                onClick={() => setConnectionDraft(null)}
              >
                Cancel
              </button>
              <button type="button" className="button" onClick={saveConnection}>
                <Check size={17} />
                Save connection
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
