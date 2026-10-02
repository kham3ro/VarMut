const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class UNINITUPGOperator {
  constructor() {
    this.ID = "UNINIT_UPG";
    this.name = "uninitialized-upgradeable-logic";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      FunctionCall: (node) => {
        // شناسایی فراخوانی _disableInitializers() در کانستراکتور
        if (node.expression && node.expression.name === "_disableInitializers") {
          const start = node.range[0];
          const end = node.range[1] + 1;
          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;
          const original = source.slice(start, end);
          const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

          const replacement = "/* UNINIT_UPG: _disableInitializers() removed */";
          mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, replacement, this.ID));
        }
      }
    });

    return mutations;
  }
}

module.exports = UNINITUPGOperator; 