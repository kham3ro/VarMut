const Mutation = require("../../mutation");

const ID = "ASR";

module.exports = {
  ID: ID,
  name: "assignment-statement-removal",
  visitor: (file, source, pushMutation) => {
    let functionName = "";

    return {
      FunctionDefinition: (node) => {
        functionName = node.name || "";
      },
      ExpressionStatement: (node) => {
        if (!node || !node.range || !node.loc) return;

        if (
          node.expression &&
          (node.expression.type === "BinaryOperation" ||
            node.expression.type === "Assignment")
        ) {
          const validOperators = [
            "=",
            "+=",
            "-=",
            "*=",
            "/=",
            "%=",
            "^=",
            "&=",
            "|="
          ];
          if (
            node.expression.operator &&
            !validOperators.includes(node.expression.operator)
          ) {
            return;
          }

          const start = node.range[0];
          const end = node.range[1];
          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;
          const original = source.slice(start, end);
          const replacement = "/* ASR: assignment removed */";

          pushMutation(
            new Mutation(
              file,
              functionName,
              start,
              end,
              startLine,
              endLine,
              original,
              replacement,
              ID
            )
          );
        }
      }
    };
  }
};