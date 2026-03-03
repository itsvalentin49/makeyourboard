export type AnyRow = Record<string, any>;

export type BoardItem = AnyRow & {
  instanceId: number;
  x: number;
  y: number;
  rotation: number;
};

export type Project = {
  id: number;
  name: string;
  zoom: number;
  stageX?: number;
  stageY?: number;
  boardPedals: BoardItem[];
  selectedBoards: BoardItem[];
};
