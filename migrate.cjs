const fs = require('fs');
const path = require('path');

// Configure input and output file paths
const sourceFile = path.join(__dirname, 'createjs-source.js');
const outputFile = path.join(__dirname, 'createjs-clean.ts');

try {
	// Read the original 18,000 line source file
	let code = fs.readFileSync(sourceFile, 'utf8');
	console.log("Processing source file...");
  // Step 0: Convert the global var assignment into an exported namespace block
  code = code.replace(/^var\s+createjs\s*=\s*\{\}\s*;?/m, 'export namespace createjs {');

	// 1. Remove prototype variable alias boilerplate: var p = ClassName.prototype;
	code = code.replace(/^[\t ]*var\s+p\s*=\s*([A-Za-z0-9_]+)\.prototype\s*;?/gm, '');

	// 2. Map and inject inheritance hooks by looking ahead for createjs.extend macros
	// Converts 'export function Child() {}' to 'export class Child extends Parent {'
	code = code.replace(
		/^export\s+function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/gm,
		(match, className, args) => {
			// Dynamically construct a regex to scan the file for this specific class inheritance assignment
			const extendRegex = new RegExp(`createjs\\.extend\\(${className},\\s*([A-Za-z0-9_]+)\\)`);
			const hasParent = code.match(extendRegex);
			
			if (hasParent) {
				const parentClassName = hasParent[1];
				return `export class ${className} extends ${parentClassName} {\n\tconstructor(${args}) {`;
			}
			return `export class ${className} {\n\tconstructor(${args}) {`;
		}
	);

	// 3. Convert prototype method declarations to modern ES6 class methods
	// Finds: p.methodName = function(args) { ...
	// Converts to: methodName(args) { ...
	code = code.replace(
		/^[\t ]*p\.([A-Za-z0-9_]+)\s*=\s*function\s*\(([^)]*)\)\s*\{/gm,
		'\t$1($2) {'
	);

	// 4. Strip out residual structural macros that are no longer needed
	code = code.replace(/^[\t ]*createjs\.extend\([^)]+\);?/gm, '');

	// 5. Clean up old global namespace attachment assignments at the bottom of blocks
	// Removes: createjs.Event = Event;
	code = code.replace(/^[\t ]*createjs\.([A-Za-z0-9_]+)\s*=\s*\1\s*;?/gm, '');

  // 6. Close the ES6 class definition blocks before the IIFE wrapper closes
  // Finds: // }());
  // Converts to: }\n// }());
  code = code.replace(/^[\t ]*\/\/\s*\}\(\)\);/gm, '}\n// }());');

  // 7. Convert legacy static method assignments to modern ES6 trailing static assignments
  // Finds: EventDispatcher.initialize = function(target) {
  // Converts to: static initialize(target) { ... attached directly onto the constructor object layout
  code = code.replace(
    /^([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\s*=\s*function\s*\(([^)]*)\)\s*\{/gm,
    'static function $2($3) {\n\t// Static Method Refactored\n'
  );

  // Step 8: Insert the closing namespace bracket directly in front of the final export line
  // Finds: if(typeof module !== "undefined" && typeof module.exports !== "undefined") module.exports = this.createjs;
  // Converts to: }\nif(typeof module !== "undefined" && typeof module.exports !== "undefined") module.exports = this.createjs;
  code = code.replace(
    /^(if\(typeof module !== "undefined"[\s\S]*?module\.exports\s*=\s*this\.createjs;?)/m,
    '}\n$1'
);

	// Write the refactored modern codebase back to disk
	fs.writeFileSync(outputFile, code, 'utf8');
	console.log("Refactoring complete! Output saved to: createjs-clean.ts");

} catch (error) {
	console.error("An error occurred during migration processing:", error.message);
}
