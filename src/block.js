const assert = require('assert');

let counter = 0;

class BasicBlock {
	constructor() {
		this.instructions = [];
		this.num = counter++;
	}

	addInstruction(i) {
		assert.ok(i instanceof Value, 'expected instruction to be Value');
		this.instructions.push(i);
	}
}

class Value {
	constructor() {
	}
}

class Assignment extends Value {
	constructor(name, expr) {
		super();
		assert.ok(typeof name === 'string', 'expected name to be string');
		assert.ok(expr instanceof Value, 'expected expr to be Value');
		this.name = name;
		this.expr = expr;
	}

	applyVars(isLeft, name, count) {
		if (isLeft && this.name === name) {
			this.oldName = this.name;
			this.name += '_' + count;
		}
		this.arg0.applyVars(name, count);
		this.arg1.applyVars(name, count);
	}

	toString() {
		return this.name + ' = ' + this.expr.toString();
	}
}

class Expr extends Value {
	constructor(op, arg0, arg1) {
		super();
		assert.ok(['+', '-', '*', '/'].includes(op), 'expected op to be one of following: +, -, *, /');
		assert.ok(arg0 instanceof Value, 'expected arg0 to be Value');
		assert.ok(arg1 instanceof Value, 'expected arg1 to be Value');
		this.op = op;
		this.arg0 = arg0;
		this.arg1 = arg1;
	}

	applyVars(name, count) {
		this.arg0.applyVars(name, count);
		this.arg1.applyVars(name, count);
	}

	toString() {
		return this.arg0.toString() + ' ' + this.op + ' ' + this.arg1.toString();
	}
}

class Cond extends Value {
	constructor(op, arg0, arg1) {
		super();
		assert.ok(['<', '<=', '>', '>=', '==', '!='].includes(op), 'expected op to be one of following: <. <=, >, >=, ==, !=');
		assert.ok(arg0 instanceof Value, 'expected arg0 to be Value');
		assert.ok(arg1 instanceof Value, 'expected arg1 to be Value');
		this.op = op;
		this.arg0 = arg0;
		this.arg1 = arg1;
	}

	applyVars(name, count) {
		this.arg0.applyVars(name, count);
		this.arg1.applyVars(name, count);
	}

	toString() {
		return this.arg0.toString() + ' ' + this.op + ' ' + this.arg1.toString() + '?';
	}
}

class Return extends Value {
	constructor(value) {
		super();
		assert.ok(value instanceof Value, 'expected arg0 to be Value');
		this.value = value;
	}

	applyVars(name, count) {
		this.value.applyVars(name, count);
	}

	toString() {
		return 'return ' + this.value.toString();
	}
}

class Identifier extends Value {
	constructor(name) {
		super();
		assert.ok(typeof name === 'string', 'expected name to be string');
		this.name = name;
	}

	applyVars(name, count) {
		if (this.name === name) {
			this.name += '_' + count;
		}
	}

	toString() {
		return this.name;
	}
}

class Literal extends Value {
	constructor(value) {
		super();
		assert.ok(typeof value === 'number', 'expected value to be number');
		this.value = value;
	}

	applyVars(name, count) {
		return;
	}

	toString() {
		return this.value.toString();
	}
}

class Phi extends Value {
	constructor(name, args) {
		super();
		assert.ok(typeof name === 'string', 'expected name to be string');
		assert.ok(args instanceof Array, 'expected args to be array');
		args.forEach(a => {
			assert.ok(a instanceof Identifier, 'expected a to be identifier')
		});
		this.name = name;
		this.args = args;
	}

	applyVars(isLeft, name, count) {
		this.oldName = this.name;
		this.name += '_' + count;
	}

	applyOperand(j, name, count) {
		this.args[j] = name + '_' + count;
	}

	toString() {
		return this.name + ' = phi(' + this.args.map(a => a.toString()).join(', ') + ')';
	}
}

module.exports.BasicBlock = BasicBlock;
module.exports.Value = Value;
module.exports.Cond = Cond;
module.exports.Expr = Expr;
module.exports.Assignment = Assignment;
module.exports.Identifier = Identifier;
module.exports.Literal = Literal;
module.exports.Phi = Phi;
module.exports.Return = Return;