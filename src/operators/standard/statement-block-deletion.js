const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class SBDOperator {
  constructor() {
    this.ID = "SBD";
    this.name = "statement-block-deletion";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      Block: (node) => {
        // حذف بدنه بلاک در صورتی که بیش از یک دستور داشته باشد
        if (node.statements && node.statements.length > 1) {
          const firstStmt = node.statements[0];
          const lastStmt = node.statements[node.statements.length - 1];

          const start = firstStmt.range[0];
          const end = lastStmt.range[1] + 1;
          const startLine = firstStmt.loc.start.line;
          const endLine = lastStmt.loc.end.line;
          const original = source.slice(start, end);
          const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

          const replacement = "/* SBD: statement block removed */";
          mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, replacement, this.ID));
        }
      }
    });

    return mutations;
  }
}

module.exports = SBDOperator;