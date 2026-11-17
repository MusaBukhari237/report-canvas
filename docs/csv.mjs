export function parseCsv(input) {
  const source = input.replace(/^\uFEFF/, "");
  const records = [];
  let value = "", row = [], quoted = false, ended = false;
  for (let at = 0; at <= source.length; at++) {
    const char = source[at];
    if (quoted) {
      if (char === undefined) throw Error("Unclosed quoted CSV field.");
      if (char === '"' && source[at+1] === '"') { value += '"'; at++; }
      else if (char === '"') { quoted = false; ended = true; }
      else value += char;
      continue;
    }
    if (char === undefined || char === "," || char === "\n" || char === "\r") {
      row.push(value);
      value = "";
      ended = false;
      if (char !== ",") {
        if (row.length > 1 || row[0] !== "") records.push(row);
        row = [];
        if (char === "\r" && source[at+1] === "\n") at++;
      }
    } else {
      if (ended || (char === '"' && value)) throw Error("Unexpected characters around a quoted CSV field.");
      if (char === '"') quoted = true;
      else value += char;
    }
  }
  const columns = records.shift()?.map(value => value.trim());
  if (!columns?.length || columns.some(value => !value) || new Set(columns).size !== columns.length) throw Error("Use a CSV with unique, non-empty headers.");
  if (columns.length > 80 || records.length > 25000) throw Error("Use up to 80 columns and 25,000 records.");
  const wrong = records.findIndex(row => row.length !== columns.length);
  if (wrong !== -1) throw Error("Record " + (wrong + 2) + " has the wrong number of columns.");
  return {columns, records};
}

export function writeCsv(rows) {
  return rows.map(row => row.map(value => {
    const text = String(value ?? "");
    const safe = typeof value === "string" && /^(?:\s*[=+\-@]|[\t\n\r])/.test(text) ? "'" + text : text;
    return '"' + safe.replaceAll('"','""') + '"';
  }).join(",")).join("\r\n") + "\r\n";
}
