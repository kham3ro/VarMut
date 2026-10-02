const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class ICROperator {
  constructor() {
    this.ID = "ICR";
    this.name = "if-construct-removal";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      IfStatement: (node) => {
        if (node.condition) {
          const start = node.condition.range[0];
          const end = node.condition.range[1] + 1;
          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;
          const original = source.slice(start, end);
          const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

          mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, "true", this.ID));
          mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, "false", this.ID));
        }
      }
    });

    return mutations;
  }
}

module.exports = ICROperator;