const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class LOROperator {
  constructor() {
    this.ID = "LOR";
    this.name = "logical-operator-replacement";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      BinaryOperation: (node) => {
        if (node.operator === "&&" || node.operator === "||") {
          const originalOp = node.operator;
          const replacementOp = originalOp === "&&" ? "||" : "&&";
          const start = node.left.range[1] + 1;
          const end = node.right.range[0];
          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;
          const original = source.slice(start, end);
          const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

          const replacement = original.replace(originalOp, replacementOp);
          mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, replacement, this.ID));
        }
      }
    });

    return mutations;
  }
}

module.exports = LOROperator;