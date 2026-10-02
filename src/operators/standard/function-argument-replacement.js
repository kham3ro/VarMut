const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class FAROperator {
  constructor() {
    this.ID = "FAR";
    this.name = "function-argument-replacement";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      FunctionCall: (node) => {
        if (node.arguments && node.arguments.length >= 2 && 
            node.expression && node.expression.name !== "require" && node.expression.name !== "assert") {
          
          const arg0 = node.arguments[0];
          const arg1 = node.arguments[1];
          const start = arg0.range[0];
          const end = arg1.range[1] + 1;
          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;
          const original = source.slice(start, end);
          const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

          const arg0Text = source.slice(arg0.range[0], arg0.range[1] + 1);
          const arg1Text = source.slice(arg1.range[0], arg1.range[1] + 1);

          const replacement = `${arg1Text}, ${arg0Text}`;
          mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, replacement, this.ID));
        }
      }
    });

    return mutations;
  }
}

module.exports = FAROperator;