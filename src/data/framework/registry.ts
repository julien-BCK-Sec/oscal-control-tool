import type {
  Framework,
  FrameworkControl,
  FrameworkDescriptor,
  FrameworkProvider,
  FrameworkRegistry,
} from "./types";
import {
  cmmcLevel2FrameworkProvider,
  dodCloudIl4FrameworkProvider,
  nistHighFrameworkProvider,
  nistLowFrameworkProvider,
  nistModerateFrameworkProvider,
} from "./provider";
import { CMMC_LEVEL_2_IDENTITY } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
import { DOD_CLOUD_IL4_IDENTITY } from "@/framework/dod-cloud-il4-rev5/identities";
import {
  DEFAULT_FRAMEWORK_ID,
  NIST_HIGH_IDENTITY,
  NIST_LOW_IDENTITY,
  NIST_MODERATE_IDENTITY,
  type NistSp80053Rev5Identity,
} from "@/framework/nist-sp-800-53-rev5/identities";

function descriptorFromIdentity(
  identity: NistSp80053Rev5Identity,
): FrameworkDescriptor {
  return {
    id: identity.id,
    title: identity.title,
    catalog: identity.catalog,
    revision: identity.revision,
    profile: identity.profile,
    provider: identity.provider,
    source: identity.source,
    itemSingular: "control",
    itemPlural: "controls",
    oscalProfileTitle: identity.oscalProfileTitle,
    oscalProfileUri: identity.oscalProfileUri,
    oscalProfileMediaType: identity.oscalProfileMediaType,
  };
}

const ENTRIES: readonly {
  descriptor: FrameworkDescriptor;
  provider: FrameworkProvider;
}[] = [
  {
    descriptor: descriptorFromIdentity(NIST_LOW_IDENTITY),
    provider: nistLowFrameworkProvider,
  },
  {
    descriptor: descriptorFromIdentity(NIST_MODERATE_IDENTITY),
    provider: nistModerateFrameworkProvider,
  },
  {
    descriptor: descriptorFromIdentity(NIST_HIGH_IDENTITY),
    provider: nistHighFrameworkProvider,
  },
  {
    descriptor: {
      id: CMMC_LEVEL_2_IDENTITY.id,
      title: CMMC_LEVEL_2_IDENTITY.title,
      catalog: CMMC_LEVEL_2_IDENTITY.catalog,
      revision: CMMC_LEVEL_2_IDENTITY.revision,
      profile: CMMC_LEVEL_2_IDENTITY.profile,
      provider: CMMC_LEVEL_2_IDENTITY.provider,
      source: CMMC_LEVEL_2_IDENTITY.source,
      itemSingular: CMMC_LEVEL_2_IDENTITY.itemSingular,
      itemPlural: CMMC_LEVEL_2_IDENTITY.itemPlural,
    },
    provider: cmmcLevel2FrameworkProvider,
  },
  {
    descriptor: {
      id: DOD_CLOUD_IL4_IDENTITY.id,
      title: DOD_CLOUD_IL4_IDENTITY.title,
      catalog: DOD_CLOUD_IL4_IDENTITY.catalog,
      revision: DOD_CLOUD_IL4_IDENTITY.revision,
      profile: DOD_CLOUD_IL4_IDENTITY.profile,
      provider: DOD_CLOUD_IL4_IDENTITY.provider,
      source: DOD_CLOUD_IL4_IDENTITY.source,
      itemSingular: DOD_CLOUD_IL4_IDENTITY.itemSingular,
      itemPlural: DOD_CLOUD_IL4_IDENTITY.itemPlural,
      productSelectable: DOD_CLOUD_IL4_IDENTITY.productSelectable,
    },
    provider: dodCloudIl4FrameworkProvider,
  },
];

class InProcessFrameworkRegistry implements FrameworkRegistry {
  private readonly byId = new Map(
    ENTRIES.map((entry) => [entry.descriptor.id, entry] as const),
  );

  list(): readonly FrameworkDescriptor[] {
    return ENTRIES.map((entry) => entry.descriptor);
  }

  get(id: string): FrameworkProvider | undefined {
    return this.byId.get(id.trim())?.provider;
  }

  require(id: string): FrameworkProvider {
    const provider = this.get(id);
    if (!provider) {
      throw new UnknownFrameworkError(id);
    }
    return provider;
  }

  getDescriptor(id: string): FrameworkDescriptor | undefined {
    return this.byId.get(id.trim())?.descriptor;
  }

  requireDescriptor(id: string): FrameworkDescriptor {
    const descriptor = this.getDescriptor(id);
    if (!descriptor) {
      throw new UnknownFrameworkError(id);
    }
    return descriptor;
  }

  has(id: string): boolean {
    return this.byId.has(id.trim());
  }
}

export class UnknownFrameworkError extends Error {
  readonly frameworkId: string;

  constructor(frameworkId: string) {
    super(`Unknown framework: ${frameworkId.trim() || "(empty)"}`);
    this.name = "UnknownFrameworkError";
    this.frameworkId = frameworkId.trim();
  }
}

export const frameworkRegistry: FrameworkRegistry =
  new InProcessFrameworkRegistry();

export { DEFAULT_FRAMEWORK_ID };

export function isRegisteredFrameworkId(id: string): boolean {
  return frameworkRegistry.has(id);
}

export function isProductSelectableFramework(
  descriptor: FrameworkDescriptor,
): boolean {
  return descriptor.productSelectable !== false;
}

export function listProductSelectableFrameworks(): readonly FrameworkDescriptor[] {
  return frameworkRegistry.list().filter(isProductSelectableFramework);
}

export function isProductSelectableFrameworkId(id: string): boolean {
  const descriptor = frameworkRegistry.getDescriptor(id);
  return descriptor !== undefined && isProductSelectableFramework(descriptor);
}

/**
 * New-project create accepts registered, product-selectable IDs only.
 * Registered-but-gated frameworks remain resolvable for runtime/tests.
 */
export function assertProductSelectableFrameworkId(id: string): string {
  const frameworkId = id.trim();
  if (!isRegisteredFrameworkId(frameworkId)) {
    throw new Error("Unknown framework.");
  }
  if (!isProductSelectableFrameworkId(frameworkId)) {
    throw new Error("Framework is not available for new projects.");
  }
  return frameworkId;
}

export function resolveFramework(frameworkId: string): Framework {
  return frameworkRegistry.require(frameworkId).getFramework();
}

export function resolveFrameworkControls(
  frameworkId: string,
): readonly FrameworkControl[] {
  return resolveFramework(frameworkId).controls;
}

const controlIdSets = new Map<string, ReadonlySet<string>>();

export function resolveFrameworkControlIdSet(
  frameworkId: string,
): ReadonlySet<string> {
  const id = frameworkId.trim();
  const cached = controlIdSets.get(id);
  if (cached) {
    return cached;
  }
  const set = new Set(
    resolveFrameworkControls(id).map((control) => control.id),
  );
  controlIdSets.set(id, set);
  return set;
}

export function isFrameworkControlId(
  frameworkId: string,
  controlId: string,
): boolean {
  return resolveFrameworkControlIdSet(frameworkId).has(controlId.trim());
}
