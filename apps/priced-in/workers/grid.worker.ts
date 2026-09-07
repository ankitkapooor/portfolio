import { computeGrid, type GridRequest, type GridResult } from "@/domain/finance/grid";

export interface GridWorkerRequest {
  id: number;
  request: GridRequest;
}

export interface GridWorkerResponse {
  id: number;
  result: GridResult;
}

self.addEventListener("message", (event: MessageEvent<GridWorkerRequest>) => {
  const { id, request } = event.data;
  const response: GridWorkerResponse = { id, result: computeGrid(request) };
  (self as unknown as Worker).postMessage(response);
});
