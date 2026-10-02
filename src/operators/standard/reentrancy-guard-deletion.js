const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class REENTORDEROperator {
  constructor() {
    this.ID = "REENT_ORDER";
    this.name = "reentrancy-guard-deletion";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      ModifierInvocation: (node) => {
        if (node.name === "nonReentrant" || node.name === "lock") {
          const start = node.range[0];
          const end = node.range[1] + 1;
          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;
          const original = source.slice(start, end);
          const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

          const replacement = "/* REENT_ORDER: guard removed */";
          mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, replacement, this.ID));
        }
      }
    });

    return mutations;
  }
}

module.exports = REENTORDEROperator;