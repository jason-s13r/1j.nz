import { Namer } from "@parcel/plugin";

export default new Namer({
  name({ bundle, bundleGraph }) {
    if (
      bundle.needsStableName ||
      bundle.getEntryAssets().length > 0 ||
      bundleGraph.getBundleGroupsContainingBundle(bundle).length < 2
    ) {
      return null;
    }
    return `shared.${bundle.hashReference}.${bundle.type}`;
  },
});
