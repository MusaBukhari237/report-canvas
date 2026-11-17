import {parseCsv} from "./csv.mjs";
function short(value, limit) { return typeof value === "string" && value.length <= limit; }
export function readSpec(text) {
  let spec;
  try { spec=JSON.parse(text); } catch { throw Error("Report configuration must be valid JSON."); }
  if (spec?.version !== 1 || !short(spec.title,90) || !short(spec.category,160) || !short(spec.measure,160) ||
      !["count","sum"].includes(spec.operation) || !short(spec.filterColumn,160) || !short(spec.filterValue,300) ||
      !Number.isInteger(spec.limit) || spec.limit < 1 || spec.limit > 30) throw Error("Report configuration format or limits are invalid.");
  return {version:1,title:spec.title,category:spec.category,measure:spec.measure,operation:spec.operation,filterColumn:spec.filterColumn,filterValue:spec.filterValue,limit:spec.limit};
}

export function buildReport(csv, setup) {
  const spec = readSpec(JSON.stringify(setup));
  const {columns,records}=parseCsv(csv);
  const category=columns.indexOf(spec.category), measure=columns.indexOf(spec.measure), filter=columns.indexOf(spec.filterColumn);
  if (category < 0 || (spec.operation === "sum" && measure < 0) || (spec.filterColumn && filter < 0)) throw Error("Choose report columns that exist in the CSV.");
  const groups=new Map();
  let accepted=0, sum=0;
  for (const [index,row] of records.entries()) {
    if (filter >= 0 && row[filter].trim().toLowerCase() !== spec.filterValue.trim().toLowerCase()) continue;
    let amount=1;
    if (spec.operation==="sum") {
      const raw=row[measure].trim();
      if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(raw) || !Number.isFinite(Number(raw))) throw Error("Expected a numeric measure on record " + (index+2) + ".");
      amount=Number(raw);
    }
    const key=row[category].trim();
    const next=(groups.get(key)??0)+amount;
    sum+=amount;
    if (!Number.isFinite(next) || !Number.isFinite(sum)) throw Error("Report values exceed the supported number range.");
    groups.set(key,next);
    accepted++;
  }
  const sorted=[...groups].toSorted((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]));
  return {title:spec.title||"Report",rows:sorted.slice(0,spec.limit),groups:groups.size,accepted,total:sum};
}
