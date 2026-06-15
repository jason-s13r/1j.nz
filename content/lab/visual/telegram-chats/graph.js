import { DataSet, Network } from "vis-network/standalone";
import allNodes from "./nodes.json";
import allEdges from "./edges.json";

const filteredNodes = allNodes.filter((n) => n.title !== "Unknown");

const toMap = new Map(filteredNodes.map((n) => [n.id, allEdges.filter((e) => e.to === n.id)]));
const fromMap = new Map(filteredNodes.map((n) => [n.id, allEdges.filter((e) => e.from === n.id)]));

const styledNodes = filteredNodes
  .toSorted((a, b) => b.value - a.value)
  .map((n, i) => {
    const size = 1.5 * (2 + (n.mass || 0) + fromMap.get(n.id).length + toMap.get(n.id).length);
    const node = {
      ...n,
      title: n.name || n.label || n.id,
      label: n.name || n.label || n.id,
      mass: n.kind === "user" ? (n.mass || 1) : size,
      value: n.kind === "user" ? 1 : size,
      size: n.kind === "user" ? 1 : size,
      color: {
        highlight: `#fff`,
        border: "#fff",
        background: n.color ? n.color : n.kind === "user" ? "#0ff" : "#888",
      },
      font: {
        color: "#fff",
      },
    };
    return node;
  });

const nodeMap = new Map(styledNodes.map((n) => [n.id, n]));

const styledEdges = allEdges.map((e) => {
  const node = nodeMap.get(e.to);
  const color = node
    ? {
        highlight: node.color.highlight,
        color: node.color.background,
      }
    : undefined;
  const edge = {
    ...e,
    color,
  };
  return edge;
});

// create a network
var container = document.getElementById("network");
var nodes = new DataSet(styledNodes);
var edges = new DataSet(styledEdges);

// provide the data in the vis format
var data = {
  nodes: nodes,
  edges: edges,
};
var options = {};

// initialize your network!
var network = new Network(container, data, {});
