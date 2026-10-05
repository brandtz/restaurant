import "server-only";

import { parseEnvironment } from "./environment";

export function getServerEnvironment() {
  return parseEnvironment(process.env);
}
