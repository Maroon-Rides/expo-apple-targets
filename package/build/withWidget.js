"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const plist_1 = __importDefault(require("@expo/plist"));
const fs_1 = __importDefault(require("fs"));
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
const withIosColorset_1 = require("./colorset/withIosColorset");
const withImageAsset_1 = require("./icon/withImageAsset");
const withIosIcon_1 = require("./icon/withIosIcon");
const target_1 = require("./target");
const withEasCredentials_1 = require("./withEasCredentials");
const withXcodeChanges_1 = require("./withXcodeChanges");
let hasWarned = false;
function kebabToCamelCase(str) {
    return str.replace(/-([a-z])/g, function (g) {
        return g[1].toUpperCase();
    });
}
const withWidget = (config, props) => {
    // TODO: Magically based on the top-level folders in the `ios-widgets/` folder
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (props.icon && !/https?:\/\//.test(props.icon)) {
        props.icon = path_1.default.join(props.directory, props.icon);
    }
    const widgetDir = path_1.default
        .basename(props.directory)
        .replace(/\/+$/, "")
        .replace(/^\/+/, "");
    const widget = kebabToCamelCase(widgetDir);
    const widgetFolderAbsolutePath = path_1.default.join((_b = (_a = config._internal) === null || _a === void 0 ? void 0 : _a.projectRoot) !== null && _b !== void 0 ? _b : "", props.directory);
    const entitlementsFiles = (0, glob_1.sync)("*.entitlements", {
        absolute: true,
        cwd: widgetFolderAbsolutePath,
    });
    if (entitlementsFiles.length > 1) {
        throw new Error(`Found multiple entitlements files in ${widgetFolderAbsolutePath}`);
    }
    let entitlementsJson = props.entitlements;
    // If the user defined entitlements, then overwrite any existing entitlements file
    if (props.entitlements) {
        (0, config_plugins_1.withDangerousMod)(config, [
            "ios",
            async (config) => {
                var _a;
                const entitlementsFilePath = (_a = entitlementsFiles[0]) !== null && _a !== void 0 ? _a : 
                // Use the name `generated` to help indicate that this file should be in sync with the config
                path_1.default.join(widgetFolderAbsolutePath, `generated.entitlements`);
                if (entitlementsFiles[0]) {
                    console.log(`[${widget}] Replacing ${path_1.default.relative(widgetFolderAbsolutePath, entitlementsFiles[0])} with entitlements JSON from config`);
                }
                fs_1.default.writeFileSync(entitlementsFilePath, plist_1.default.build(props.entitlements));
                return config;
            },
        ]);
    }
    else {
        entitlementsJson = entitlementsFiles[0]
            ? plist_1.default.parse(fs_1.default.readFileSync(entitlementsFiles[0], "utf8"))
            : undefined;
    }
    // Ensure the entry file exists
    (0, config_plugins_1.withDangerousMod)(config, [
        "ios",
        async (config) => {
            if (!hasWarned) {
                hasWarned = true;
                console.warn("You're using an experimental Config Plugin that is subject to breaking changes and has no E2E tests.");
            }
            fs_1.default.mkdirSync(widgetFolderAbsolutePath, { recursive: true });
            const files = [
                ["Info.plist", (0, target_1.getTargetInfoPlistForType)(props.type)],
            ];
            // if (props.type === "widget") {
            //   files.push(
            //     [
            //       "index.swift",
            //       ENTRY_FILE.replace(
            //         "// Export widgets here",
            //         "// Export widgets here\n" + `        ${widget}()`
            //       ),
            //     ],
            //     [widget + ".swift", WIDGET.replace(/alpha/g, widget)],
            //     [widget + ".intentdefinition", INTENT_DEFINITION]
            //   );
            // }
            files.forEach(([filename, content]) => {
                const filePath = path_1.default.join(widgetFolderAbsolutePath, filename);
                if (!fs_1.default.existsSync(filePath)) {
                    fs_1.default.writeFileSync(filePath, content);
                }
            });
            return config;
        },
    ]);
    const targetName = (_c = props.name) !== null && _c !== void 0 ? _c : widget;
    const mainAppBundleId = config.ios.bundleIdentifier;
    const bundleId = ((_d = props.bundleIdentifier) === null || _d === void 0 ? void 0 : _d.startsWith("."))
        ? mainAppBundleId + props.bundleIdentifier
        : (_e = props.bundleIdentifier) !== null && _e !== void 0 ? _e : `${mainAppBundleId}.${targetName}`;
    (0, withXcodeChanges_1.withXcodeChanges)(config, {
        name: targetName,
        cwd: "../" +
            path_1.default.relative(config._internal.projectRoot, path_1.default.resolve(props.directory)),
        deploymentTarget: (_f = props.deploymentTarget) !== null && _f !== void 0 ? _f : "16.4",
        bundleId,
        icon: props.icon,
        hasAccentColor: !!((_g = props.colors) === null || _g === void 0 ? void 0 : _g.$accent),
        // @ts-expect-error: who cares
        currentProjectVersion: ((_h = config.ios) === null || _h === void 0 ? void 0 : _h.buildNumber) || 1,
        frameworks: (0, target_1.getFrameworksForType)(props.type).concat(props.frameworks || []),
        dependencyTargets: props.dependencyTargets || [],
        type: props.type,
        teamId: props.appleTeamId,
    });
    config = (0, withEasCredentials_1.withEASTargets)(config, {
        targetName,
        bundleIdentifier: bundleId,
        entitlements: entitlementsJson,
    });
    if (props.images) {
        Object.entries(props.images).forEach(([name, image]) => {
            (0, withImageAsset_1.withImageAsset)(config, {
                image,
                name,
                cwd: props.directory,
            });
        });
    }
    withConfigColors(config, props);
    if (props.icon) {
        (0, withIosIcon_1.withIosIcon)(config, {
            type: props.type,
            cwd: props.directory,
            // TODO: read from the top-level icon.png file in the folder -- ERR this doesn't allow for URLs
            iconFilePath: props.icon,
            isTransparent: ["action"].includes(props.type),
        });
    }
    return config;
};
const withConfigColors = (config, props) => {
    var _a;
    props.colors = (_a = props.colors) !== null && _a !== void 0 ? _a : {};
    // const colors: NonNullable<Props["colors"]> = props.colors ?? {};
    // You use the WidgetBackground and `$accent` to style the widget configuration interface of a configurable widget. Apple could have chosen names to make that more obvious.
    // https://useyourloaf.com/blog/widget-background-and-accent-color/
    // i.e. when you press and hold on a widget to configure it, the background color of the widget configuration interface changes to the background color we set here.
    // if (props.widgetBackgroundColor)
    //   colors["$widgetBackground"] = props.widgetBackgroundColor;
    // if (props.accentColor) colors["AccentColor"] = props.accentColor;
    if (props.colors) {
        Object.entries(props.colors).forEach(([name, color]) => {
            (0, withIosColorset_1.withIosColorset)(config, {
                cwd: props.directory,
                name,
                color: typeof color === "string" ? color : color.light,
                darkColor: typeof color === "string" ? undefined : color.dark,
            });
        });
    }
    return config;
};
exports.default = withWidget;
