import { ConfigPlugin } from "@expo/config-plugins";
import { Config } from "./config";
export type Props = Config & {
    directory: string;
};
declare const withWidget: ConfigPlugin<Props>;
export default withWidget;
