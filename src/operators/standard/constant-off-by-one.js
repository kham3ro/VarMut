const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class CRCROperator {
  constructor() {
    this.ID = "CRCR";
    this.name = "constant-off-by-one";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      NumberLiteral: (node) => {
        const value = parseInt(node.number, 10);
        if (!isNaN(value)) {
          const start = node.range[0];
          const end = node.range[1] + 1;
          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;
          const original = source.slice(start, end);
          const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

          // جهش اول: افزودن یک واحد (+1)
          mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, String(value + 1), this.ID));

          // جهش دوم: کسر یک واحد (-1 در صورت مثبت بودن)
          if (value > 0) {
            mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, String(value - 1), this.ID));
          }
        }
      }
    });

    return mutations;
  }
}

module.exports = CRCROperator;