import { C } from "../../../constants/colors";

export interface DividerProps {
  dark?: boolean;
  className?: string;
}

export const Divider = ({
  dark = false,
  className = "",
}: DividerProps) => (
  <div
    style={{ background: dark ? C.darkBorder : C.border }}
    className={`h-px w-full ${className}`}
  />
);

export default Divider;