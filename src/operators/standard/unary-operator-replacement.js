const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class UOROperator {
  constructor() {
    this.ID = "UOR";
    this.name = "unary-operator-replacement";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      UnaryOperation: (node) => {
        if (node.operator === "++" || node.operator === "--") {
          const originalOp = node.operator;
          const replacementOp = originalOp === "++" ? "--" : "++";

          let start, end;
          if (node.isPrefix) {
            start = node.range[0];
            end = start + 2;
          } else {
            end = node.range[1] + 1;
            start = end - 2;
          }

          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;
          const original = source.slice(start, end);
          const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

          mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, replacementOp, this.ID));
        }
      }
    });

    return mutations;
  }
}

module.exports = UOROperator;