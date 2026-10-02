const Mutation = require("../../mutation");

const ID = "MCR";

const cryptoReplacements = {
  addmod: "mulmod",
  mulmod: "addmod",
  keccak256: "sha256",
  sha256: "keccak256",
  ripemd160: "sha256",
  ecrecover: "ripemd160"
};

const safeMathReplacements = {
  add: "sub",
  sub: "add",
  mul: "div",
  div: "mul"
};

module.exports = {
  ID: ID,
  name: "math-and-crypto-function-replacement",
  visitor: (file, source, pushMutation) => {
    let functionName = "";

    return {
      FunctionDefinition: (node) => {
        functionName = node.name || "";
      },
      ModifierDefinition: (node) => {
        functionName = node.name || "";
      },
      FunctionCall: (node) => {
        if (!node || !node.range || !node.loc) return;

        if (node.expression && node.expression.type === "Identifier") {
          const name = node.expression.name;
          if (cryptoReplacements[name]) {
            const start = node.expression.range[0];
            const end = node.expression.range[1];
            const startLine = node.expression.loc ? node.expression.loc.start.line : node.loc.start.line;
            const endLine = node.expression.loc ? node.expression.loc.end.line : node.loc.end.line;
            const original = source.slice(start, end);
            const replacement = cryptoReplacements[name];

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
      },
      MemberAccess: (node) => {
        if (!node || !node.range || !node.loc) return;

        const memberName = node.memberName;
        if (safeMathReplacements[memberName] || cryptoReplacements[memberName]) {
          const replacementName = safeMathReplacements[memberName] || cryptoReplacements[memberName];
          const start = node.range[0];
          const end = node.range[1];
          const startLine = node.loc.start.line;
          const endLine = node.loc.end.line;

          const original = source.slice(start, end);
          const memberIndex = original.lastIndexOf(memberName);
          if (memberIndex !== -1) {
            const memberStart = start + memberIndex;
            const memberEnd = memberStart + memberName.length;
            const origMember = source.slice(memberStart, memberEnd);

            pushMutation(
              new Mutation(
                file,
                functionName,
                memberStart,
                memberEnd,
                startLine,
                endLine,
                origMember,
                replacementName,
                ID
              )
            );
          }
        }
      }
    };
  }
};