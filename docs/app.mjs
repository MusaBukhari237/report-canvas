const el=id=>document.getElementById(id), output=()=>el("result");
let urls=[];
function show(message) {
  for(const url of urls) URL.revokeObjectURL(url);
  urls=[];
  output().replaceChildren();
  const summary=document.createElement("p");
  summary.className="result-summary";
  summary.setAttribute("aria-live","polite");
  summary.textContent=message;
  output().append(summary);
}
function paragraph(text) {
  const p=document.createElement("p");
  p.textContent=text;
  output().append(p);
}
function run(callback) {
  el("run").onclick=async()=>{
    el("run").disabled=true;
    try{await callback();}catch(error){show(error.message);}
    finally{el("run").disabled=false;}
  };
}
function options(id,values,first=null) {
  const select=el(id);
  select.replaceChildren();
  if(first!==null) select.add(new Option(first,""));
  for(const value of values) select.add(new Option(value,value));
}
function table(rows) {
  const wrap=document.createElement("div"), data=document.createElement("table"), head=data.createTHead(), body=data.createTBody();
  wrap.className="table-wrap";
  rows.forEach((row,index)=>{
    const tr=(index?body:head).insertRow();
    for(const value of row){
      const cell=document.createElement(index?"td":"th");
      cell.textContent=String(value??"—");
      if(!index)cell.scope="col";
      tr.append(cell);
    }
  });
  wrap.append(data); output().append(wrap);
}
function bars(rows,description) {
  const figure=document.createElement("figure"), title=document.createElement("figcaption");
  title.textContent=description;
  figure.append(title);
  const max=rows.reduce((value,[,sample])=>Math.max(value,Math.abs(sample)),0)||1;
  for(const [label,value] of rows){
    const row=document.createElement("div"), name=document.createElement("span"), meter=document.createElement("meter"), amount=document.createElement("span");
    row.className="bar";
    name.textContent=label||"(blank)";
    amount.textContent=Number(value.toPrecision(8)).toLocaleString("en");
    meter.value=Math.abs(value);
    meter.max=max;
    meter.setAttribute("aria-label",name.textContent+" magnitude");
    row.append(name,meter,amount);
    figure.append(row);
  }
  output().append(figure);
}
function download(name,contents,type) {
  const url=URL.createObjectURL(new Blob([contents],{type}));
  urls.push(url);
  const anchor=document.createElement("a");
  anchor.className="button quiet export";
  anchor.textContent="Download "+name;
  anchor.download=name;
  anchor.href=url;
  output().append(anchor);
}
import {buildReport,readSpec} from "./tool.mjs";
import {parseCsv,writeCsv} from "./csv.mjs";
const all=["category","measure","filter"];
function columns(){
  let header=[];
  try{header=parseCsv(el("source").value).columns;}catch{}
  for(const id of all){
    const old=el(id).value;
    options(id,header,id==="filter"?"No filter":null);
    if(header.includes(old)&&id!=="filter") el(id).value=old;
    if(id==="filter"&&header.includes(old))el(id).value=old;
  }
  if(!el("measure").value&&header.length)el("measure").value=header.at(-1);
}
const setup=()=>({version:1,title:el("title").value,category:el("category").value,measure:el("measure").value,
  operation:el("operation").value,filterColumn:el("filter").value,filterValue:el("match").value,limit:Number(el("limit").value)});
function render(){
  const spec=setup(), result=buildReport(el("source").value,spec);
  show(result.groups+" groups · "+result.accepted+" matching records · "+Number(result.total.toPrecision(9))+" total");
  bars(result.rows,result.title);
  const rows=[[spec.category,spec.operation==="sum"?spec.measure:"Records"],...result.rows];
  table(rows);
  download("report-summary.csv",writeCsv(rows),"text/csv");
  download("report-setup.json",JSON.stringify(spec,null,2)+"\n","application/json");
}
el("source").oninput=columns;
el("sample").onclick=()=>{
  el("source").value="Channel,Quarter,Units\nWebsite,Q1,38\nReferral,Q1,20\nEvents,Q1,14\nWebsite,Q2,26\nReferral,Q2,13\nEvents,Q2,7";
  columns();
  el("category").value="Channel"; el("measure").value="Units"; el("filter").value="";
  el("operation").value="sum"; el("match").value="";
};
el("apply").onclick=()=>{
  try{
    const spec=readSpec(el("spec").value);
    const {columns:header}=parseCsv(el("source").value);
    if(!header.includes(spec.category)||(spec.operation==="sum"&&!header.includes(spec.measure))||
       (spec.filterColumn&&!header.includes(spec.filterColumn))) throw Error("The loaded CSV does not match this setup.");
    for(const [id,key] of Object.entries({title:"title",category:"category",measure:"measure",operation:"operation",filter:"filterColumn",match:"filterValue",limit:"limit"})) el(id).value=spec[key];
    render();
  }catch(error){show(error.message);}
};
run(render);
