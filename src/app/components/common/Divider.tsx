import { C } from "../../../constants/colors";

export interface DividerProps {
  dark?: boolean;
}

export const Divider = ({ dark = false }: DividerProps) => (
  <div style={{ background: dark ? C.darkBorder : C.border }} className="h-px" />
);
export default Divider;
