import { ConfigPlugin } from "@expo/config-plugins";
import { ExtensionType } from "./target";
export type XcodeSettings = {
    name: string;
    /** Directory relative to the project root, (i.e. outside of the `ios` directory) where the widget code should live. */
    cwd: string;
    bundleId: string;
    deploymentTarget: string;
    currentProjectVersion: number;
    frameworks: string[];
    dependencyTargets: string[];
    type: ExtensionType;
    hasAccentColor?: boolean;
    colors?: Record<string, string>;
    teamId?: string;
    icon?: string;
};
export declare const withXcodeChanges: ConfigPlugin<XcodeSettings>;
