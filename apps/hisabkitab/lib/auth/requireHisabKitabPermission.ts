import {
  hasPermission,
  type HisabKitabPermission,
  type HisabKitabUserContext,
} from "./permissions";
import {
  HisabKitabForbiddenError,
  requireHisabKitabUser,
} from "./requireHisabKitabUser";

export async function requireHisabKitabPermission(
  permission: HisabKitabPermission,
  context?: HisabKitabUserContext,
) {
  const currentContext = context ?? (await requireHisabKitabUser());

  if (!hasPermission(currentContext, permission)) {
    throw new HisabKitabForbiddenError(`Missing permission: ${permission}`);
  }

  return currentContext;
}
