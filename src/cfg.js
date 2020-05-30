const assert = require('assert');

class cfg {
	constructor(entry) {
		assert.ok(entry instanceof vertex, 'expected entry to be vertex');
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
			const childs = v.Succ().filter(c => !used.has(c.num));
			stack.push(...childs);
		}
	}
}

class vertex {
	constructor(num, block) {
		this.inEdges = [];
		this.outEdges = [];
		this.num = num;
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
}

class edge {
	constructor(v1, v2) {
		assert.ok(v1 instanceof vertex, 'expected v1 to be vertex');
		assert.ok(v2 instanceof vertex, 'expected v2 to be vertex');
		this.v1 = v1;
		this.v2 = v2;
	}
}

const exp = module.exports;
exp.cfg = cfg;
exp.vertex = vertex;
exp.edge = edge;