import type {
  ActionDefinition,
  ActionId,
  Environment,
  EnvironmentId,
  Scenario,
} from "@/domain/schema";
import { relayWorksTaskPilot } from "./relayworks-taskpilot";

export const scenarios: Scenario[] = [relayWorksTaskPilot];

/** The only scenario shipped in P0. Additional packs are a P1 item. */
export const defaultScenario: Scenario = relayWorksTaskPilot;

export function getScenario(id: string): Scenario {
  const found = scenarios.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown scenario id: ${id}`);
  return found;
}

export function getEnvironment(
  scenario: Scenario,
  id: EnvironmentId,
): Environment {
  const found = scenario.environments.find((e) => e.id === id);
  if (!found) throw new Error(`Unknown environment id: ${id}`);
  return found;
}

export function getAction(scenario: Scenario, id: ActionId): ActionDefinition {
  const found = scenario.actions.find((a) => a.id === id);
  if (!found) throw new Error(`Unknown action id: ${id}`);
  return found;
}

export { relayWorksTaskPilot };
