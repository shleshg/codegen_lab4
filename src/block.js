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
	toString() {
		return this.name + ' = ' + this.expr.toString();
	}
}

class Expr extends Value {
	constructor(op, arg0, arg1) {
		super();
		assert.ok(['+', '-', '*', '/'].find(op), 'expected op to be one of following: +, -, *, /');
		assert.ok(arg0 instanceof Value, 'expected arg0 to be Value');
		assert.ok(arg1 instanceof Value, 'expected arg1 to be Value');
		this.op = op;
		this.arg0 = arg0;
		this.arg1 = arg1;
	}
	toString() {
		return this.arg0.toString() + ' ' + this.op + ' ' + this.arg1.toString();
	}
}

class Cond extends Value {
	constructor(op, arg0, arg1) {
		super();
		assert.ok(['<', '<=', '>', '>=', '==', '!='].find(op), 'expected op to be one of following: <. <=, >, >=, ==, !=');
		assert.ok(arg0 instanceof Value, 'expected arg0 to be Value');
		assert.ok(arg1 instanceof Value, 'expected arg1 to be Value');
		this.op = op;
		this.arg0 = arg0;
		this.arg1 = arg1;
	}
	toString() {
		return this.arg0.toString() + ' ' + this.op + ' ' + this.arg1.toString();
	}
}

class Return extends Value {
	constructor(value) {
		super();
		assert.ok(value instanceof Value, 'expected arg0 to be Value');
		this.value = value;
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
	toString() {
		return this.value.toString();
	}
}

class Phi extends Value {
	constructor(a, b) {
		super();
		assert.ok(a instanceof Identifier, 'expected a to be identifier');
		assert.ok(b instanceof Identifier, 'expected b to be identifier');
		this.a = a;
		this.b = b;
	}
	toString() {
		return 'phi(' + this.a.toString() + ', ' + this.b.toString() + ')';
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