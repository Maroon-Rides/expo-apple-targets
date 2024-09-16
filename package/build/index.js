"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withTargetsDir = void 0;
const glob_1 = require("glob");
const path_1 = __importDefault(require("path"));
const withWidget_1 = __importDefault(require("./withWidget"));
const withXcparse_1 = require("./withXcparse");
// A target can depend on another target using the `dependencyTargets` property.
// Therefor, we need to execute the targets in the right order.
const sortTargetProps = (configs) => {
    const targetMap = new Map();
    configs.forEach((target) => targetMap.set(target.name, target));
    const visited = new Set();
    const sorted = [];
    function visit(config) {
        if (visited.has(config.name)) {
            return;
        }
        visited.add(config.name);
        if (config.dependencyTargets) {
            config.dependencyTargets.forEach((depName) => {
                if (targetMap.has(depName)) {
                    visit(targetMap.get(depName));
                }
            });
        }
        sorted.push(config);
    }
    configs.forEach((target) => visit(target));
    return sorted;
};
const withTargetsDir = (config, { appleTeamId, root = "./targets", match = "*" }) => {
    const projectRoot = config._internal.projectRoot;
    const targets = (0, glob_1.sync)(`${root}/${match}/expo-target.config.@(json|js)`, {
        // const targets = globSync(`./targets/action/expo-target.config.@(json|js)`, {
        cwd: projectRoot,
        absolute: true,
    });
    const targetProps = targets.map((configPath) => ({
        appleTeamId,
        ...require(configPath),
        directory: path_1.default.relative(projectRoot, path_1.default.dirname(configPath)),
    }));
    const sortedTargetProps = sortTargetProps(targetProps);
    // Now we need to reverse the targets order. Thats because we will call withMod consecutively.
    // When we call withMod#1 then withMod#2, the execution order of the mods will be withMod#2 then withMod#1.
    // Thus we have to reverse …
    sortedTargetProps.reverse();
    sortedTargetProps.forEach((targetConfig) => {
        config = (0, withWidget_1.default)(config, targetConfig);
    });
    return (0, withXcparse_1.withXcodeProjectBetaBaseMod)(config);
};
exports.withTargetsDir = withTargetsDir;
module.exports = exports.withTargetsDir;
