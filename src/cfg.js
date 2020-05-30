const assert = require('assert');

const BasicBlock = require('./block');

class CFG {
	constructor(entry) {
		assert.ok(entry instanceof Vertex, 'expected entry to be vertex');
		this.entry = entry;
		this.vars = new Set();
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
		return this.entry.dfs(action);
	}

	toDot() {
		const vertices = this.AllVert().map(v => v.toDot()).join('\n');
		const edges = this.AllEdge().map(e => e.toDot()).join('\n');
		return 'digraph {\n' + vertices + '\n' + edges + '\n}';
	}

	findMin(v) {
		this.searchAnCut(v);
		return v.label;
	}

	searchAnCut(v) {
		if (v.ancestor === null) {
			return v;
		} else {
			const root = this.searchAnCut(v.ancestor);
			if (v.ancestor.label.sdom.index < v.label.sdom.index) {
				v.label = v.ancestor.label;
			}
			v.ancestor = root;
			return root;
		}
	}

	dominators() {
		this.preOrder.slice(1).reverse().forEach(v => {
			const inEdges = v.InEdge();
			inEdges.forEach(e => {
				const u = this.findMin(e.v1);
				if (u.sdom.index < v.sdom.index) {
					v.sdom = u.sdom;
				}
			});
			v.ancestor = v.parent;
			v.sdom.bucket.add(v.index);
			v.parent.bucket.forEach(ind => {
				const u = this.findMin(this.preOrder[ind]);
				if (u.sdom.index === v.sdom.index) {
					this.preOrder[ind].idom = this.preOrder[ind].sdom;
				} else {
					this.preOrder[ind].idom = u;
				}
			});
		});
		this.preOrder.slice(1).forEach(v => {
			if (v.idom.index !== v.sdom.index) {
				v.idom = v.idom.idom;
			}
		});
	}

	calcDF() {
		let ind = 0;
		this.preOrder = [];
		this.dfs(v => {
			this.preOrder.push(v);
			v.index = ind;
			ind++;
			if (v.inEdges.length !== 0) {
				v.parent = v.inEdges[0].v1;
			}
		});
		this.dominators(this.preOrder);
		const DF = new Map();
		this.preOrder.reverse().forEach(x => {
			DF.set(x.index, new Set());
			x.Succ().forEach(y => {
				if (y.idom.index !== x.index) {
					DF.get(x.index).add(y.index);
				}
			});
			x.Children().forEach(z => {
				DF.get(z.index).forEach(y => {
					if (y.idom.index !== x.index) {
						DF.get(x.index).add(y.index);
					}
				})
			});
		});
		this.DF = DF;
	}

	calcDFSet(s) {
		const res = new Set();
		s.forEach(v => {
			CFG.appendSet(res, this.DF.get(s.index));
		});
		return res;
	}

	static appendSet(a, b) {
		b.forEach(v => {
			a.add(v);
		});
	}

	calcDFPSet(s) {
		let res = new Set();
		let changed = true;
		let DFP = this.calcDFSet(s);
		while (changed) {
			changed = false;
			DFP = this.calcDFSet(CFG.appendSet(s, DFP));
			if (DFP.size !== res.size) {
				res = DFP;
				changed = true;
			}
		}
		return res;
	}

	insertPhis() {
		let iterCount = 0;
		const hasAlready = this.preOrder.map(() => 0);
		const work = this.preOrder.map(() => 0);
		const w = new Set();
		this.vars.forEach(varName => {
			iterCount++;
			const a = this.preOrder.filter(v => v.block.instructions.reduce((prev, current) => {
				return prev || (current instanceof BasicBlock.Assignment && current.name === varName);
			}, false));
			a.forEach(x => {
				work[x.index] = iterCount;
				w.add(x.index);
			});
			while (w.size !== 0) {
				const xIndex = w.values().next().value;
				w.delete(xIndex);
				const x = this.preOrder[xIndex];
				this.DF.get(x.index).forEach(y => {
					if (hasAlready[y] < iterCount) {
						const yBlock = this.preOrder[y].block;
						yBlock.instructions = [new BasicBlock.Phi(varName, [])].concat(yBlock.instructions);
						hasAlready[y] = iterCount;
						if (work[y] < iterCount) {
							work[y] = iterCount;
							w.add(y);
						}
					}
				})
			}
		});
	}

	static whichPred(y, x) {
		return y.Pred().findIndex(v => v.index === x.index);
	}

	renameVar() {
		const counters = new Map();
		const stacks = new Map();
		this.vars.forEach(v => {
			counters[v] = 0;
			stacks[v] = [];
		});
		this.Search(counters, stacks, this.entry);
	}

	Search(counters, stacks, x) {
		x.block.instructions.forEach(stmt => {
			if (stmt instanceof BasicBlock.Assignment) {
				stacks.forEach((v, k) => {
					stmt.applyVars(false, k, v[v.length - 1]);
				});
			}
			if (stmt instanceof BasicBlock.Assignment || stmt instanceof BasicBlock.Phi) {
				const i = counters.get(stmt.name);
				stmt.applyVars(true, stmt.name, i);
				counters.set(stmt.name, i + 1);
				stacks.get(stmt.name).push(i);
			}
		});
		x.Succ().forEach(y => {
			const j = CFG.whichPred(y, x);
			y.block.instructions.forEach(stmt => {
				if (stmt instanceof BasicBlock.Phi) {
					stacks.forEach((v, k) => {
						stmt.applyOperand(j, k, v[v.length - 1]);
					});
				}
			});
		});
		x.Children().forEach(y => {
			this.Search(counters, stacks, y);
		});
		x.block.instructions.forEach(stmt => {
			if (stmt instanceof BasicBlock.Assignment || stmt instanceof BasicBlock.Phi) {
				stacks.get(stmt.oldName).pop();
			}
		});
	}

	toSSA() {
		this.calcDF();
		this.insertPhis();
		this.renameVar();
	}
}

class Vertex {
	constructor(block) {
		assert.ok(block instanceof BasicBlock.BasicBlock);
		this.inEdges = [];
		this.outEdges = [];
		const phis = [];
		this.block = block;
		this.parent = null;
		this.ancestor = null;
		this.sdom = this;
		this.idom = null;
		this.label = this;
		this.bucket = new Set();
		this.index = null;
	}

	dfs(action) {
		const used = new Set();
		const stack = [this];
		while (stack.length !== 0) {
			const v = stack.pop();
			action(v);
			used.add(v.num);
			const childs = v.Succ().filter(c => !used.has(c.block.num));
			stack.push(...childs);
		}
	}

	Succ() {
		return this.outEdges.map(e => e.v2);
		// const res = [];
		// this.dfs(v => {
		// 	res.push(v);
		// });
		// return res;
	}

	Pred() {
		return this.inEdges.map(e => e.v1);
	}

	Children() {
		const res = [];
		this.dfs(v => {
			if (v.idom.index === this.index) {
				res.push(v);
			}
		});
		return res;
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

	dotString() {
		return this.block.instructions.map(i => i.toString()).join('\\n');
	}

	toDot() {
		const text = '\t' + this.dotString();
		return text + '  [shape = rectangle]';
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

	toDot() {
		return '\t' + this.v1.dotString() + ' -> ' + this.v2.dotString() + '  [label=\'' + this.label + '\']';
	}
}

const exp = module.exports;
exp.CFG = CFG;
exp.Vertex = Vertex;
exp.Edge = Edge;