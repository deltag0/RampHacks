export type TourPoint = {
  x: number;
  y: number;
};

export type TourConnection = {
  id: string;
  fromSceneId: string;
  toSceneId: string;
  label: string;
  position: TourPoint;
};

export type TourScene = {
  id: string;
  name: string;
  imageUrl: string;
  imageAlt: string;
};

export type HomeTour = {
  title: string;
  startSceneId: string | null;
  scenes: TourScene[];
  connections: TourConnection[];
};

export function connectionsFrom(
  tour: HomeTour,
  sceneId: string,
): TourConnection[] {
  return tour.connections.filter(
    (connection) => connection.fromSceneId === sceneId,
  );
}

export function removeScene(tour: HomeTour, sceneId: string): HomeTour {
  const scenes = tour.scenes.filter((scene) => scene.id !== sceneId);

  return {
    ...tour,
    scenes,
    startSceneId:
      tour.startSceneId === sceneId
        ? (scenes[0]?.id ?? null)
        : tour.startSceneId,
    connections: tour.connections.filter(
      (connection) =>
        connection.fromSceneId !== sceneId &&
        connection.toSceneId !== sceneId,
    ),
  };
}

export function clampTourPoint(point: TourPoint): TourPoint {
  return {
    x: Math.min(100, Math.max(0, point.x)),
    y: Math.min(100, Math.max(0, point.y)),
  };
}
