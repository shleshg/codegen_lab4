const assert = require('assert');

const BasicBlock = require('./block');
const CFG = require('./cfg');

class IR {
	constructor() {
		this.vertices = new Map();
	}

	SetEntryPoint(entry) {
		assert.ok(entry instanceof BasicBlock, 'expected entry to be BasicBlock');
		if (!this.cfg) {
			const v = new CFG.Vertex(entry);
			this.cfg = new CFG.CFG(v);
			this.vertices.set(entry.num, v);
			this.currentVertex = v;
		} else {
			this.currentVertex = this.vertices.get(entry.num);
		}
		this.entry = entry;
	}

	CreateCondBr(cond, consequent, alternate) {
		assert.ok(cond instanceof BasicBlock.Cond);
		this.entry.addInstruction(cond);
		const consequentV = this.vertices.get(consequent.num);
		const alternateV = this.vertices.get(alternate.num);
		if (consequentV) {
			this.currentVertex.AppendChild(consequentV, 'yes');
		} else {
			const newV = new CFG.Vertex(consequent);
			this.vertices.set(consequent.num, newV);
			this.currentVertex.AppendChild(newV, 'no');
		}
		if (alternateV) {
			this.currentVertex.AppendChild(alternateV, 'no');
		} else {
			const newV = new CFG.Vertex(alternate);
			this.vertices.set(alternate.num, newV);
			this.currentVertex.AppendChild(newV, 'no');
		}
	}

	CreateDeclaration(name, value) {
		this.entry.addInstruction(new BasicBlock.Assignment(name, value));
	}

	CreateAssignment(name, value) {
		this.entry.addInstruction(new BasicBlock.Assignment(name, value));
	}

	CreateAdd(arg0, arg1) {
		return new BasicBlock.Expr('+', arg0, arg1);
	}

	CreateSub(arg0, arg1) {
		return new BasicBlock.Expr('-', arg0, arg1);
	}

	CreateMul(arg0, arg1) {
		return new BasicBlock.Expr('*', arg0, arg1);
	}

	CreateDiv(arg0, arg1) {
		return new BasicBlock.Expr('/', arg0, arg1);
	}

	CreateICmpSGT(arg0, arg1) {
		return new BasicBlock.Cond('>', arg0, arg1);
	}

	CreateICmpSGE(arg0, arg1) {
		return new BasicBlock.Cond('>=', arg0, arg1);
	}

	CreateICmpSLT(arg0, arg1) {
		return new BasicBlock.Cond('<', arg0, arg1);
	}

	CreateICmpSLE(arg0, arg1) {
		return new BasicBlock.Cond('<=', arg0, arg1);
	}

	CreateICmpEQ(arg0, arg1) {
		return new BasicBlock.Cond('==', arg0, arg1);
	}

	CreateICmpNE(arg0, arg1) {
		return new BasicBlock.Cond('!=', arg0, arg1);
	}

	CreateRet(arg) {
		this.entry.addInstruction(new BasicBlock.Return(arg));
	}
}