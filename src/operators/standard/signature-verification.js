const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class SIGVERIFOperator {
  constructor() {
    this.ID = "SIG_VERIF";
    this.name = "signature-verification-bypass";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      FunctionCall: (node) => {
        if (node.expression && node.expression.name === "require") {
          if (node.arguments && node.arguments.length > 0) {
            const condition = node.arguments[0];
            const condStart = condition.range[0];
            const condEnd = condition.range[1] + 1;
            const condSource = source.slice(condStart, condEnd);

            // شناسایی شرط‌های مرتبط با ecrecover یا recover
            if (condSource.includes("ecrecover") || condSource.includes("recover")) {
              const startLine = node.loc.start.line;
              const endLine = node.loc.end.line;
              const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

              const replacement = "true /* SIG_VERIF: bypassed */";
              mutations.push(new Mutation(file, functionName, condStart, condEnd, startLine, endLine, condSource, replacement, this.ID));
            }
          }
        }
      }
    });

    return mutations;
  }
}

module.exports = SIGVERIFOperator;