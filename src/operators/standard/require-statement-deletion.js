const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class RTSDOperator {
  constructor() {
    this.ID = "RTSD";
    this.name = "require-statement-deletion";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      ExpressionStatement: (node) => {
        if (node.expression && 
            node.expression.type === "FunctionCall" && 
            node.expression.expression &&
            (node.expression.expression.name === "require" || node.expression.expression.name === "assert")) {
          
          const start = node.range[0];
          const end = node.range[1] + 1;
          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;
          const original = source.slice(start, end);
          const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

          const replacement = "/* RTSD: Check Removed */";
          mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, replacement, this.ID));
        }
      }
    });

    return mutations;
  }
}

module.exports = RTSDOperator;