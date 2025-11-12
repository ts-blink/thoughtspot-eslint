const stylelint = require('stylelint');

const ruleName = 'thoughtspot/restrict-external-variables-css-overrides';
const messages = stylelint.utils.ruleMessages(ruleName, {
    rejected: (varName) =>
        `Do not override CSS variable "${varName}" from _external_variables.css. These variables should only be defined in _external_variables.css. If you need to override, use: /* stylelint-disable-next-line thoughtspot/restrict-external-variables-css-overrides -- [SCAL-276989] Detailed reason (min 20 chars) */. Please request TSE team review.`,
});

const ruleFunction = (primaryOption, secondaryOptions, context) => {
    return (root, result) => {
        const validOptions = stylelint.utils.validateOptions(result, ruleName, {
            actual: primaryOption,
        });

        if (!validOptions) {
            return;
        }

        // Skip _external_variables files
        const inputFile = root.source.input.file || '';
        if (inputFile.includes('_external_variables')) {
            return;
        }

        // Walk through all declarations in the CSS
        root.walkDecls((decl) => {
            // Check if the property starts with --ts-var-
            if (decl.prop && decl.prop.startsWith('--ts-var-')) {
                stylelint.utils.report({
                    message: messages.rejected(decl.prop),
                    node: decl,
                    result,
                    ruleName,
                });
            }
        });
    };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;

module.exports = stylelint.createPlugin(ruleName, ruleFunction);