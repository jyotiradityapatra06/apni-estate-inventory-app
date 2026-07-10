export const fmt = (n: number): string => {
  const s = n.toFixed(0);
  const [int, dec] = s.split(".");
  let result = int;
  if (int.length > 3) {
    const last3 = int.slice(-3);
    const rest = int.slice(0, -3);
    const groups = [];
    for (let i = rest.length; i > 0; i -= 2) groups.unshift(rest.slice(Math.max(0, i - 2), i));
    result = groups.join(",") + "," + last3;
  }
  return "₹" + result + (dec ? "." + dec : "");
};

export const fmtK = (n: number): string => {
  if (n >= 100000) return "₹" + (n / 100000).toFixed(1) + "L";
  if (n >= 1000) return "₹" + (n / 1000).toFixed(0) + "K";
  return fmt(n);
};
