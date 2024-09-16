"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEASCredentialsForXcodeProject = exports.withAutoEasExtensionCredentials = exports.withEASTargets = void 0;
const target_1 = require("./target");
const withXcparse_1 = require("./withXcparse");
function safeSet(obj, key, value) {
    const segments = key.split(".");
    const last = segments.pop();
    segments.forEach((segment) => {
        if (!obj[segment]) {
            obj[segment] = {};
        }
        obj = obj[segment];
    });
    obj[last] = value;
    return obj;
}
const withEASTargets = (config, { bundleIdentifier, targetName, entitlements }) => {
    // Extra EAS targets
    safeSet(config, "extra.eas.build.experimental.ios.appExtensions", []);
    const existing = config.extra.eas.build.experimental.ios.appExtensions.findIndex((ext) => ext.targetName === targetName);
    if (existing > -1) {
        config.extra.eas.build.experimental.ios.appExtensions[existing] = {
            ...config.extra.eas.build.experimental.ios.appExtensions[existing],
            bundleIdentifier,
            entitlements: {
                ...config.extra.eas.build.experimental.ios.appExtensions[existing]
                    .entitlements,
                ...entitlements,
            },
        };
    }
    else {
        config.extra.eas.build.experimental.ios.appExtensions.push({
            bundleIdentifier,
            targetName,
            entitlements,
        });
        // "appExtensions": [
        //   {
        //     "targetName": "widgets",
        //     "bundleIdentifier": "com.evanbacon.pillarvalley.widgets",
        //     "entitlements": {
        //       "com.apple.security.application-groups": [
        //         "group.bacon.data"
        //       ]
        //     }
        //   }
        // ]
    }
    return config;
};
exports.withEASTargets = withEASTargets;
const withAutoEasExtensionCredentials = (config) => {
    return (0, withXcparse_1.withXcodeProjectBeta)(config, async (config) => {
        safeSet(config, "extra.eas.build.experimental.ios.appExtensions", []);
        const creds = getEASCredentialsForXcodeProject(config.modResults);
        // Warn about duplicates
        config.extra.eas.build.experimental.ios.appExtensions.forEach((ext) => {
            const existing = creds.find((cred) => cred.bundleIdentifier === ext.bundleIdentifier);
            if (existing &&
                (existing.targetName !== ext.targetName ||
                    existing.parentBundleIdentifier !== ext.parentBundleIdentifier)) {
                throw new Error(`EAS credentials already has a target "${ext.targetName}" with bundle identifier: ${ext.bundleIdentifier}.`);
            }
        });
        config.extra.eas.build.experimental.ios.appExtensions = [
            ...config.extra.eas.build.experimental.ios.appExtensions,
            ...creds,
        ];
        return config;
    });
};
exports.withAutoEasExtensionCredentials = withAutoEasExtensionCredentials;
function getEASCredentialsForXcodeProject(project) {
    const parentBundleIdentifier = (0, target_1.getMainAppTarget)(project).getDefaultConfiguration().props.buildSettings
        .PRODUCT_BUNDLE_IDENTIFIER;
    const targets = (0, target_1.getAuxiliaryTargets)(project);
    return targets.map((target) => {
        var _a;
        const config = target.getDefaultConfiguration();
        const entitlements = config.getEntitlements();
        const targetName = target.props.productName;
        if (!targetName) {
            throw new Error(`Target ${target.getDisplayName()} (${target.uuid}) does not have a productName.`);
        }
        return {
            targetName,
            bundleIdentifier: (_a = config.props.buildSettings) === null || _a === void 0 ? void 0 : _a.PRODUCT_BUNDLE_IDENTIFIER,
            parentBundleIdentifier,
            entitlements,
        };
    });
}
exports.getEASCredentialsForXcodeProject = getEASCredentialsForXcodeProject;
