"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withXcodeChanges = void 0;
const xcode_1 = require("@bacons/xcode");
const fs_1 = __importDefault(require("fs"));
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
const target_1 = require("./target");
const XCBuildConfiguration_json_1 = __importDefault(require("./template/XCBuildConfiguration.json"));
const withXcparse_1 = require("./withXcparse");
const TemplateBuildSettings = XCBuildConfiguration_json_1.default;
const withXcodeChanges = (config, props) => {
    return (0, withXcparse_1.withXcodeProjectBeta)(config, async (config) => {
        // NOTE: important to await here, so that withMods "wait" for another one to finish first
        // @ts-expect-error
        await applyXcodeChanges(config, config.modResults, props);
        return config;
    });
};
exports.withXcodeChanges = withXcodeChanges;
function createNotificationContentConfigurationList(project, { name, cwd, bundleId, deploymentTarget, currentProjectVersion, }) {
    const common = {
        CLANG_ANALYZER_NONNULL: "YES",
        CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
        CLANG_CXX_LANGUAGE_STANDARD: "gnu++20",
        CLANG_ENABLE_OBJC_WEAK: "YES",
        CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
        CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
        CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
        CODE_SIGN_STYLE: "Automatic",
        COPY_PHASE_STRIP: "NO",
        DEBUG_INFORMATION_FORMAT: "dwarf-with-dsym",
        GCC_C_LANGUAGE_STANDARD: "gnu11",
        GENERATE_INFOPLIST_FILE: "YES",
        CURRENT_PROJECT_VERSION: currentProjectVersion,
        INFOPLIST_FILE: cwd + "/Info.plist",
        INFOPLIST_KEY_CFBundleDisplayName: name,
        INFOPLIST_KEY_NSHumanReadableCopyright: "",
        IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
        LD_RUNPATH_SEARCH_PATHS: "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks",
        MARKETING_VERSION: "1.0",
        MTL_FAST_MATH: "YES",
        PRODUCT_BUNDLE_IDENTIFIER: bundleId,
        PRODUCT_NAME: "$(TARGET_NAME)",
        SKIP_INSTALL: "YES",
        SWIFT_EMIT_LOC_STRINGS: "YES",
        SWIFT_OPTIMIZATION_LEVEL: "-Owholemodule",
        SWIFT_VERSION: "5.0",
        TARGETED_DEVICE_FAMILY: "1,2",
    };
    const debugBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Debug",
        buildSettings: {
            ...common,
            // Diff
            MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
            SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
            SWIFT_OPTIMIZATION_LEVEL: "-Onone",
            DEBUG_INFORMATION_FORMAT: "dwarf",
        },
    });
    const releaseBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Release",
        buildSettings: {
            CLANG_ANALYZER_NONNULL: "YES",
            ...common,
        },
    });
    const configurationList = xcode_1.XCConfigurationList.create(project, {
        buildConfigurations: [debugBuildConfig, releaseBuildConfig],
        defaultConfigurationIsVisible: 0,
        defaultConfigurationName: "Release",
    });
    return configurationList;
}
function createExtensionConfigurationListFromTemplate(project, 
// NSExtensionPointIdentifier
extensionType, { name, cwd, bundleId, deploymentTarget, currentProjectVersion, icon, }) {
    if (!TemplateBuildSettings[extensionType]) {
        throw new Error(`No template for extension type ${extensionType}. Add it to the xcode project and re-run the generation script.`);
    }
    const template = TemplateBuildSettings[extensionType];
    const dynamic = {
        CURRENT_PROJECT_VERSION: currentProjectVersion,
        INFOPLIST_FILE: cwd + "/Info.plist",
        INFOPLIST_KEY_CFBundleDisplayName: name,
        IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
        PRODUCT_BUNDLE_IDENTIFIER: bundleId,
    };
    if (icon) {
        // Add `ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;` build settings
        dynamic.ASSETCATALOG_COMPILER_APPICON_NAME = "AppIcon";
    }
    const debugBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Debug",
        buildSettings: {
            ...template.default,
            ...template.debug,
            ...dynamic,
        },
    });
    const releaseBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Release",
        buildSettings: {
            ...template.default,
            ...template.release,
            ...dynamic,
        },
    });
    const configurationList = xcode_1.XCConfigurationList.create(project, {
        buildConfigurations: [debugBuildConfig, releaseBuildConfig],
        defaultConfigurationIsVisible: 0,
        defaultConfigurationName: "Release",
    });
    return configurationList;
}
function createShareConfigurationList(project, { name, cwd, bundleId, deploymentTarget, currentProjectVersion, }) {
    const common = {
        CLANG_ANALYZER_NONNULL: "YES",
        CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
        CLANG_CXX_LANGUAGE_STANDARD: "gnu++20",
        CLANG_ENABLE_OBJC_WEAK: "YES",
        CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
        CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
        CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
        CODE_SIGN_STYLE: "Automatic",
        DEBUG_INFORMATION_FORMAT: "dwarf",
        GCC_C_LANGUAGE_STANDARD: "gnu11",
        GENERATE_INFOPLIST_FILE: "YES",
        CURRENT_PROJECT_VERSION: currentProjectVersion,
        INFOPLIST_FILE: cwd + "/Info.plist",
        INFOPLIST_KEY_CFBundleDisplayName: name,
        INFOPLIST_KEY_NSHumanReadableCopyright: "",
        IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
        LD_RUNPATH_SEARCH_PATHS: "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks",
        MARKETING_VERSION: "1.0",
        MTL_FAST_MATH: "YES",
        PRODUCT_BUNDLE_IDENTIFIER: bundleId,
        PRODUCT_NAME: "$(TARGET_NAME)",
        SKIP_INSTALL: "YES",
        SWIFT_EMIT_LOC_STRINGS: "YES",
        SWIFT_OPTIMIZATION_LEVEL: "-Onone",
        SWIFT_VERSION: "5.0",
        TARGETED_DEVICE_FAMILY: "1,2",
    };
    const debugBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Debug",
        buildSettings: {
            ...common,
            // Diff
            MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
            SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
        },
    });
    const releaseBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Release",
        buildSettings: {
            CLANG_ANALYZER_NONNULL: "YES",
            ...common,
            // Diff
            COPY_PHASE_STRIP: "NO",
        },
    });
    const configurationList = xcode_1.XCConfigurationList.create(project, {
        buildConfigurations: [debugBuildConfig, releaseBuildConfig],
        defaultConfigurationIsVisible: 0,
        defaultConfigurationName: "Release",
    });
    return configurationList;
}
function getMainMarketingVersion(project) {
    const mainTarget = (0, target_1.getMainAppTarget)(project);
    const config = mainTarget.getDefaultConfiguration();
    const info = config.getInfoPlist();
    const version = info.CFBundleShortVersionString;
    // console.log('getMainMarketingVersion', mainTarget.getDisplayName(), version)
    if (!version || version === "$(MARKETING_VERSION)") {
        // console.log('getMainMarketingVersion.fallback', config.props.buildSettings.MARKETING_VERSION)
        return config.props.buildSettings.MARKETING_VERSION;
    }
    return version;
}
function createIMessageConfigurationList(project, { name, cwd, bundleId, deploymentTarget, currentProjectVersion, }) {
    const common = {
        ASSETCATALOG_COMPILER_APPICON_NAME: "iMessage App Icon",
        CLANG_ANALYZER_NONNULL: "YES",
        CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
        CLANG_CXX_LANGUAGE_STANDARD: "gnu++20",
        CLANG_ENABLE_OBJC_WEAK: "YES",
        CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
        CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
        CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
        CODE_SIGN_STYLE: "Automatic",
        DEBUG_INFORMATION_FORMAT: "dwarf",
        GCC_C_LANGUAGE_STANDARD: "gnu11",
        GENERATE_INFOPLIST_FILE: "YES",
        CURRENT_PROJECT_VERSION: currentProjectVersion,
        INFOPLIST_FILE: cwd + "/Info.plist",
        INFOPLIST_KEY_CFBundleDisplayName: name,
        INFOPLIST_KEY_NSHumanReadableCopyright: "",
        IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
        LD_RUNPATH_SEARCH_PATHS: "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks",
        MARKETING_VERSION: "1.0",
        MTL_FAST_MATH: "YES",
        PRODUCT_BUNDLE_IDENTIFIER: bundleId,
        PRODUCT_NAME: "$(TARGET_NAME)",
        SKIP_INSTALL: "YES",
        SWIFT_EMIT_LOC_STRINGS: "YES",
        SWIFT_OPTIMIZATION_LEVEL: "-Onone",
        SWIFT_VERSION: "5.0",
        TARGETED_DEVICE_FAMILY: "1,2",
    };
    const debugBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Debug",
        buildSettings: {
            ...common,
            // Diff
            MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
            SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
        },
    });
    const releaseBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Release",
        buildSettings: {
            ...common,
            // Diff
            COPY_PHASE_STRIP: "NO",
        },
    });
    const configurationList = xcode_1.XCConfigurationList.create(project, {
        buildConfigurations: [debugBuildConfig, releaseBuildConfig],
        defaultConfigurationIsVisible: 0,
        defaultConfigurationName: "Release",
    });
    return configurationList;
}
function createWatchAppConfigurationList(project, { name, cwd, bundleId, deploymentTarget, currentProjectVersion, hasAccentColor, }) {
    const mainAppTarget = (0, target_1.getMainAppTarget)(project).getDefaultConfiguration();
    // NOTE: No base Info.plist needed.
    const common = {
        ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
        CLANG_ANALYZER_NONNULL: "YES",
        CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
        CLANG_CXX_LANGUAGE_STANDARD: "gnu++20",
        CLANG_ENABLE_OBJC_WEAK: "YES",
        CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
        CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
        CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
        CODE_SIGN_STYLE: "Automatic",
        CURRENT_PROJECT_VERSION: currentProjectVersion,
        ENABLE_PREVIEWS: "YES",
        GCC_C_LANGUAGE_STANDARD: "gnu11",
        INFOPLIST_FILE: cwd + "/Info.plist",
        GENERATE_INFOPLIST_FILE: "YES",
        INFOPLIST_KEY_CFBundleDisplayName: name,
        INFOPLIST_KEY_UISupportedInterfaceOrientations: "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown",
        INFOPLIST_KEY_WKCompanionAppBundleIdentifier: mainAppTarget.props.buildSettings.PRODUCT_BUNDLE_IDENTIFIER,
        // INFOPLIST_KEY_WKCompanionAppBundleIdentifier: "$(BUNDLE_IDENTIFIER)",
        // INFOPLIST_KEY_WKCompanionAppBundleIdentifier: rootBundleId,
        LD_RUNPATH_SEARCH_PATHS: "$(inherited) @executable_path/Frameworks",
        MARKETING_VERSION: "1.0",
        MTL_FAST_MATH: "YES",
        PRODUCT_BUNDLE_IDENTIFIER: bundleId,
        PRODUCT_NAME: "$(TARGET_NAME)",
        SDKROOT: "watchos",
        SKIP_INSTALL: "YES",
        SWIFT_EMIT_LOC_STRINGS: "YES",
        SWIFT_OPTIMIZATION_LEVEL: "-Onone",
        SWIFT_VERSION: "5.0",
        TARGETED_DEVICE_FAMILY: "4",
        WATCHOS_DEPLOYMENT_TARGET: deploymentTarget !== null && deploymentTarget !== void 0 ? deploymentTarget : "9.4",
        // WATCHOS_DEPLOYMENT_TARGET: 9.4,
    };
    if (hasAccentColor) {
        common.ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = "$accent";
    }
    const debugBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Debug",
        buildSettings: {
            ...common,
            // Diff
            MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
            SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
            DEBUG_INFORMATION_FORMAT: "dwarf", // NOTE
        },
    });
    const releaseBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Release",
        buildSettings: {
            ...common,
            // Diff
            SWIFT_OPTIMIZATION_LEVEL: "-Owholemodule",
            COPY_PHASE_STRIP: "NO",
            DEBUG_INFORMATION_FORMAT: "dwarf-with-dsym",
        },
    });
    const configurationList = xcode_1.XCConfigurationList.create(project, {
        buildConfigurations: [debugBuildConfig, releaseBuildConfig],
        defaultConfigurationIsVisible: 0,
        defaultConfigurationName: "Release",
    });
    return configurationList;
}
function createWatchWidgetConfigurationList(project, { name, cwd, bundleId, deploymentTarget, currentProjectVersion, hasAccentColor, }) {
    const mainAppTarget = (0, target_1.getMainAppTarget)(project).getDefaultConfiguration();
    // NOTE: No base Info.plist needed.
    const common = {
        ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
        CLANG_ANALYZER_NONNULL: "YES",
        CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
        CLANG_CXX_LANGUAGE_STANDARD: "gnu++20",
        CLANG_ENABLE_OBJC_WEAK: "YES",
        CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
        CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
        CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
        CODE_SIGN_STYLE: "Automatic",
        CURRENT_PROJECT_VERSION: currentProjectVersion,
        GCC_C_LANGUAGE_STANDARD: "gnu11",
        INFOPLIST_FILE: cwd + "/Info.plist",
        GENERATE_INFOPLIST_FILE: "YES",
        INFOPLIST_KEY_CFBundleDisplayName: name,
        // @ts-expect-error Not part of xcode project types yet
        INTENTS_CODEGEN_LANGUAGE: "Swift",
        LD_RUNPATH_SEARCH_PATHS: "$(inherited) @executable_path/Frameworks",
        MARKETING_VERSION: "1.0",
        MTL_FAST_MATH: "YES",
        PRODUCT_BUNDLE_IDENTIFIER: bundleId,
        PRODUCT_NAME: "$(TARGET_NAME)",
        SDKROOT: "watchos",
        SKIP_INSTALL: "YES",
        SWIFT_EMIT_LOC_STRINGS: "YES",
        SWIFT_OPTIMIZATION_LEVEL: "-Onone",
        SWIFT_VERSION: "5.0",
        TARGETED_DEVICE_FAMILY: "4",
        WATCHOS_DEPLOYMENT_TARGET: deploymentTarget !== null && deploymentTarget !== void 0 ? deploymentTarget : "9.4",
    };
    if (hasAccentColor) {
        common.ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = "$accent";
    }
    const debugBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Debug",
        buildSettings: {
            ...common,
            // Diff
            MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
            SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG $(inherited)",
            // SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
            DEBUG_INFORMATION_FORMAT: "dwarf", // NOTE
        },
    });
    const releaseBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Release",
        buildSettings: {
            ...common,
            // Diff
            SWIFT_OPTIMIZATION_LEVEL: "-Owholemodule",
            COPY_PHASE_STRIP: "NO",
            DEBUG_INFORMATION_FORMAT: "dwarf-with-dsym",
        },
    });
    const configurationList = xcode_1.XCConfigurationList.create(project, {
        buildConfigurations: [debugBuildConfig, releaseBuildConfig],
        defaultConfigurationIsVisible: 0,
        defaultConfigurationName: "Release",
    });
    return configurationList;
}
function createSafariConfigurationList(project, { name, cwd, bundleId, deploymentTarget, currentProjectVersion, }) {
    const common = {
        CLANG_ANALYZER_NONNULL: "YES",
        CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
        CLANG_CXX_LANGUAGE_STANDARD: "gnu++20",
        CLANG_ENABLE_OBJC_WEAK: "YES",
        CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
        CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
        CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
        CODE_SIGN_STYLE: "Automatic",
        GCC_C_LANGUAGE_STANDARD: "gnu11",
        GENERATE_INFOPLIST_FILE: "YES",
        CURRENT_PROJECT_VERSION: currentProjectVersion,
        INFOPLIST_FILE: cwd + "/Info.plist",
        INFOPLIST_KEY_CFBundleDisplayName: name,
        INFOPLIST_KEY_NSHumanReadableCopyright: "",
        IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
        LD_RUNPATH_SEARCH_PATHS: "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks",
        MARKETING_VERSION: "1.0",
        MTL_FAST_MATH: "YES",
        PRODUCT_BUNDLE_IDENTIFIER: bundleId,
        PRODUCT_NAME: "$(TARGET_NAME)",
        SKIP_INSTALL: "YES",
        SWIFT_EMIT_LOC_STRINGS: "YES",
        SWIFT_OPTIMIZATION_LEVEL: "-Onone",
        SWIFT_VERSION: "5.0",
        TARGETED_DEVICE_FAMILY: "1,2",
        OTHER_LDFLAGS: [`-framework`, "SafariServices"],
    };
    const debugBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Debug",
        buildSettings: {
            ...common,
            // Diff
            MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
            SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
            DEBUG_INFORMATION_FORMAT: "dwarf", // NOTE
        },
    });
    const releaseBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Release",
        buildSettings: {
            ...common,
            // Diff
            SWIFT_OPTIMIZATION_LEVEL: "-Owholemodule",
            COPY_PHASE_STRIP: "NO",
            DEBUG_INFORMATION_FORMAT: "dwarf-with-dsym",
        },
    });
    const configurationList = xcode_1.XCConfigurationList.create(project, {
        buildConfigurations: [debugBuildConfig, releaseBuildConfig],
        defaultConfigurationIsVisible: 0,
        defaultConfigurationName: "Release",
    });
    return configurationList;
}
function createAppClipConfigurationList(project, { name, cwd, bundleId, deploymentTarget, currentProjectVersion, hasAccentColor, }) {
    // TODO: Unify AppIcon and AccentColor logic
    const dynamic = {
        CURRENT_PROJECT_VERSION: currentProjectVersion,
        INFOPLIST_FILE: cwd + "/Info.plist",
        INFOPLIST_KEY_CFBundleDisplayName: name,
        IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
        MARKETING_VERSION: "1.0",
        PRODUCT_BUNDLE_IDENTIFIER: bundleId,
        // TODO: Add this later like entitlements
        // DEVELOPMENT_ASSET_PATHS: `\"${cwd}/Preview Content\"`,
    };
    if (hasAccentColor) {
        dynamic.ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME = "$accent";
    }
    const superCommon = {
        CLANG_ANALYZER_NONNULL: "YES",
        CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
        CLANG_CXX_LANGUAGE_STANDARD: "gnu++20",
        CLANG_ENABLE_OBJC_WEAK: "YES",
        CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
        CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
        CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
        CODE_SIGN_STYLE: "Automatic",
        COPY_PHASE_STRIP: "NO",
        PRODUCT_NAME: "$(TARGET_NAME)",
        SWIFT_EMIT_LOC_STRINGS: "YES",
        SWIFT_VERSION: "5.0",
        TARGETED_DEVICE_FAMILY: "1,2",
    };
    const infoPlist = {
        GENERATE_INFOPLIST_FILE: "YES",
        INFOPLIST_KEY_UIApplicationSceneManifest_Generation: "YES",
        INFOPLIST_KEY_UIApplicationSupportsIndirectInputEvents: "YES",
        INFOPLIST_KEY_UILaunchScreen_Generation: "YES",
        INFOPLIST_KEY_UISupportedInterfaceOrientations_iPad: "UIInterfaceOrientationPortrait UIInterfaceOrientationPortraitUpsideDown UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight",
        INFOPLIST_KEY_UISupportedInterfaceOrientations_iPhone: "UIInterfaceOrientationPortrait UIInterfaceOrientationLandscapeLeft UIInterfaceOrientationLandscapeRight",
    };
    // @ts-expect-error
    const common = {
        ...dynamic,
        ...infoPlist,
        ...superCommon,
        ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
        LD_RUNPATH_SEARCH_PATHS: "$(inherited) @executable_path/Frameworks",
        MTL_FAST_MATH: "YES",
        ENABLE_PREVIEWS: "YES",
    };
    const debugBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Debug",
        buildSettings: {
            ...common,
            SWIFT_OPTIMIZATION_LEVEL: "-Onone",
            // Diff
            MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
            SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
            DEBUG_INFORMATION_FORMAT: "dwarf", // NOTE
        },
    });
    const releaseBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Release",
        buildSettings: {
            ...common,
            // Diff
            SWIFT_OPTIMIZATION_LEVEL: "-Owholemodule",
            COPY_PHASE_STRIP: "NO",
            DEBUG_INFORMATION_FORMAT: "dwarf-with-dsym",
        },
    });
    const configurationList = xcode_1.XCConfigurationList.create(project, {
        buildConfigurations: [debugBuildConfig, releaseBuildConfig],
        defaultConfigurationIsVisible: 0,
        defaultConfigurationName: "Release",
    });
    return configurationList;
}
function createConfigurationList(project, { name, cwd, bundleId, deploymentTarget, currentProjectVersion, }) {
    const debugBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Debug",
        buildSettings: {
            ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: "$accent",
            ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME: "$widgetBackground",
            CLANG_ANALYZER_NONNULL: "YES",
            CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
            CLANG_CXX_LANGUAGE_STANDARD: "gnu++20",
            CLANG_ENABLE_OBJC_WEAK: "YES",
            CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
            CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
            CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
            CODE_SIGN_STYLE: "Automatic",
            CURRENT_PROJECT_VERSION: currentProjectVersion,
            DEBUG_INFORMATION_FORMAT: "dwarf",
            GCC_C_LANGUAGE_STANDARD: "gnu11",
            GENERATE_INFOPLIST_FILE: "YES",
            INFOPLIST_FILE: cwd + "/Info.plist",
            INFOPLIST_KEY_CFBundleDisplayName: name,
            INFOPLIST_KEY_NSHumanReadableCopyright: "",
            IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
            LD_RUNPATH_SEARCH_PATHS: "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks",
            MARKETING_VERSION: "1.0",
            MTL_ENABLE_DEBUG_INFO: "INCLUDE_SOURCE",
            MTL_FAST_MATH: "YES",
            PRODUCT_BUNDLE_IDENTIFIER: bundleId,
            PRODUCT_NAME: "$(TARGET_NAME)",
            SKIP_INSTALL: "YES",
            SWIFT_ACTIVE_COMPILATION_CONDITIONS: "DEBUG",
            SWIFT_EMIT_LOC_STRINGS: "YES",
            SWIFT_OPTIMIZATION_LEVEL: "-Onone",
            SWIFT_VERSION: "5",
            TARGETED_DEVICE_FAMILY: "1,2",
        },
    });
    const releaseBuildConfig = xcode_1.XCBuildConfiguration.create(project, {
        name: "Release",
        buildSettings: {
            ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME: "$accent",
            ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME: "$widgetBackground",
            CLANG_ANALYZER_NONNULL: "YES",
            CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION: "YES_AGGRESSIVE",
            CLANG_CXX_LANGUAGE_STANDARD: "gnu++20",
            CLANG_ENABLE_OBJC_WEAK: "YES",
            CLANG_WARN_DOCUMENTATION_COMMENTS: "YES",
            CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER: "YES",
            CLANG_WARN_UNGUARDED_AVAILABILITY: "YES_AGGRESSIVE",
            CODE_SIGN_STYLE: "Automatic",
            COPY_PHASE_STRIP: "NO",
            CURRENT_PROJECT_VERSION: currentProjectVersion,
            DEBUG_INFORMATION_FORMAT: "dwarf-with-dsym",
            GCC_C_LANGUAGE_STANDARD: "gnu11",
            GENERATE_INFOPLIST_FILE: "YES",
            INFOPLIST_FILE: cwd + "/Info.plist",
            INFOPLIST_KEY_CFBundleDisplayName: name,
            INFOPLIST_KEY_NSHumanReadableCopyright: "",
            IPHONEOS_DEPLOYMENT_TARGET: deploymentTarget,
            LD_RUNPATH_SEARCH_PATHS: "$(inherited) @executable_path/Frameworks @executable_path/../../Frameworks",
            MARKETING_VERSION: "1.0",
            MTL_FAST_MATH: "YES",
            PRODUCT_BUNDLE_IDENTIFIER: bundleId,
            PRODUCT_NAME: "$(TARGET_NAME)",
            SKIP_INSTALL: "YES",
            SWIFT_EMIT_LOC_STRINGS: "YES",
            SWIFT_OPTIMIZATION_LEVEL: "-Owholemodule",
            SWIFT_VERSION: "5",
            TARGETED_DEVICE_FAMILY: "1,2",
        },
    });
    const configurationList = xcode_1.XCConfigurationList.create(project, {
        buildConfigurations: [debugBuildConfig, releaseBuildConfig],
        defaultConfigurationIsVisible: 0,
        defaultConfigurationName: "Release",
    });
    return configurationList;
}
function createConfigurationListForType(project, props) {
    if (props.type === "widget") {
        return createConfigurationList(project, props);
    }
    else if (props.type === "action") {
        return createExtensionConfigurationListFromTemplate(project, "com.apple.services", props);
    }
    else if (props.type === "share") {
        return createShareConfigurationList(project, props);
    }
    else if (props.type === "safari") {
        return createSafariConfigurationList(project, props);
    }
    else if (props.type === "imessage") {
        return createIMessageConfigurationList(project, props);
    }
    else if (props.type === "clip") {
        return createAppClipConfigurationList(project, props);
    }
    else if (props.type === "watch") {
        return createWatchAppConfigurationList(project, props);
    }
    else if (props.type === "watch-widget") {
        return createWatchWidgetConfigurationList(project, props);
    }
    else {
        // TODO: More
        return createNotificationContentConfigurationList(project, props);
    }
}
/** It's common for all frameworks to exist in the top-level "Frameworks" folder that shows in Xcode. */
function addFrameworksToDisplayFolder(project, frameworks) {
    var _a;
    const mainFrameworksGroup = (_a = project.rootObject.props.mainGroup
        .getChildGroups()
        .find((group) => group.getDisplayName() === "Frameworks")) !== null && _a !== void 0 ? _a : 
    // If this happens, there's a big problem. But just in case...
    project.rootObject.props.mainGroup.createGroup({
        name: "Frameworks",
        sourceTree: "<group>",
    });
    frameworks.forEach((file) => {
        if (!mainFrameworksGroup.props.children.find((child) => child.uuid === file.uuid)) {
            mainFrameworksGroup.props.children.push(file);
        }
    });
}
function getFramework(project, name) {
    const frameworkName = name + ".framework";
    for (const [, entry] of project.entries()) {
        if (xcode_1.PBXFileReference.is(entry) &&
            entry.props.lastKnownFileType === "wrapper.framework" &&
            entry.props.sourceTree === "SDKROOT" &&
            entry.props.name === frameworkName) {
            return entry;
        }
    }
    return xcode_1.PBXFileReference.create(project, {
        path: "System/Library/Frameworks/" + frameworkName,
    });
}
async function applyXcodeChanges(config, project, props) {
    var _a, _b, _c;
    const mainAppTarget = (0, target_1.getMainAppTarget)(project);
    // Special setting for share extensions.
    if ((0, target_1.needsEmbeddedSwift)(props.type)) {
        // Add ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES to the main app target
        mainAppTarget.setBuildSetting("ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES", "YES");
    }
    function getExtensionTargets() {
        return project.rootObject.props.targets.filter((target) => {
            return (xcode_1.PBXNativeTarget.is(target) && (0, target_1.isNativeTargetOfType)(target, props.type));
        });
    }
    const targets = getExtensionTargets();
    const productName = props.name;
    // const productName = props.name + "Extension";
    const targetToUpdate = (_a = targets.find((target) => target.props.productName === productName)) !== null && _a !== void 0 ? _a : targets[0];
    if (targetToUpdate) {
        console.log(`Target "${targetToUpdate.props.productName}" already exists, updating instead of creating a new one`);
    }
    const magicCwd = path_1.default.join(config._internal.projectRoot, "ios", props.cwd);
    function getOrCreateBuildFile(file) {
        for (const entry of file.getReferrers()) {
            if (xcode_1.PBXBuildFile.is(entry) && entry.props.fileRef.uuid === file.uuid) {
                return entry;
            }
        }
        return xcode_1.PBXBuildFile.create(project, {
            fileRef: file,
        });
    }
    // Add the widget target to the display folder (cosmetic)
    addFrameworksToDisplayFolder(project, props.frameworks.map((framework) => getFramework(project, framework)));
    const developmentTeamId = (_b = props.teamId) !== null && _b !== void 0 ? _b : mainAppTarget.getDefaultBuildSetting("DEVELOPMENT_TEAM");
    if (!developmentTeamId) {
        throw new Error("Couldn't find DEVELOPMENT_TEAM in Xcode project and none were provided in the Expo config.");
    }
    function applyDevelopmentTeamIdToTargets() {
        var _a, _b;
        var _c, _d, _e;
        project.rootObject.props.targets.forEach((target) => {
            if (developmentTeamId) {
                target.setBuildSetting("DEVELOPMENT_TEAM", developmentTeamId);
            }
            else {
                target.removeBuildSetting("DEVELOPMENT_TEAM");
            }
        });
        for (const target of project.rootObject.props.targets) {
            (_a = (_c = project.rootObject.props.attributes).TargetAttributes) !== null && _a !== void 0 ? _a : (_c.TargetAttributes = {});
            // idk, attempting to prevent EAS Build from failing when it codesigns
            (_b = (_d = project.rootObject.props.attributes.TargetAttributes)[_e = target.uuid]) !== null && _b !== void 0 ? _b : (_d[_e] = {
                CreatedOnToolsVersion: "14.3",
                ProvisioningStyle: "Automatic",
                DevelopmentTeam: developmentTeamId,
            });
        }
    }
    function configureTargetWithKnownSettings(target) {
        var _a, _b;
        if ((_a = props.colors) === null || _a === void 0 ? void 0 : _a.$accent) {
            target.setBuildSetting("ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME", "$accent");
        }
        else {
            target.removeBuildSetting("ASSETCATALOG_COMPILER_GLOBAL_ACCENT_COLOR_NAME");
        }
        if ((_b = props.colors) === null || _b === void 0 ? void 0 : _b.$widgetBackground) {
            target.setBuildSetting("ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME", "$widgetBackground");
        }
        else {
            target.removeBuildSetting("ASSETCATALOG_COMPILER_WIDGET_BACKGROUND_COLOR_NAME");
        }
    }
    function configureTargetWithEntitlements(target) {
        const entitlements = (0, glob_1.sync)("*.entitlements", {
            absolute: true,
            cwd: magicCwd,
        }).map((file) => {
            return xcode_1.PBXBuildFile.create(project, {
                fileRef: xcode_1.PBXFileReference.create(project, {
                    path: path_1.default.basename(file),
                    explicitFileType: "text.plist.entitlements",
                    sourceTree: "<group>",
                }),
            });
        });
        if (entitlements.length > 0) {
            target.setBuildSetting("CODE_SIGN_ENTITLEMENTS", props.cwd + "/" + entitlements[0].props.fileRef.props.path);
        }
        else {
            target.removeBuildSetting("CODE_SIGN_ENTITLEMENTS");
        }
        return entitlements;
        // CODE_SIGN_ENTITLEMENTS = MattermostShare/MattermostShare.entitlements;
    }
    function syncMarketingVersions() {
        const mainVersion = getMainMarketingVersion(project);
        // console.log('main marketing version:', mainVersion)
        project.rootObject.props.targets.forEach((target) => {
            if (xcode_1.PBXNativeTarget.is(target)) {
                target.setBuildSetting("MARKETING_VERSION", mainVersion);
            }
        });
    }
    function configureTargetWithPreview(target) {
        const assets = (0, glob_1.sync)("preview/*.xcassets", {
            absolute: true,
            cwd: magicCwd,
        })[0];
        if (assets) {
            target.setBuildSetting("DEVELOPMENT_ASSET_PATHS", `"${props.cwd + "/preview"}"`);
        }
        else {
            target.removeBuildSetting("DEVELOPMENT_ASSET_PATHS");
        }
        return assets;
    }
    if (targetToUpdate) {
        // Remove existing build phases
        targetToUpdate.props.buildConfigurationList.props.buildConfigurations.forEach((config) => {
            config.getReferrers().forEach((ref) => {
                ref.removeReference(config.uuid);
            });
            config.removeFromProject();
        });
        // Remove existing build configuration list
        targetToUpdate.props.buildConfigurationList
            .getReferrers()
            .forEach((ref) => {
            ref.removeReference(targetToUpdate.props.buildConfigurationList.uuid);
        });
        targetToUpdate.props.buildConfigurationList.removeFromProject();
        // Create new build phases
        targetToUpdate.props.buildConfigurationList =
            createConfigurationListForType(project, props);
        configureTargetWithEntitlements(targetToUpdate);
        configureTargetWithPreview(targetToUpdate);
        configureTargetWithKnownSettings(targetToUpdate);
        applyDevelopmentTeamIdToTargets();
        syncMarketingVersions();
        return project;
    }
    // Build Files
    // NOTE: Single-level only
    const swiftFiles = (0, glob_1.sync)("*.swift", {
        absolute: true,
        cwd: magicCwd,
    }).map((file) => {
        return xcode_1.PBXBuildFile.create(project, {
            fileRef: xcode_1.PBXFileReference.create(project, {
                path: path_1.default.basename(file),
                sourceTree: "<group>",
            }),
        });
    });
    // NOTE: Single-level only
    const intentFiles = (0, glob_1.sync)("*.intentdefinition", {
        absolute: true,
        cwd: magicCwd,
    }).map((file) => {
        return xcode_1.PBXFileReference.create(project, {
            lastKnownFileType: "file.intentdefinition",
            path: path_1.default.basename(file),
            sourceTree: "<group>",
        });
    });
    const intentBuildFiles = [0, 1].map((_) => intentFiles.map((file) => {
        return xcode_1.PBXBuildFile.create(project, {
            fileRef: file,
        });
    }));
    const assetFiles = [
        // All assets`
        // "assets/*",
        // NOTE: Single-level only
        "*.xcassets",
    ]
        .map((glob) => (0, glob_1.sync)(glob, {
        absolute: true,
        cwd: magicCwd,
    }).map((file) => {
        return xcode_1.PBXBuildFile.create(project, {
            fileRef: xcode_1.PBXFileReference.create(project, {
                path: path_1.default.basename(file),
                sourceTree: "<group>",
            }),
        });
    }))
        .flat();
    const resAssets = [];
    // TODO: Maybe just limit this to Safari?
    if (fs_1.default.existsSync(path_1.default.join(magicCwd, "assets"))) {
        // get top-level directories in `assets/` and append them to assetFiles as folder types
        fs_1.default.readdirSync(path_1.default.join(magicCwd, "assets")).forEach((file) => {
            if (file === ".DS_Store")
                return;
            const stat = fs_1.default.statSync(path_1.default.join(magicCwd, "assets", file));
            if (stat.isDirectory()) {
                resAssets.push(xcode_1.PBXBuildFile.create(project, {
                    fileRef: xcode_1.PBXFileReference.create(project, {
                        path: file,
                        sourceTree: "<group>",
                        lastKnownFileType: "folder",
                    }),
                }));
            }
            else if (stat.isFile()) {
                resAssets.push(xcode_1.PBXBuildFile.create(project, {
                    fileRef: xcode_1.PBXFileReference.create(project, {
                        path: file,
                        explicitFileType: file.endsWith(".js")
                            ? "sourcecode.javascript"
                            : file.endsWith(".json")
                                ? "text.json"
                                : file.endsWith(".html")
                                    ? "text.html"
                                    : file.endsWith(".css")
                                        ? "text.css"
                                        : "text",
                        sourceTree: "<group>",
                    }),
                }));
            }
        });
    }
    const alphaExtensionAppexBf = xcode_1.PBXBuildFile.create(project, {
        fileRef: xcode_1.PBXFileReference.create(project, {
            explicitFileType: "wrapper.app-extension",
            includeInIndex: 0,
            path: productName + ".appex",
            sourceTree: "BUILT_PRODUCTS_DIR",
        }),
        settings: {
            ATTRIBUTES: ["RemoveHeadersOnCopy"],
        },
    });
    project.rootObject.ensureProductGroup().props.children.push(
    // @ts-expect-error
    alphaExtensionAppexBf.props.fileRef);
    const widgetTarget = project.rootObject.createNativeTarget({
        buildConfigurationList: createConfigurationListForType(project, props),
        name: productName,
        productName,
        // @ts-expect-error
        productReference: alphaExtensionAppexBf.props.fileRef /* alphaExtension.appex */,
        productType: (0, target_1.productTypeForType)(props.type),
    });
    configureTargetWithKnownSettings(widgetTarget);
    const entitlementFiles = configureTargetWithEntitlements(widgetTarget);
    configureTargetWithPreview(widgetTarget);
    // CD0706062A2EBE2E009C1192
    widgetTarget.createBuildPhase(xcode_1.PBXSourcesBuildPhase, {
        files: [
            ...swiftFiles,
            ...intentBuildFiles[0],
            // ...entitlementFiles
        ],
        // CD0706152A2EBE2E009C1192 /* index.swift in Sources */,
        // CD07061A2A2EBE2F009C1192 /* alpha.intentdefinition in Sources */,
        // CD0706112A2EBE2E009C1192 /* alphaBundle.swift in Sources */,
        // CD0706132A2EBE2E009C1192 /* alphaLiveActivity.swift in Sources */,
    });
    widgetTarget.createBuildPhase(xcode_1.PBXFrameworksBuildPhase, {
        files: props.frameworks.map((framework) => getOrCreateBuildFile(getFramework(project, framework))),
    });
    widgetTarget.createBuildPhase(xcode_1.PBXResourcesBuildPhase, {
        files: [...assetFiles, ...resAssets],
    });
    const containerItemProxy = xcode_1.PBXContainerItemProxy.create(project, {
        containerPortal: project.rootObject,
        proxyType: 1,
        remoteGlobalIDString: widgetTarget.uuid,
        remoteInfo: productName,
    });
    const targetDependency = xcode_1.PBXTargetDependency.create(project, {
        target: widgetTarget,
        targetProxy: containerItemProxy,
    });
    // Add the target dependency to the main app, should be only one.
    mainAppTarget.props.dependencies.push(targetDependency);
    // Check if we need to add target dependencies to the widgetTarget
    (_c = props.dependencyTargets) === null || _c === void 0 ? void 0 : _c.forEach((dependencyTarget) => {
        const target = project.rootObject.props.targets.find((target) => target.props.productName === dependencyTarget);
        if (target) {
            // On a target the productReference is a PBXFileReference, however, its not in the types currently, so we check for it:
            let productReference;
            if ("productReference" in target.props &&
                xcode_1.PBXFileReference.is(target.props.productReference)) {
                productReference = target.props.productReference;
            }
            else {
                throw new Error(`You declared ${widgetTarget.props.productName} to depend on ${dependencyTarget}, but ${dependencyTarget} is invalid (missing appex reference) and can't be used!`);
            }
            const containerItemProxy = xcode_1.PBXContainerItemProxy.create(project, {
                containerPortal: project.rootObject,
                proxyType: 1,
                remoteGlobalIDString: target.uuid,
                remoteInfo: dependencyTarget,
            });
            const targetDependency = xcode_1.PBXTargetDependency.create(project, {
                target,
                targetProxy: containerItemProxy,
            });
            widgetTarget.props.dependencies.push(targetDependency);
            // We also need to add a build phase "Embed Foundation Extension" to the widget target
            widgetTarget.createBuildPhase(xcode_1.PBXCopyFilesBuildPhase, {
                dstSubfolderSpec: 13,
                buildActionMask: 2147483647,
                files: [
                    xcode_1.PBXBuildFile.create(project, {
                        fileRef: productReference,
                        settings: {
                            ATTRIBUTES: ["RemoveHeadersOnCopy"],
                        },
                    }),
                ],
                name: "Embed Foundation Extensions",
                runOnlyForDeploymentPostprocessing: 0,
            });
        }
        else {
            console.warn(`You declared ${widgetTarget.props.productName} to depend on ${dependencyTarget}, but ${dependencyTarget} couldn't be found in the project yet!`);
        }
    });
    const WELL_KNOWN_COPY_EXTENSIONS_NAME = props.type === "clip"
        ? "Embed App Clips"
        : props.type === "watch"
            ? "Embed Watch Content"
            : "Embed Foundation Extensions";
    // Could exist from a Share Extension
    const copyFilesBuildPhase = mainAppTarget.props.buildPhases.find((phase) => {
        if (xcode_1.PBXCopyFilesBuildPhase.is(phase)) {
            // TODO: maybe there's a safer way to do this? The name is not a good identifier.
            return phase.props.name === WELL_KNOWN_COPY_EXTENSIONS_NAME;
        }
    });
    if (copyFilesBuildPhase) {
        // Assume that this is the first run if there is no matching target that we identified from a previous run.
        copyFilesBuildPhase.props.files.push(alphaExtensionAppexBf);
    }
    else {
        const dstPath = { clip: "AppClips", watch: "Watch" }[props.type];
        if (dstPath) {
            mainAppTarget.createBuildPhase(xcode_1.PBXCopyFilesBuildPhase, {
                dstPath: "$(CONTENTS_FOLDER_PATH)/" + dstPath,
                dstSubfolderSpec: 16,
                buildActionMask: 2147483647,
                files: [alphaExtensionAppexBf],
                name: WELL_KNOWN_COPY_EXTENSIONS_NAME,
                runOnlyForDeploymentPostprocessing: 0,
            });
        }
        else {
            mainAppTarget.createBuildPhase(xcode_1.PBXCopyFilesBuildPhase, {
                dstSubfolderSpec: 13,
                buildActionMask: 2147483647,
                files: [alphaExtensionAppexBf],
                name: WELL_KNOWN_COPY_EXTENSIONS_NAME,
                runOnlyForDeploymentPostprocessing: 0,
            });
        }
    }
    const mainSourcesBuildPhase = mainAppTarget.getBuildPhase(xcode_1.PBXSourcesBuildPhase);
    // TODO: Idempotent
    mainSourcesBuildPhase === null || mainSourcesBuildPhase === void 0 ? void 0 : mainSourcesBuildPhase.props.files.push(...intentBuildFiles[1]);
    const protectedGroup = ensureProtectedGroup(project).createGroup({
        // This is where it gets fancy
        // TODO: The user should be able to know that this is safe to modify and won't be overwritten.
        name: path_1.default.basename(props.cwd),
        // Like `../alpha`
        path: props.cwd,
        sourceTree: "<group>",
        children: [
            // @ts-expect-error
            ...swiftFiles
                .map((buildFile) => buildFile.props.fileRef)
                .sort((a, b) => a.getDisplayName().localeCompare(b.getDisplayName())),
            // @ts-expect-error
            ...intentFiles.sort((a, b) => a.getDisplayName().localeCompare(b.getDisplayName())),
            // @ts-expect-error
            ...assetFiles
                .map((buildFile) => buildFile.props.fileRef)
                .sort((a, b) => a.getDisplayName().localeCompare(b.getDisplayName())),
            // @ts-expect-error
            ...entitlementFiles
                .map((buildFile) => buildFile.props.fileRef)
                .sort((a, b) => a.getDisplayName().localeCompare(b.getDisplayName())),
            // CD0706192A2EBE2F009C1192 /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = "<group>"; };
            // @ts-expect-error
            xcode_1.PBXFileReference.create(project, {
                path: "Info.plist",
                sourceTree: "<group>",
            }),
        ],
        // children = (
        //   CD0706102A2EBE2E009C1192 /* alphaBundle.swift */,
        //   CD0706122A2EBE2E009C1192 /* alphaLiveActivity.swift */,
        //   CD0706142A2EBE2E009C1192 /* index.swift */,
        //   CD0706162A2EBE2E009C1192 /* alpha.intentdefinition */,
        //   CD0706172A2EBE2F009C1192 /* Assets.xcassets */,
        //   CD0706192A2EBE2F009C1192 /* Info.plist */,
        // );
        // name = "expo:alpha";
        // path = "../alpha";
        // sourceTree = "<group>";
    });
    if (resAssets.length > 0) {
        protectedGroup.createGroup({
            name: "assets",
            path: "assets",
            sourceTree: "<group>",
            // @ts-expect-error
            children: resAssets
                .map((buildFile) => buildFile.props.fileRef)
                .sort((a, b) => a.getDisplayName().localeCompare(b.getDisplayName())),
        });
    }
    applyDevelopmentTeamIdToTargets();
    syncMarketingVersions();
    return project;
}
const PROTECTED_GROUP_NAME = "expo:targets";
function ensureProtectedGroup(project) {
    const hasProtectedGroup = project.rootObject.props.mainGroup
        .getChildGroups()
        .find((group) => group.getDisplayName() === PROTECTED_GROUP_NAME);
    const protectedGroup = hasProtectedGroup !== null && hasProtectedGroup !== void 0 ? hasProtectedGroup : xcode_1.PBXGroup.create(project, {
        name: PROTECTED_GROUP_NAME,
        sourceTree: "<group>",
    });
    if (!hasProtectedGroup) {
        project.rootObject.props.mainGroup.props.children.unshift(protectedGroup);
        // let libIndex = project.rootObject.props.mainGroup
        //   .getChildGroups()
        //   .findIndex((group) => group.getDisplayName() === "Libraries");
        // if (libIndex === -1) {
        //   libIndex = 0;
        // }
        // add above the group named "Libraries"
        // project.rootObject.props.mainGroup.props.children.splice(
        //   libIndex,
        //   0,
        //   protectedGroup
        // );
    }
    return protectedGroup;
}
