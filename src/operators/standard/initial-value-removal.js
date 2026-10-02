const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class IVROperator {
  constructor() {
    this.ID = "IVR";
    this.name = "initial-value-removal";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    const handleNode = (node, funcName) => {
      if (node.initialValue && node.initialValue.range) {
        // جستجوی علامت = دقیقا قبل از شروع مقدار اولیه
        let start = source.lastIndexOf('=', node.initialValue.range[0]);
        if (start !== -1) {
          // در بر گرفتن فاصله‌های خالی قبل از مساوی
          while (start > 0 && (source[start - 1] === ' ' || source[start - 1] === '\t')) {
            start--;
          }
          const end = node.initialValue.range[1] + 1;
          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;
          const original = source.slice(start, end);

          mutations.push(new Mutation(file, funcName, start, end, startLine, endLine, original, "", this.ID));
        }
      }
    };

    visit({
      VariableDeclarationStatement: (node) => {
        const funcName = contextChecker.getFunctionName(visit, node.loc.start.line, node.loc.end.line);
        handleNode(node, funcName);
      },
      StateVariableDeclaration: (node) => {
        handleNode(node, "contract-level");
      }
    });

    return mutations;
  }
}

module.exports = IVROperator;