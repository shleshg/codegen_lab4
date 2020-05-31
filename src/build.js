const IR = require('./ir');
const BasicBlock = require('./block');

function generateAssignment(ir, ast) {
	const name = ast.name;
	if (ast.expr) {
		return ir.CreateAssignment(name, generateExpr(ir, ast.expr));
	} else {
		return ir.CreateAssignment(name, new BasicBlock.Literal(0));
	}
}

function generateArg(ast) {
	if (typeof ast === 'number') {
		return new BasicBlock.Literal(ast);
	} else {
		return new BasicBlock.Identifier(ast);
	}
}

function generateCond(ir, ast) {
	const op = ast.op;
	const arg0 = generateArg(ast.args[0]);
	const arg1 = generateArg(ast.args[1]);
	switch (op) {
		case '>':
			return ir.CreateICmpSGT(arg0, arg1);
		case '>=':
			return ir.CreateICmpSGE(arg0, arg1);
		case '<':
			return ir.CreateICmpSLT(arg0, arg1);
		case '<=':
			return ir.CreateICmpSLE(arg0, arg1);
		case '==':
			return ir.CreateICmpEQ(arg0, arg1);
		case '!=':
			return ir.CreateICmpNE(arg0, arg1);
		default:
			console.log('unknown cond op: ', op);
			return null;
	}
}

function generateExpr(ir, ast) {
	const op = ast.op;
	if (op) {
		const arg0 = generateArg(ast.args[0]);
		const arg1 = generateArg(ast.args[1]);
		switch (op) {
			case '+':
				return ir.CreateAdd(arg0, arg1);
			case '-':
				return ir.CreateSub(arg0, arg1);
			case '*':
				return ir.CreateMul(arg0, arg1);
			case '/':
				return ir.CreateDiv(arg0, arg1);
			default:
				console.log('unknown expr op: ', op);
				return null;
		}
	} else {
		return generateArg(ast.args[0]);
	}
}

function generateIf(ir, ast) {
	const cond = generateCond(ir, ast.cond);
	const thenBB = new BasicBlock.BasicBlock();
	const elseBB = new BasicBlock.BasicBlock();
	const mergeBB = new BasicBlock.BasicBlock();

	if (ast.alt) {
		ir.CreateCondBr(cond, thenBB, elseBB);
	} else {
		ir.CreateCondBr(cond, thenBB, mergeBB);
	}

	ir.SetEntryPoint(thenBB);
	generateBlocks(ir, ast.conv);
	ir.CreateBr(mergeBB);
	if (ast.alt) {
		ir.SetEntryPoint(elseBB);
		generateBlocks(ir, ast.alt);
		ir.CreateBr(mergeBB);
	}
	ir.SetEntryPoint(mergeBB);
}

function generateWhile(ir, ast) {
	const cond = generateCond(ir, ast.cond);
	const prev = ir.GetInsertBlock();
	const loopBB = new BasicBlock.BasicBlock();
	const postLoop = new BasicBlock.BasicBlock();

	ir.CreateCondBr(cond, loopBB, postLoop);

	ir.SetEntryPoint(loopBB);

	generateBlocks(ir, ast.body);

	ir.CreateCondBr(cond, loopBB, postLoop);

	ir.SetEntryPoint(postLoop);
}

function generateBlocks(ir, ast) {
	ast.forEach(a => {
		switch (a.type) {
			case 'VarDeclaration':
				generateAssignment(ir, a.expr);
				break;
			case 'AssignExpr':
				generateAssignment(ir, a.expr);
				break;
			case 'IfStmt':
				generateIf(ir, a);
				break;
			case 'WhileStmt':
				generateWhile(ir, a);
				break;
			default:
				console.log('unknown block type: ', a.type);
				break;
		}
	});
}

function generateReturn(ir, ast) {
	if (typeof ast.ret === 'number') {
		ir.CreateRet(new BasicBlock.Literal(ast.ret));
	} else {
		ir.CreateRet(new BasicBlock.Identifier(ast.ret));
	}
}

module.exports = function (program) {
	const ir = new IR();
	const bb = new BasicBlock.BasicBlock();
	ir.SetEntryPoint(bb);
	generateBlocks(ir, program.body);
	generateReturn(ir, program);
	return ir.cfg;
};