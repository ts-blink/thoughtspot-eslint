/**
 * @fileoverview Restricts usage of <a> tags and enforces description for disable comments
 * @author ThoughtSpot TSE Team
 */
"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    docs: {
      description: "Restricts usage of <a> tags in favor of <Link> component for consistent link handling",
      recommended: true,
    },
    fixable: null,
    schema: [],
  },

  create: function (context) {
    const filename = context.getFilename();
    const sourceCode = context.getSourceCode();

    if (filename.match(/\.(spec|test)\.(tsx?|jsx?)$/)) {
      return {};
    }

    return {
      JSXOpeningElement: function (node) {
        if (node.name && node.name.name === 'a') {
          // Check if there's a disable comment for this rule
          const comments = sourceCode.getCommentsBefore(node);
          const disableComment = comments.find(comment => {
            const commentValue = comment.value.trim();
            return (
              (commentValue.includes('eslint-disable-next-line') || 
               commentValue.includes('eslint-disable-line')) &&
              commentValue.includes('thoughtspot-eslint/restrict-anchor-tags')
            );
          });

          if (disableComment) {
            // Check if the disable comment has a proper description
            const commentValue = disableComment.value;
            const hasDescriptionSeparator = commentValue.includes('--');
            
            if (!hasDescriptionSeparator) {
              context.report(
                node,
                "Anchor tag disable comment must include a description after '--'. Required format: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars) [TSE-Reviewed]"
              );
              return;
            }

            // Extract description after '--'
            const descriptionMatch = commentValue.match(/--\s*(.+)$/s);
            const description = descriptionMatch ? descriptionMatch[1].trim() : '';
            
            // Check minimum length (20 characters)
            if (description.length < 20) {
              context.report(
                node,
                `Anchor tag disable comment description is too short (${description.length} chars, minimum 20 required). Required format: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars) [TSE-Reviewed]`
              );
              return;
            }

            // Check for TSE review confirmation
            if (!description.match(/\[TSE-Reviewed\]/i)) {
              context.report(
                node,
                "Anchor tag disable comment must include '[TSE-Reviewed]' to confirm TSE team review. Required format: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars) [TSE-Reviewed]"
              );
              return;
            }

            return;
          }

          context.report(
            node,
            "Use <Link> component instead of <a> tag. For exceptions for non react components, In case your link is static and wouldn't be used by main app in UI, use: // eslint-disable-next-line thoughtspot-eslint/restrict-anchor-tags -- [SCAL-ID] Detailed reason (min 20 chars) [TSE-Reviewed]. Please request TSE team review."
          );
        }
      },
    };
  },
};
