import type {
  Framework,
  FrameworkControl,
  FrameworkDescriptor,
  FrameworkProvider,
  FrameworkRegistry,
} from "./types";
import {
  cmmcLevel2FrameworkProvider,
  nistHighFrameworkProvider,
  nistLowFrameworkProvider,
  nistModerateFrameworkProvider,
} from "./provider";
import { CMMC_LEVEL_2_IDENTITY } from "@/framework/cmmc-level-2-nist-sp-800-171-r2/identities";
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
