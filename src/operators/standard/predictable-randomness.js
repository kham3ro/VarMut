const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class PRandOperator {
  constructor() {
    this.ID = "PRand";
    this.name = "predictable-randomness-injection";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      FunctionCall: (node) => {
        // شناسایی توابع هش سازنده تصادف مانند keccak256
        if (node.expression && (node.expression.name === "keccak256" || node.expression.name === "sha256")) {
          if (node.arguments && node.arguments.length > 0) {
            const firstArg = node.arguments[0];
            const start = firstArg.range[0];
            const end = node.arguments[node.arguments.length - 1].range[1] + 1;
            const startLine = node.loc.start.line;
            const endLine = node.loc.end.line;
            const original = source.slice(start, end);
            const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

            const replacement = "abi.encodePacked(block.timestamp, block.prevrandao)";
            mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, replacement, this.ID));
          }
        }
      }
    });

    return mutations;
  }
}

module.exports = PRandOperator;