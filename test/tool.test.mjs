import test from "node:test";
import assert from "node:assert/strict";
import {buildReport,readSpec} from "../docs/tool.mjs";
import {parseCsv,writeCsv} from "../docs/csv.mjs";
const spec={version:1,title:"Sample",category:"Group",measure:"Amount",operation:"sum",filterColumn:"Quarter",filterValue:"q1",limit:2};
test("filters, groups, sums and keeps totals for more groups than are displayed",()=>{
  const report=buildReport("Group,Quarter,Amount\nA,Q1,2\nA,Q2,6\nB,Q1,-3\nC,Q1,4",spec);
  assert.deepEqual(report.rows,[["C",4],["A",2]]);
  assert.equal(report.total,3);
  assert.equal(report.groups,3);
  assert.equal(report.accepted,3);
  assert.throws(()=>buildReport("Group,Quarter,Amount\nA,Q1,foo",spec),/numeric/);
});
test("supports quoted records and prevents formula interpretation on export",()=>{
  assert.deepEqual(parseCsv('\uFEFFA,B\r\n"x,y","z\np"\r\n').records,[["x,y","z\np"]]);
  assert.match(writeCsv([["  =9", -9]]),/"'  =9","-9"/);
  assert.deepEqual(readSpec(JSON.stringify({...spec,dataset:["fixture"]})),spec);
  assert.throws(()=>readSpec(JSON.stringify({...spec,limit:0})),/limits/);
});
