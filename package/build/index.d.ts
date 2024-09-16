import { ConfigPlugin } from "@expo/config-plugins";
import type { Config } from "./config";
export declare const withTargetsDir: ConfigPlugin<{
    appleTeamId: string;
    match?: string;
    root?: string;
}>;
export { Config };
