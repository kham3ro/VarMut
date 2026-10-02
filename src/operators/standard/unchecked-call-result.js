const contextChecker = require("../contextChecker");
const Mutation = require("../../mutation");

class UCROperator {
  constructor() {
    this.ID = "UCR";
    this.name = "unchecked-call-result";
  }

  getMutations(file, source, visit) {
    const mutations = [];

    visit({
      // شناسایی اعتبارسنجی خروجی فراخوانی call داخل require(success)
      FunctionCall: (node) => {
        if (node.expression && node.expression.name === "require") {
          if (node.arguments && node.arguments.length > 0) {
            const firstArg = node.arguments[0];
            const argSource = source.slice(firstArg.range[0], firstArg.range[1] + 1);

            // اگر شرط بررسی یک متغیر موفقیت فراخوانی مانند success یا sent باشد
            if (argSource === "success" || argSource === "sent" || argSource === "ok") {
              const start = firstArg.range[0];
              const end = firstArg.range[1] + 1;
              const startLine = node.loc.start.line;
              const endLine = node.loc.end.line;
              const original = argSource;
              const functionName = contextChecker.getFunctionName(visit, startLine, endLine);

              const replacement = "true /* UCR: unchecked call result */";
              mutations.push(new Mutation(file, functionName, start, end, startLine, endLine, original, replacement, this.ID));
            }
          }
        }
      }
    });

    return mutations;
  }
}

module.exports = UCROperator;