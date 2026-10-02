const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class SOROperator {
  constructor() {
    this.ID = "SOR";
    this.name = "statement-order-reversal";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      Block: (node) => {
        if (node.statements && node.statements.length >= 2) {
          for (let i = 0; i < node.statements.length - 1; i++) {
            const stmt1 = node.statements[i];
            const stmt2 = node.statements[i + 1];

            const start = stmt1.range[0];
            const end = stmt2.range[1] + 1;
            const startLine = stmt1.loc.start.line;
            const endLine = stmt2.loc.end.line;
            const original = source.slice(start, end);
            const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

            const stmt1Text = source.slice(stmt1.range[0], stmt1.range[1] + 1);
            const stmt2Text = source.slice(stmt2.range[0], stmt2.range[1] + 1);

            // جابجایی ترتیب خط اول و دوم
            const replacement = `${stmt2Text}\n        ${stmt1Text}`;
            mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, replacement, this.ID));
          }
        }
      }
    });

    return mutations;
  }
}

module.exports = SOROperator;