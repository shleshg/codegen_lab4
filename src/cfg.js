const assert = require('assert');

const BasicBlock = require('./block');

class CFG {
	constructor(entry) {
		assert.ok(entry instanceof Vertex, 'expected entry to be vertex');
		this.entry = entry;
	}
	AllVert() {
		const res = [];
		this.dfs((v => {
			res.push(v);
		}));
		return res;
	}
	AllEdge() {
		const res = [];
		this.dfs((v => {
			res.push(...v.OutEdge())
		}));
		return res;
	}
	dfs(action) {
		const used = new Set();
		const stack = [this.entry];
		while (stack.length !== 0) {
			const v = stack.pop();
			action(v);
			used.add(v.num);
			const childs = v.Succ().filter(c => !used.has(c.block.num));
			stack.push(...childs);
		}
	}
	toDot() {

	}
	toSSA() {

	}
}

class Vertex {
	constructor(block) {
		assert.ok(block instanceof BasicBlock);
		this.inEdges = [];
		this.outEdges = [];
		this.block = block;
	}
	Succ() {
		return this.outEdges.map(e => e.v2);
	}
	Pred() {
		return this.inEdges.map(e => e.v1);
	}
	InEdge() {
		return this.inEdges;
	}
	OutEdge() {
		return this.outEdges;
	}
	AppendChild(child, label) {
		assert.ok(child instanceof Vertex, 'expected child to be vertex');
		const e = new Edge(this, child, label);
		this.outEdges.push(e);
	}
}

class Edge {
	constructor(v1, v2, label) {
		assert.ok(v1 instanceof Vertex, 'expected v1 to be vertex');
		assert.ok(v2 instanceof Vertex, 'expected v2 to be vertex');
		assert.ok(typeof label === 'string', 'expected label to be string');
		this.v1 = v1;
		this.v2 = v2;
		this.label = label;
	}
}

const exp = module.exports;
exp.CFG = CFG;
exp.Vertex = Vertex;
exp.Edge = Edge;